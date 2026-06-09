"""Dashboard batch endpointlar — HTTP va DB so'rovlarini kamaytirish."""

from fastapi import APIRouter, HTTPException, Query, status

from app.database import get_supabase_admin
from app.db_utils import run_query
from app.deps import UserAuthDep
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


def _build_badges(auth: UserAuthDep) -> dict:
    user_id = auth.user_id
    supabase = auth.supabase
    msg_result = run_query(
        lambda: supabase.table("messages")
        .select("id", count="exact")
        .eq("receiver_id", user_id)
        .is_("read_at", "null")
        .execute()
    )
    return {
        "message_unread": int(msg_result.count or 0),
        "notification_unread": _notification_unread_count(supabase, user_id),
    }


def _build_home(auth: UserAuthDep, role: str) -> dict:
    user_id = auth.user_id
    supabase = auth.supabase

    orders_result = run_query(
        lambda: supabase.table("orders")
        .select("*, services(title, category)")
        .or_(f"client_id.eq.{user_id},freelancer_id.eq.{user_id}")
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    orders = orders_result.data or []

    services: list[dict] = []
    if role == "freelancer":
        svc_result = run_query(
            lambda: supabase.table("services")
            .select("*")
            .eq("freelancer_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        services = svc_result.data or []

    projects: list[dict] = []
    if role == "client":
        proj_result = run_query(
            lambda: supabase.table("projects")
            .select("*")
            .eq("client_id", user_id)
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )
        projects = proj_result.data or []

    review_stats = {"average": 0.0, "count": 0}
    if role == "freelancer":
        stats_map = batch_review_stats(supabase, [user_id])
        avg, count = stats_map.get(user_id, (0.0, 0))
        review_stats = {"average": avg, "count": count}

    rep_result = run_query(
        lambda: supabase.table("user_reputation")
        .select("*")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    reputation = rep_result.data[0] if rep_result.data else None

    return {
        "orders": orders,
        "services": services,
        "projects": projects,
        "review_stats": review_stats,
        "reputation": reputation,
    }


@router.get("/badges")
def dashboard_badges(auth: UserAuthDep):
    return _build_badges(auth)


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
    return {**_build_home(auth, role), "badges": _build_badges(auth)}


def _fetch_profile(auth: UserAuthDep) -> dict:
    result = run_query(
        lambda: auth.supabase.table("profiles").select("*").eq("id", auth.user_id).single().execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil topilmadi")
    return result.data


@router.get("/summary")
def dashboard_summary(
    auth: UserAuthDep,
    role: str = Query(..., pattern="^(freelancer|client)$"),
):
    """Bitta so'rov: profil, wallet, home stats, badge countlar, review stats."""
    profile = _fetch_profile(auth)
    home = _build_home(auth, role)
    badges = _build_badges(auth)
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
