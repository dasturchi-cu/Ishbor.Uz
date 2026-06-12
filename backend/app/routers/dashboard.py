"""Dashboard batch endpointlar — HTTP va DB so'rovlarini kamaytirish."""

from fastapi import APIRouter, HTTPException, Query, status
from supabase import Client

from app.database import get_supabase_admin
from app.db_utils import run_query
from app.deps import UserAuthDep, UserAuthWithProfileDep
from app.review_stats import batch_review_stats
from app.routers.reviews import _enrich_reviews, _enrich_reviews_freelancer
from app.routers.notifications import count_unread_notifications
from app.timing_log import timed

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _stats_from_reviews(reviews: list[dict]) -> dict:
    ratings = [r["rating"] for r in reviews if r.get("rating") is not None]
    if not ratings:
        return {"average": 0, "count": 0}
    return {"average": round(sum(ratings) / len(ratings), 1), "count": len(ratings)}


def _notification_unread_count(supabase, user_id: str) -> int:
    try:
        return count_unread_notifications(supabase, user_id)
    except Exception:
        return 0


def _build_badges(supabase, user_id: str) -> dict:
    """httpx sync client thread-safe emas — parallel ThreadPool ishlatilmaydi."""
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


def _build_badges_auth(auth: UserAuthDep) -> dict:
    return _build_badges(get_supabase_admin(), auth.user_id)


def _build_home(auth: UserAuthDep, role: str, *, supabase: Client | None = None) -> dict:
    user_id = auth.user_id
    supabase = supabase or get_supabase_admin()

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
    projects: list[dict] = []
    if role == "freelancer":
        services_result = run_query(
            lambda: supabase.table("services")
            .select("*")
            .eq("freelancer_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        services = services_result.data or []
    else:
        projects_result = run_query(
            lambda: supabase.table("projects")
            .select("*")
            .eq("client_id", user_id)
            .order("created_at", desc=True)
            .limit(50)
            .execute()
        )
        projects = projects_result.data or []

    reputation_result = run_query(
        lambda: supabase.table("user_reputation")
        .select("*")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    reputation = reputation_result.data[0] if reputation_result.data else None

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
    with timed("dashboard.badges", user_id=auth.user_id):
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
    with timed("dashboard.summary", user_id=auth.user_id, role=role):
        profile = auth.profile
        home = _build_home(auth, role)
        badges = _build_badges(get_supabase_admin(), auth.user_id)
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
