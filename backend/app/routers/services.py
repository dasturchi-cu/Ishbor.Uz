from fastapi import APIRouter, HTTPException, Query, status

from app.database import get_supabase
from app.deps import CurrentUserId
from app.schemas import ServiceCreate, ServiceListResponse, ServiceResponse, ServiceUpdate
from app.review_stats import batch_review_stats
from app.service_packages import default_packages

router = APIRouter(prefix="/services", tags=["services"])


@router.get("/mine", response_model=list[ServiceResponse])
def list_my_services(user_id: CurrentUserId):
    supabase = get_supabase()
    result = (
        supabase.table("services")
        .select("*")
        .eq("freelancer_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.get("/freelancer/{freelancer_id}", response_model=list[ServiceResponse])
def list_freelancer_services(freelancer_id: str):
    supabase = get_supabase()
    result = (
        supabase.table("services")
        .select("*")
        .eq("freelancer_id", freelancer_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.get("", response_model=ServiceListResponse)
def list_services(
    category: str | None = Query(default=None),
    region: str | None = Query(default=None),
    search: str | None = Query(default=None),
    sort: str | None = Query(default=None),
    min_price: int | None = Query(default=None, ge=0),
    max_price: int | None = Query(default=None, ge=0),
    limit: int = Query(default=100, le=200),
    offset: int = Query(default=0, ge=0),
):
    supabase = get_supabase()
    query = (
        supabase.table("services")
        .select("*, profiles(full_name, specialty, region, is_verified)", count="exact")
        .eq("is_hidden", False)
    )

    if category:
        query = query.eq("category", category)
    if region:
        query = query.eq("region", region)
    if search:
        query = query.or_(f"title.ilike.%{search}%,description.ilike.%{search}%")
    if min_price is not None:
        query = query.gte("price", min_price)
    if max_price is not None:
        query = query.lte("price", max_price)

    if sort in ("price-low", "price_asc"):
        query = query.order("price", desc=False)
    elif sort in ("price-high", "price_desc"):
        query = query.order("price", desc=True)
    elif sort == "popular":
        query = query.order("view_count", desc=True)
    else:
        query = query.order("created_at", desc=True)

    result = query.range(offset, offset + limit - 1).execute()
    rows = result.data or []
    freelancer_ids = list({r["freelancer_id"] for r in rows if r.get("freelancer_id")})
    stats_map = batch_review_stats(supabase, freelancer_ids)
    for row in rows:
        fid = row.get("freelancer_id")
        prof = row.get("profiles") or {}
        if fid and fid in stats_map:
            avg, count = stats_map[fid]
            row["profiles"] = {**prof, "avg_rating": avg, "review_count": count}
    return ServiceListResponse(items=rows, total=result.count or 0)


@router.post("/{service_id}/view", status_code=status.HTTP_204_NO_CONTENT)
def record_service_view(service_id: str):
    supabase = get_supabase()
    existing = (
        supabase.table("services")
        .select("id, view_count")
        .eq("id", service_id)
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Xizmat topilmadi")
    views = int(existing.data[0].get("view_count") or 0) + 1
    supabase.table("services").update({"view_count": views}).eq("id", service_id).execute()
    return None


@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(service_id: str):
    supabase = get_supabase()
    result = (
        supabase.table("services")
        .select("*, profiles(full_name, specialty, region, bio, is_verified)")
        .eq("id", service_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Xizmat topilmadi")
    return result.data


@router.post("", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(payload: ServiceCreate, user_id: CurrentUserId):
    supabase = get_supabase()

    profile = supabase.table("profiles").select("role").eq("id", user_id).single().execute()
    if not profile.data or profile.data.get("role") != "freelancer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faqat freelancer xizmat yaratishi mumkin",
        )

    raw = payload.model_dump()
    packages = raw.pop("packages") or default_packages(raw["price"], raw.get("delivery_days", 5))
    data = {**raw, "packages": packages, "freelancer_id": user_id}
    result = supabase.table("services").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Xizmat yaratilmadi")
    return result.data[0]


@router.patch("/{service_id}", response_model=ServiceResponse)
def update_service(service_id: str, payload: ServiceUpdate, user_id: CurrentUserId):
    supabase = get_supabase()
    existing = (
        supabase.table("services")
        .select("*")
        .eq("id", service_id)
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Xizmat topilmadi")
    if existing.data.get("freelancer_id") != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat o'z xizmatingizni tahrirlashingiz mumkin")

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        return existing.data

    result = supabase.table("services").update(updates).eq("id", service_id).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Xizmat yangilanmadi")
    return result.data[0]


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(service_id: str, user_id: CurrentUserId):
    supabase = get_supabase()
    existing = (
        supabase.table("services")
        .select("freelancer_id")
        .eq("id", service_id)
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Xizmat topilmadi")
    if existing.data.get("freelancer_id") != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat o'z xizmatingizni o'chirishingiz mumkin")

    supabase.table("services").delete().eq("id", service_id).execute()
    return None
