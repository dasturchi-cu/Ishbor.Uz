from fastapi import APIRouter, HTTPException, Query, status

REFERRAL_BONUS = 50_000



from app.database import get_supabase

from app.deps import CurrentUserId

from app.review_stats import batch_review_stats

from app.schemas import (
    NotificationPrefsResponse,
    NotificationPrefsUpdate,
    ProfilePublicResponse,
    ProfileResponse,
    ProfileUpdate,
    ReferralApply,
    ReferralStatsResponse,
    UsernameCheckResponse,
)



router = APIRouter(prefix="/profiles", tags=["profiles"])

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





@router.post("/me/referral", status_code=status.HTTP_204_NO_CONTENT)
def apply_referral(payload: ReferralApply, user_id: CurrentUserId):
    referrer_id = payload.referrer_id.strip()
    if not referrer_id or referrer_id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Noto'g'ri referral")

    supabase = get_supabase()

    referrer = supabase.table("profiles").select("id").eq("id", referrer_id).single().execute()
    if not referrer.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Referrer topilmadi")

    me = supabase.table("profiles").select("referred_by").eq("id", user_id).single().execute()
    if not me.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil topilmadi")
    if me.data.get("referred_by"):
        return None

    existing = (
        supabase.table("referrals").select("id").eq("referred_id", user_id).limit(1).execute()
    )
    if existing.data:
        return None

    supabase.table("referrals").insert(
        {"referrer_id": referrer_id, "referred_id": user_id}
    ).execute()
    supabase.table("profiles").update({"referred_by": referrer_id}).eq("id", user_id).execute()

    referrer = (
        supabase.table("profiles")
        .select("wallet_balance")
        .eq("id", referrer_id)
        .single()
        .execute()
    )
    if referrer.data:
        balance = int(referrer.data.get("wallet_balance") or 0)
        supabase.table("profiles").update({"wallet_balance": balance + REFERRAL_BONUS}).eq(
            "id", referrer_id
        ).execute()
        supabase.table("transactions").insert(
            {
                "user_id": referrer_id,
                "type": "referral_bonus",
                "amount": REFERRAL_BONUS,
                "provider": "platform",
                "status": "completed",
            }
        ).execute()
    return None


@router.get("/me/referral-stats", response_model=ReferralStatsResponse)
def referral_stats(user_id: CurrentUserId):
    supabase = get_supabase()
    result = (
        supabase.table("referrals")
        .select("id", count="exact")
        .eq("referrer_id", user_id)
        .execute()
    )
    bonus = (result.count or 0) * REFERRAL_BONUS
    return {"count": result.count or 0, "bonus_earned": bonus}


@router.get("/me", response_model=ProfileResponse)

def get_my_profile(user_id: CurrentUserId):

    supabase = get_supabase()

    result = supabase.table("profiles").select("*").eq("id", user_id).single().execute()

    if not result.data:

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil topilmadi")

    return result.data





@router.patch("/me", response_model=ProfileResponse)

def update_my_profile(payload: ProfileUpdate, user_id: CurrentUserId):

    supabase = get_supabase()

    data = payload.model_dump(exclude_none=True)

    if not data:

        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Yangilash ma'lumoti yo'q")

    if "role" in data:
        current = supabase.table("profiles").select("onboarding_completed").eq("id", user_id).single().execute()
        if (current.data or {}).get("onboarding_completed"):
            del data["role"]
        elif data["role"] not in ("freelancer", "client"):
            del data["role"]

    if "portfolio_urls" in data and data["portfolio_urls"] is not None:
        data["portfolio_urls"] = [u.strip() for u in data["portfolio_urls"] if u and u.strip()][:12]

    if "username" in data and data["username"]:
        slug = normalize_username(data["username"])
        if len(slug) < 3:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username juda qisqa")
        taken = (
            supabase.table("profiles")
            .select("id")
            .eq("username", slug)
            .neq("id", user_id)
            .limit(1)
            .execute()
        )
        if taken.data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username band")
        data["username"] = slug

    result = supabase.table("profiles").update(data).eq("id", user_id).execute()

    if not result.data:

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil topilmadi")

    return result.data[0]


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_profile(user_id: CurrentUserId):
    supabase = get_supabase()
    supabase.table("profiles").update(
        {
            "is_banned": True,
            "full_name": "Deleted User",
            "bio": None,
            "specialty": None,
            "avatar_url": None,
            "portfolio_urls": [],
            "skills": [],
        }
    ).eq("id", user_id).execute()
    return None


def _load_notification_prefs(supabase, user_id: str) -> dict:
    row = supabase.table("profiles").select("notification_preferences").eq("id", user_id).single().execute()
    if not row.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil topilmadi")
    prefs = row.data.get("notification_preferences") or DEFAULT_NOTIF_PREFS
    return {**DEFAULT_NOTIF_PREFS, **prefs}


@router.get("/check-username", response_model=UsernameCheckResponse)
def check_username(username: str = Query(..., min_length=1)):
    slug = normalize_username(username)
    if len(slug) < 3:
        return {"available": False}
    supabase = get_supabase()
    existing = supabase.table("profiles").select("id").eq("username", slug).limit(1).execute()
    return {"available": not bool(existing.data)}


@router.get("/me/notification-prefs", response_model=NotificationPrefsResponse)
def get_notification_prefs(user_id: CurrentUserId):
    return _load_notification_prefs(get_supabase(), user_id)


@router.patch("/me/notification-prefs", response_model=NotificationPrefsResponse)
def update_notification_prefs(payload: NotificationPrefsUpdate, user_id: CurrentUserId):
    supabase = get_supabase()
    current = _load_notification_prefs(supabase, user_id)
    merged = {**current, **payload.model_dump(exclude_none=True)}
    supabase.table("profiles").update({"notification_preferences": merged}).eq("id", user_id).execute()
    return merged


@router.get("/freelancers", response_model=list[ProfilePublicResponse])

def list_freelancers(
    q: str | None = Query(default=None),
    region: str | None = Query(default=None),
    specialty: str | None = Query(default=None),
    limit: int = Query(default=24, le=50),
    offset: int = Query(default=0, ge=0),
):

    supabase = get_supabase()

    query = (
        supabase.table("profiles")
        .select("id, role, full_name, bio, region, specialty, avatar_url, created_at, profile_views, skills, is_verified, portfolio_urls")
        .eq("role", "freelancer")
    )
    if region:
        query = query.eq("region", region)
    if specialty:
        query = query.ilike("specialty", f"%{specialty}%")
    if q:
        pattern = f"%{q.strip()}%"
        query = query.or_(f"full_name.ilike.{pattern},specialty.ilike.{pattern},bio.ilike.{pattern}")

    result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()

    rows = result.data or []

    ids = [row["id"] for row in rows]

    stats_map = batch_review_stats(supabase, ids)



    profiles = []

    for row in rows:

        avg, count = stats_map.get(row["id"], (0.0, 0))

        profiles.append({**row, "avg_rating": avg, "review_count": count})

    return profiles





@router.post("/{profile_id}/view", status_code=status.HTTP_204_NO_CONTENT)
def record_profile_view(profile_id: str):
    supabase = get_supabase()
    existing = supabase.table("profiles").select("id, profile_views").eq("id", profile_id).single().execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil topilmadi")
    views = int(existing.data.get("profile_views") or 0) + 1
    supabase.table("profiles").update({"profile_views": views}).eq("id", profile_id).execute()
    return None


@router.get("/{profile_id}", response_model=ProfilePublicResponse)

def get_profile(profile_id: str):

    supabase = get_supabase()

    result = (

        supabase.table("profiles")

        .select("id, role, full_name, bio, region, specialty, avatar_url, created_at, profile_views, is_verified, portfolio_urls")

        .eq("id", profile_id)

        .single()

        .execute()

    )

    if not result.data:

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil topilmadi")

    avg, count = batch_review_stats(supabase, [profile_id]).get(profile_id, (0.0, 0))
    completed = (
        supabase.table("orders")
        .select("id", count="exact")
        .eq("freelancer_id", profile_id)
        .eq("status", "completed")
        .execute()
    )

    return {
        **result.data,
        "avg_rating": avg,
        "review_count": count,
        "completed_orders": completed.count or 0,
    }

