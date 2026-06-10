import re

from fastapi import APIRouter, HTTPException, Query, Request, status

from app.platform_services import log_activity, log_audit

REFERRAL_BONUS = 50_000



from app.database import get_supabase_admin
from app.db_utils import run_query

from app.deps import OptionalUserId, OptionalUserIdLight, UserAuthDep

from app.analytics_service import build_user_analytics
from app.review_stats import batch_review_stats, batch_trust_scores

from app.schemas import (
    NotificationPrefsResponse,
    NotificationPrefsUpdate,
    ProfilePublicResponse,
    ProfileResponse,
    ProfileRoleUpdate,
    ProfileUpdate,
    ReferralApply,
    ReferralStatsResponse,
    UiPreferencesUpdate,
    UsernameCheckResponse,
)



router = APIRouter(prefix="/profiles", tags=["profiles"])

_PUBLIC_PROFILE_TABLE = "public_freelancer_profiles"
_PUBLIC_PROFILE_COLUMNS = (
    "id, role, username, full_name, bio, region, specialty, avatar_url, created_at, profile_views, "
    "skills, hourly_rate, experience_level, is_verified, portfolio_urls, languages"
)
_UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE,
)

DEFAULT_NOTIF_PREFS = {
    "emailNewOrders": True,
    "emailPromotions": False,
    "smsUrgent": False,
    "telegramConnect": False,
    "chatMuted": False,
}


def normalize_username(raw: str) -> str:
    slug = raw.strip().lower().lstrip("@")
    slug = "".join(c for c in slug if c.isalnum() or c == "_")
    return slug


def _is_uuid(value: str) -> bool:
    return bool(_UUID_RE.match(value.strip()))


def _fetch_public_profile_row(supabase, identifier: str) -> dict:
    """UUID yoki username — xavfsiz public_freelancer_profiles view."""
    ident = identifier.strip()
    query = supabase.table(_PUBLIC_PROFILE_TABLE).select(_PUBLIC_PROFILE_COLUMNS)
    if _is_uuid(ident):
        query = query.eq("id", ident)
    else:
        slug = normalize_username(ident)
        if len(slug) < 3:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil topilmadi")
        query = query.eq("username", slug)
    result = run_query(lambda: query.limit(1).execute())
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil topilmadi")
    return result.data[0]





@router.post("/me/referral", status_code=status.HTTP_204_NO_CONTENT)
def apply_referral(payload: ReferralApply, auth: UserAuthDep):
    user_id = auth.user_id
    referrer_id = payload.referrer_id.strip()
    if not referrer_id or referrer_id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Noto'g'ri referral")

    supabase = get_supabase_admin()

    referrer = run_query(
        lambda: supabase.table("profiles").select("id").eq("id", referrer_id).single().execute()
    )
    if not referrer.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referrer topilmadi")

    me = run_query(
        lambda: supabase.table("profiles").select("referred_by").eq("id", user_id).single().execute()
    )
    if not me.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil topilmadi")
    if me.data.get("referred_by"):
        return None

    existing = run_query(
        lambda: supabase.table("referrals").select("id").eq("referred_id", user_id).limit(1).execute()
    )
    if existing.data:
        return None

    run_query(
        lambda: supabase.table("referrals")
        .insert({"referrer_id": referrer_id, "referred_id": user_id})
        .execute()
    )
    run_query(
        lambda: supabase.table("profiles").update({"referred_by": referrer_id}).eq("id", user_id).execute()
    )
    return None


@router.get("/me/referral-stats", response_model=ReferralStatsResponse)
def referral_stats(auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    all_refs = run_query(
        lambda: supabase.table("referrals")
        .select("id", count="exact")
        .eq("referrer_id", user_id)
        .execute()
    )
    credited = run_query(
        lambda: supabase.table("referrals")
        .select("id", count="exact")
        .eq("referrer_id", user_id)
        .eq("bonus_credited", True)
        .execute()
    )
    return {
        "count": all_refs.count or 0,
        "bonus_earned": (credited.count or 0) * REFERRAL_BONUS,
    }


@router.get("/me/analytics")
def my_analytics(auth: UserAuthDep, period: str = Query(default="30d", pattern="^(7d|30d|3m|1y)$")):
    supabase = get_supabase_admin()
    profile = run_query(
        lambda: supabase.table("profiles").select("role").eq("id", auth.user_id).single().execute()
    )
    if not profile.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil topilmadi")
    role = profile.data.get("role") or "client"
    return build_user_analytics(auth.user_id, role, period)


@router.get("/me", response_model=ProfileResponse)

def get_my_profile(auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase

    result = run_query(
        lambda: supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil topilmadi")
    return result.data





@router.patch("/me", response_model=ProfileResponse)

def update_my_profile(payload: ProfileUpdate, auth: UserAuthDep, request: Request):
    user_id = auth.user_id
    supabase = auth.supabase

    data = payload.model_dump(exclude_none=True)

    if not data:

        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Yangilash ma'lumoti yo'q")

    data.pop("role", None)

    if "portfolio_urls" in data and data["portfolio_urls"] is not None:
        data["portfolio_urls"] = [u.strip() for u in data["portfolio_urls"] if u and u.strip()][:12]

    if "username" in data and data["username"]:
        slug = normalize_username(data["username"])
        if len(slug) < 3:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username juda qisqa")
        taken = run_query(
            lambda: supabase.table("profiles")
            .select("id")
            .eq("username", slug)
            .neq("id", user_id)
            .limit(1)
            .execute()
        )
        if taken.data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username band")
        data["username"] = slug

    if data.get("onboarding_completed"):
        current_row = run_query(
            lambda: supabase.table("profiles").select("*").eq("id", user_id).single().execute()
        )
        merged = {**(current_row.data or {}), **data}
        if not (merged.get("full_name") or "").strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Onboarding: ism talab qilinadi",
            )
        if len((merged.get("username") or "")) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Onboarding: username talab qilinadi",
            )
        if not (merged.get("region") or "").strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Onboarding: viloyat talab qilinadi",
            )

    run_query(lambda: supabase.table("profiles").update(data).eq("id", user_id).execute())

    refetch = run_query(
        lambda: supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    )
    if not refetch.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil topilmadi")

    log_audit(
        actor_id=user_id,
        action="profile_update",
        entity_type="profile",
        entity_id=user_id,
        metadata={"fields": list(data.keys())},
        request=request,
    )
    log_activity(user_id, "profile_update", "Profil yangilandi", href="/dashboard/settings")

    return refetch.data


@router.patch("/me/role", response_model=ProfileResponse)
def update_my_role(payload: ProfileRoleUpdate, auth: UserAuthDep, request: Request):
    user_id = auth.user_id
    supabase = auth.supabase
    run_query(lambda: supabase.table("profiles").update({"role": payload.role}).eq("id", user_id).execute())
    refetch = run_query(
        lambda: supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    )
    if not refetch.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil topilmadi")
    log_audit(
        actor_id=user_id,
        action="profile_role_update",
        entity_type="profile",
        entity_id=user_id,
        metadata={"role": payload.role},
        request=request,
    )
    return refetch.data


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_profile(auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    run_query(
        lambda: supabase.table("profiles")
        .update(
            {
                "is_banned": True,
                "full_name": "Deleted User",
                "bio": None,
                "specialty": None,
                "avatar_url": None,
                "portfolio_urls": [],
                "skills": [],
            }
        )
        .eq("id", user_id)
        .execute()
    )
    try:
        get_supabase_admin().auth.admin.delete_user(user_id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Profil yashirildi, lekin auth hisob o'chirilmadi. Qo'llab-quvvatlashga murojaat qiling.",
        ) from exc
    return None


def _load_notification_prefs(supabase, user_id: str) -> dict:
    row = run_query(
        lambda: supabase.table("profiles")
        .select("notification_preferences")
        .eq("id", user_id)
        .single()
        .execute()
    )
    if not row.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil topilmadi")
    prefs = row.data.get("notification_preferences") or DEFAULT_NOTIF_PREFS
    return {**DEFAULT_NOTIF_PREFS, **prefs}


@router.get("/check-username", response_model=UsernameCheckResponse)
def check_username(user_id: OptionalUserIdLight, username: str = Query(..., min_length=1)):
    slug = normalize_username(username)
    if len(slug) < 3:
        return {"available": False}
    supabase = get_supabase_admin()
    existing = run_query(
        lambda: supabase.table("profiles").select("id").eq("username", slug).limit(1).execute()
    )
    if not existing.data:
        return {"available": True}
    if user_id and existing.data[0]["id"] == user_id:
        return {"available": True}
    return {"available": False}


@router.get("/me/notification-prefs", response_model=NotificationPrefsResponse)
def get_notification_prefs(auth: UserAuthDep):
    return _load_notification_prefs(auth.supabase, auth.user_id)


@router.patch("/me/notification-prefs", response_model=NotificationPrefsResponse)
def update_notification_prefs(payload: NotificationPrefsUpdate, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    current = _load_notification_prefs(supabase, user_id)
    merged = {**current, **payload.model_dump(exclude_none=True)}
    run_query(
        lambda: supabase.table("profiles")
        .update({"notification_preferences": merged})
        .eq("id", user_id)
        .execute()
    )
    return merged


def _load_ui_preferences(supabase, user_id: str) -> dict:
    row = run_query(
        lambda: supabase.table("profiles").select("ui_preferences").eq("id", user_id).single().execute()
    )
    if not row.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil topilmadi")
    prefs = row.data.get("ui_preferences") or {}
    return prefs if isinstance(prefs, dict) else {}


@router.get("/me/ui-preferences")
def get_ui_preferences(auth: UserAuthDep):
    return _load_ui_preferences(auth.supabase, auth.user_id)


@router.patch("/me/ui-preferences")
def update_ui_preferences(payload: UiPreferencesUpdate, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    current = _load_ui_preferences(supabase, user_id)
    merged = {**current, **payload.model_dump(exclude_none=True)}
    run_query(
        lambda: supabase.table("profiles").update({"ui_preferences": merged}).eq("id", user_id).execute()
    )
    return merged


@router.get("/freelancers", response_model=list[ProfilePublicResponse])

def list_freelancers(
    q: str | None = Query(default=None),
    region: str | None = Query(default=None),
    specialty: str | None = Query(default=None),
    sort: str | None = Query(default=None),
    limit: int = Query(default=24, le=50),
    offset: int = Query(default=0, ge=0),
):

    supabase = get_supabase_admin()

    query = supabase.table(_PUBLIC_PROFILE_TABLE).select(_PUBLIC_PROFILE_COLUMNS)
    if region:
        query = query.eq("region", region)
    if specialty:
        query = query.ilike("specialty", f"%{specialty}%")
    if q:
        from app.search_utils import sanitize_search_term

        safe_search = sanitize_search_term(q)
        if safe_search:
            pattern = f"%{safe_search}%"
            query = query.or_(f"full_name.ilike.{pattern},specialty.ilike.{pattern},bio.ilike.{pattern}")

    result = run_query(
        lambda: query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    )

    rows = result.data or []

    ids = [row["id"] for row in rows]

    stats_map = batch_review_stats(supabase, ids)
    trust_map = batch_trust_scores(supabase, ids)

    profiles = []

    for row in rows:

        avg, count = stats_map.get(row["id"], (0.0, 0))

        profiles.append({
            **row,
            "avg_rating": avg,
            "review_count": count,
            "trust_score": trust_map.get(row["id"], 0),
        })

    if sort == "rating":
        profiles.sort(key=lambda p: (p.get("avg_rating") or 0, p.get("review_count") or 0), reverse=True)
    elif sort == "reviews":
        profiles.sort(key=lambda p: p.get("review_count") or 0, reverse=True)
    elif sort == "newest":
        profiles.sort(key=lambda p: p.get("created_at") or "", reverse=True)

    return profiles





def _viewer_key(request: Request, user_id: str | None) -> str:
    if user_id:
        return f"user:{user_id}"
    ip = request.client.host if request.client else "unknown"
    return f"ip:{ip}"


@router.post("/{profile_id}/view", status_code=status.HTTP_204_NO_CONTENT)
def record_profile_view(
    profile_id: str,
    request: Request,
    user_id: OptionalUserId = None,
):
    supabase = get_supabase_admin()
    row = _fetch_public_profile_row(supabase, profile_id)
    resolved_id = row["id"]
    dedup = run_query(
        lambda: supabase.rpc(
            "record_view_if_new",
            {
                "p_target_type": "profile",
                "p_target_id": resolved_id,
                "p_viewer_key": _viewer_key(request, user_id),
            },
        ).execute()
    )
    if not dedup.data:
        return None
    run_query(lambda: supabase.rpc("increment_profile_view_count", {"p_profile_id": resolved_id}).execute())
    return None


@router.get("/{profile_id}", response_model=ProfilePublicResponse)

def get_profile(profile_id: str):

    supabase = get_supabase_admin()
    row = _fetch_public_profile_row(supabase, profile_id)
    resolved_id = row["id"]

    avg, count = batch_review_stats(supabase, [resolved_id]).get(resolved_id, (0.0, 0))
    completed = run_query(
        lambda: supabase.table("orders")
        .select("id", count="exact")
        .eq("freelancer_id", resolved_id)
        .eq("status", "completed")
        .execute()
    )

    return {
        **row,
        "avg_rating": avg,
        "review_count": count,
        "completed_orders": completed.count or 0,
    }

