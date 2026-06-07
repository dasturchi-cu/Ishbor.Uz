from fastapi import APIRouter, HTTPException, Query, status

from app.database import get_supabase
from app.deps import CurrentUserId
from app.schemas import PublicReviewResponse, ReviewCreate, ReviewResponse

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/recent", response_model=list[PublicReviewResponse])
def recent_public_reviews(limit: int = Query(default=6, le=12)):
    supabase = get_supabase()
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
    profiles_result = (
        supabase.table("profiles")
        .select("id, full_name, role, specialty")
        .in_("id", profile_ids)
        .execute()
    )
    profiles_map = {p["id"]: p for p in (profiles_result.data or [])}

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


@router.get("/freelancer/{freelancer_id}", response_model=list[ReviewResponse])
def list_freelancer_reviews(freelancer_id: str):
    supabase = get_supabase()
    result = (
        supabase.table("reviews")
        .select("*")
        .eq("freelancer_id", freelancer_id)
        .order("created_at", desc=True)
        .execute()
    )
    reviews = result.data or []

    enriched = []
    for review in reviews:
        reviewer = (
            supabase.table("profiles")
            .select("full_name")
            .eq("id", review["reviewer_id"])
            .single()
            .execute()
        )
        enriched.append({**review, "profiles": reviewer.data})
    return enriched


@router.get("/freelancer/{freelancer_id}/stats")
def freelancer_review_stats(freelancer_id: str):
    supabase = get_supabase()
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


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(payload: ReviewCreate, user_id: CurrentUserId):
    supabase = get_supabase()

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
    return result.data[0]
