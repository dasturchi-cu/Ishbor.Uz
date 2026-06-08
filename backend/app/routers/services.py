from fastapi import APIRouter, HTTPException, Query, Request, status

from app.database import get_supabase_admin
from app.deps import OptionalUserId, UserAuthDep
from app.search_utils import sanitize_search_term
from app.schemas import ServiceCreate, ServiceListResponse, ServiceResponse, ServiceUpdate
from app.review_stats import batch_review_stats
from app.service_packages import default_packages

router = APIRouter(prefix="/services", tags=["services"])


@router.get("/mine", response_model=list[ServiceResponse])
def list_my_services(auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
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
    supabase = get_supabase_admin()
    result = (
        supabase.table("services")
        .select("*")
        .eq("freelancer_id", freelancer_id)
        .eq("is_hidden", False)
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
    supabase = get_supabase_admin()
    query = (
        supabase.table("services")
        .select("*, profiles(full_name, specialty, region, is_verified)", count="exact")
        .eq("is_hidden", False)
    )

    if category:
        query = query.eq("category", category)
    if region:
        query = query.eq("region", region)
    safe_search = sanitize_search_term(search)
    if safe_search:
        query = query.or_(f"title.ilike.%{safe_search}%,description.ilike.%{safe_search}%")
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


def _viewer_key(request: Request, user_id: str | None) -> str:
    if user_id:
        return f"user:{user_id}"
    ip = request.client.host if request.client else "unknown"
    return f"ip:{ip}"


@router.post("/{service_id}/view", status_code=status.HTTP_204_NO_CONTENT)
def record_service_view(
    service_id: str,
    request: Request,
    user_id: OptionalUserId = None,
):
    supabase = get_supabase_admin()
    existing = (
        supabase.table("services")
        .select("id, view_count")
        .eq("id", service_id)
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Xizmat topilmadi")
    dedup = (
        supabase.rpc(
            "record_view_if_new",
            {
                "p_target_type": "service",
                "p_target_id": service_id,
                "p_viewer_key": _viewer_key(request, user_id),
            },
        )
        .execute()
    )
    if not dedup.data:
        return None
    supabase.rpc("increment_service_view_count", {"p_service_id": service_id}).execute()
    return None


@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(service_id: str):
    supabase = get_supabase_admin()
    result = (
        supabase.table("services")
        .select("*, profiles(full_name, specialty, region, bio, is_verified)")
        .eq("id", service_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Xizmat topilmadi")
    if result.data.get("is_hidden"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Xizmat topilmadi")
    return result.data


@router.post("", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(payload: ServiceCreate, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase

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
def update_service(service_id: str, payload: ServiceUpdate, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
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
def delete_service(service_id: str, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
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

    active_orders = (
        supabase.table("orders")
        .select("id")
        .eq("service_id", service_id)
        .in_("status", ["pending", "active", "delivered", "disputed"])
        .limit(1)
        .execute()
    )
    if active_orders.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Faol buyurtmalar mavjud — avval ularni yakunlang",
        )

    supabase.table("services").update({"is_hidden": True}).eq("id", service_id).execute()
    return None
