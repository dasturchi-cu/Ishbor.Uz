"""Dashboard batch endpointlar — HTTP va DB so'rovlarini kamaytirish."""

from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter, HTTPException, Query, status

from app.database import get_supabase_admin
from app.db_utils import run_query
from app.deps import UserAuthDep, UserAuthWithProfileDep
from app.review_stats import batch_review_stats
from app.routers.reviews import _enrich_reviews, _enrich_reviews_freelancer

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _stats_from_reviews(reviews: list[dict]) -> dict:
    ratings = [r["rating"] for r in reviews if r.get("rating") is not None]
    if not ratings:
        return {"average": 0, "count": 0}
    return {"average": round(sum(ratings) / len(ratings), 1), "count": len(ratings)}


def _notification_unread_count(supabase, user_id: str) -> int:
    result = run_query(
        lambda: supabase.table("notifications")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .is_("read_at", "null")
        .execute()
    )
    return int(result.count or 0)


def _build_badges(supabase, user_id: str) -> dict:
    def _message_unread() -> int:
        result = run_query(
            lambda: supabase.table("messages")
            .select("id", count="exact")
            .eq("receiver_id", user_id)
            .is_("read_at", "null")
            .execute()
        )
        return int(result.count or 0)

    with ThreadPoolExecutor(max_workers=2) as pool:
        msg_future = pool.submit(_message_unread)
        notif_future = pool.submit(_notification_unread_count, supabase, user_id)
        return {
            "message_unread": msg_future.result(),
            "notification_unread": notif_future.result(),
        }


def _build_badges_auth(auth: UserAuthDep) -> dict:
    return _build_badges(auth.supabase, auth.user_id)


def _build_home(auth: UserAuthDep, role: str) -> dict:
    user_id = auth.user_id
    supabase = auth.supabase

    def _orders() -> list[dict]:
        result = run_query(
            lambda: supabase.table("orders")
            .select("*, services(title, category)")
            .or_(f"client_id.eq.{user_id},freelancer_id.eq.{user_id}")
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )
        return result.data or []

    def _services() -> list[dict]:
        if role != "freelancer":
            return []
        result = run_query(
            lambda: supabase.table("services")
            .select("*")
            .eq("freelancer_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data or []

    def _projects() -> list[dict]:
        if role != "client":
            return []
        result = run_query(
            lambda: supabase.table("projects")
            .select("*")
            .eq("client_id", user_id)
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )
        return result.data or []

    def _reputation() -> dict | None:
        result = run_query(
            lambda: supabase.table("user_reputation")
            .select("*")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    with ThreadPoolExecutor(max_workers=4) as pool:
        orders_future = pool.submit(_orders)
        role_data_future = pool.submit(_services if role == "freelancer" else _projects)
        reputation_future = pool.submit(_reputation)
        orders = orders_future.result()
        role_data = role_data_future.result()
        reputation = reputation_future.result()

    services = role_data if role == "freelancer" else []
    projects = role_data if role == "client" else []

    review_stats = {"average": 0.0, "count": 0}
    if role == "freelancer":
        stats_map = batch_review_stats(supabase, [user_id])
        avg, count = stats_map.get(user_id, (0.0, 0))
        review_stats = {"average": avg, "count": count}

    return {
        "orders": orders,
        "services": services,
        "projects": projects,
        "review_stats": review_stats,
        "reputation": reputation,
    }


@router.get("/badges")
def dashboard_badges(auth: UserAuthDep):
    return _build_badges_auth(auth)


@router.get("/home")
def dashboard_home(
    auth: UserAuthDep,
    role: str = Query(..., pattern="^(freelancer|client)$"),
):
    return _build_home(auth, role)


@router.get("/overview")
def dashboard_overview(
    auth: UserAuthDep,
    role: str = Query(..., pattern="^(freelancer|client)$"),
):
    """Dashboard bosh sahifa: home + badge bitta so'rovda."""
    return {**_build_home(auth, role), "badges": _build_badges_auth(auth)}


def _fetch_profile(auth: UserAuthDep) -> dict:
    result = run_query(
        lambda: auth.supabase.table("profiles").select("*").eq("id", auth.user_id).single().execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil topilmadi")
    return result.data


@router.get("/summary")
def dashboard_summary(
    auth: UserAuthWithProfileDep,
    role: str = Query(..., pattern="^(freelancer|client)$"),
):
    """Bitta so'rov: profil, wallet, home stats, badge countlar, review stats."""
    profile = auth.profile
    with ThreadPoolExecutor(max_workers=2) as pool:
        home_future = pool.submit(_build_home, auth, role)
        badges_future = pool.submit(_build_badges, auth.supabase, auth.user_id)
        home = home_future.result()
        badges = badges_future.result()
    return {
        "profile": profile,
        "wallet_balance": profile.get("wallet_balance") or 0,
        "orders": home["orders"],
        "services": home["services"],
        "projects": home["projects"],
        "review_stats": home["review_stats"],
        "reputation": home["reputation"],
        "badges": badges,
    }


@router.get("/reviews")
def dashboard_reviews(
    auth: UserAuthDep,
    role: str = Query(..., pattern="^(freelancer|client)$"),
):
    """Sharhlar sahifasi: ro'yxat + statistika bitta so'rovda."""
    user_id = auth.user_id
    supabase = get_supabase_admin()

    if role == "client":
        result = run_query(
            lambda: supabase.table("reviews")
            .select("*")
            .eq("reviewer_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        reviews = _enrich_reviews_freelancer(supabase, result.data or [])
    else:
        result = run_query(
            lambda: supabase.table("reviews")
            .select("*")
            .eq("freelancer_id", user_id)
            .eq("is_verified", True)
            .order("created_at", desc=True)
            .execute()
        )
        reviews = _enrich_reviews(supabase, result.data or [])

    return {"reviews": reviews, "stats": _stats_from_reviews(reviews)}
