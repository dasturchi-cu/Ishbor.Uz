from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, status

from app.database import get_supabase_admin
from app.notification_service import create_notification
from app.deps import UserAuthDep

from app.schemas import PublicReviewResponse, ReviewCreate, ReviewReplyUpdate, ReviewResponse, ReviewUpdate

router = APIRouter(prefix="/reviews", tags=["reviews"])


def _batch_profiles(supabase, profile_ids: list[str]) -> dict[str, dict]:
    if not profile_ids:
        return {}
    result = (
        supabase.table("profiles")
        .select("id, full_name, role, specialty")
        .in_("id", profile_ids)
        .execute()
    )
    return {p["id"]: p for p in (result.data or [])}


def _enrich_reviews(supabase, reviews: list[dict]) -> list[dict]:
    if not reviews:
        return []
    reviewer_ids = list({r["reviewer_id"] for r in reviews if r.get("reviewer_id")})
    profiles_map = _batch_profiles(supabase, reviewer_ids)
    enriched = []
    for review in reviews:
        enriched.append({**review, "profiles": profiles_map.get(review["reviewer_id"])})
    return enriched


def _enrich_reviews_freelancer(supabase, reviews: list[dict]) -> list[dict]:
    if not reviews:
        return []
    freelancer_ids = list({r["freelancer_id"] for r in reviews if r.get("freelancer_id")})
    profiles_map = _batch_profiles(supabase, freelancer_ids)
    return [{**review, "profiles": profiles_map.get(review["freelancer_id"])} for review in reviews]


@router.get("/recent", response_model=list[PublicReviewResponse])
def recent_public_reviews(limit: int = Query(default=6, le=12)):
    supabase = get_supabase_admin()
    result = (
        supabase.table("reviews")
        .select("id, rating, comment, created_at, reviewer_id, freelancer_id")
        .order("created_at", desc=True)
        .limit(limit * 3)
        .execute()
    )

    reviews = [r for r in (result.data or []) if r.get("comment") and str(r["comment"]).strip()]
    reviews = reviews[:limit]
    if not reviews:
        return []

    profile_ids = list(
        {r["reviewer_id"] for r in reviews} | {r["freelancer_id"] for r in reviews}
    )
    profiles_map = _batch_profiles(supabase, profile_ids)

    enriched: list[dict] = []
    for review in reviews:
        reviewer = profiles_map.get(review["reviewer_id"], {})
        freelancer = profiles_map.get(review["freelancer_id"], {})
        enriched.append(
            {
                "id": review["id"],
                "rating": review["rating"],
                "comment": str(review["comment"]).strip(),
                "created_at": review.get("created_at"),
                "author_name": reviewer.get("full_name") or "Foydalanuvchi",
                "author_role": reviewer.get("role"),
                "freelancer_id": review["freelancer_id"],
                "freelancer_name": freelancer.get("full_name"),
                "freelancer_specialty": freelancer.get("specialty"),
            }
        )
    return enriched


@router.get("/service/{service_id}", response_model=list[ReviewResponse])
def list_service_reviews(service_id: str):
    supabase = get_supabase_admin()
    orders = (
        supabase.table("orders")
        .select("id")
        .eq("service_id", service_id)
        .execute()
    )
    order_ids = [o["id"] for o in (orders.data or [])]
    if not order_ids:
        return []

    result = (
        supabase.table("reviews")
        .select("*")
        .in_("order_id", order_ids)
        .order("created_at", desc=True)
        .execute()
    )
    return _enrich_reviews(supabase, result.data or [])


@router.get("/reviewer/me", response_model=list[ReviewResponse])
def list_my_written_reviews(auth: UserAuthDep):
    supabase = get_supabase_admin()
    result = (
        supabase.table("reviews")
        .select("*")
        .eq("reviewer_id", auth.user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return _enrich_reviews_freelancer(supabase, result.data or [])


@router.get("/reviewer/me/stats")
def my_written_review_stats(auth: UserAuthDep):
    supabase = get_supabase_admin()
    result = (
        supabase.table("reviews")
        .select("rating")
        .eq("reviewer_id", auth.user_id)
        .execute()
    )
    ratings = [r["rating"] for r in (result.data or [])]
    if not ratings:
        return {"average": 0, "count": 0}
    return {"average": round(sum(ratings) / len(ratings), 1), "count": len(ratings)}


@router.get("/freelancer/{freelancer_id}", response_model=list[ReviewResponse])
def list_freelancer_reviews(freelancer_id: str):
    supabase = get_supabase_admin()
    result = (
        supabase.table("reviews")
        .select("*")
        .eq("freelancer_id", freelancer_id)
        .order("created_at", desc=True)
        .execute()
    )
    return _enrich_reviews(supabase, result.data or [])


@router.get("/freelancer/{freelancer_id}/stats")
def freelancer_review_stats(freelancer_id: str):
    supabase = get_supabase_admin()
    result = (
        supabase.table("reviews")
        .select("rating")
        .eq("freelancer_id", freelancer_id)
        .execute()
    )
    ratings = [r["rating"] for r in (result.data or [])]
    if not ratings:
        return {"average": 0, "count": 0}
    return {"average": round(sum(ratings) / len(ratings), 1), "count": len(ratings)}


@router.get("/order/{order_id}", response_model=ReviewResponse | None)
def get_review_for_order(order_id: str, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    order = supabase.table("orders").select("client_id, freelancer_id").eq("id", order_id).single().execute()
    if not order.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buyurtma topilmadi")
    if user_id not in (order.data["client_id"], order.data["freelancer_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")

    result = supabase.table("reviews").select("*").eq("order_id", order_id).limit(1).execute()
    if not result.data:
        return None
    enriched = _enrich_reviews(supabase, result.data)
    return enriched[0]


@router.patch("/{review_id}/reply", response_model=ReviewResponse)
def reply_to_review(review_id: str, payload: ReviewReplyUpdate, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    existing = supabase.table("reviews").select("*").eq("id", review_id).single().execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sharh topilmadi")
    if existing.data["freelancer_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat freelancer javob bera oladi")

    result = (
        supabase.table("reviews")
        .update(
            {
                "reply": payload.reply.strip(),
                "replied_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        .eq("id", review_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Javob saqlanmadi")
    return result.data[0]


def _review_edit_window_ok(created_at: str | None) -> bool:
    if not created_at:
        return True
    try:
        created = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        return (datetime.now(timezone.utc) - created).days <= 7
    except (TypeError, ValueError):
        return True


@router.patch("/{review_id}", response_model=ReviewResponse)
def update_review(review_id: str, payload: ReviewUpdate, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    existing = supabase.table("reviews").select("*").eq("id", review_id).single().execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sharh topilmadi")
    if existing.data["reviewer_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat sharh muallifi tahrirlashi mumkin")
    if not _review_edit_window_ok(existing.data.get("created_at")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sharhni 7 kun ichida tahrirlash mumkin",
        )

    updates = payload.model_dump(exclude_none=True)
    if not updates:
        return existing.data

    result = supabase.table("reviews").update(updates).eq("id", review_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Sharh yangilanmadi")
    return result.data[0]


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(review_id: str, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    existing = supabase.table("reviews").select("*").eq("id", review_id).single().execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sharh topilmadi")
    if existing.data["reviewer_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat sharh muallifi o'chirishi mumkin")
    if not _review_edit_window_ok(existing.data.get("created_at")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sharhni 7 kun ichida o'chirish mumkin",
        )

    supabase.table("reviews").delete().eq("id", review_id).execute()
    return None


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(payload: ReviewCreate, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase

    order = supabase.table("orders").select("*").eq("id", payload.order_id).single().execute()
    if not order.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buyurtma topilmadi")

    order_row = order.data
    if order_row["client_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat mijoz sharh qoldirishi mumkin")
    if order_row["status"] != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Faqat tugallangan buyurtmaga sharh qoldirish mumkin",
        )

    existing = supabase.table("reviews").select("id").eq("order_id", payload.order_id).execute()
    if existing.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sharh allaqachon mavjud")

    data = {
        "order_id": payload.order_id,
        "reviewer_id": user_id,
        "freelancer_id": order_row["freelancer_id"],
        "rating": payload.rating,
        "comment": payload.comment,
    }
    result = supabase.table("reviews").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Sharh yaratilmadi")

    service_title = None
    if order_row.get("service_id"):
        svc = (
            supabase.table("services")
            .select("title")
            .eq("id", order_row["service_id"])
            .limit(1)
            .execute()
        )
        if svc.data:
            service_title = svc.data[0].get("title")

    create_notification(
        supabase,
        user_id=order_row["freelancer_id"],
        type="review",
        title=service_title or "Yangi sharh",
        body=f"{payload.rating}/5",
        href="/dashboard/reviews",
    )
    return result.data[0]
