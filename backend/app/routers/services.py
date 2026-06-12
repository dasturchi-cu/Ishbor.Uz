from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Request, Response, status

from app.database import get_supabase_admin
from app.db_utils import run_query
from app.deps import OptionalUserId, UserAuthDep
from app.search_query import (
    MAX_SEARCH_SCAN,
    apply_search_tokens,
    sort_by_relevance,
    tokenize_search,
)
from app.schemas import ServiceCreate, ServiceListResponse, ServiceResponse, ServiceUpdate
from app.review_stats import batch_review_stats
from app.platform_services import track_activation_once
from app.service_packages import default_packages
from app.catalog_quality import filter_quality_service_rows
from app.platform_services import track_analytics_event
from app.service_experience import (
    MAX_EXPERIENCE_SCAN,
    filter_service_rows_by_experience,
    parse_experience_param,
)
from app.postgrest_embed import SERVICE_FREELANCER_PROFILE

router = APIRouter(prefix="/services", tags=["services"])

_FREELANCER_PROFILE = SERVICE_FREELANCER_PROFILE


@router.get("/mine", response_model=list[ServiceResponse])
def list_my_services(auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    result = run_query(
        lambda: supabase.table("services")
        .select("*")
        .eq("freelancer_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.get("/freelancer/{freelancer_id}", response_model=list[ServiceResponse])
def list_freelancer_services(freelancer_id: str):
    supabase = get_supabase_admin()
    result = run_query(
        lambda: supabase.table("services")
        .select("*")
        .eq("freelancer_id", freelancer_id)
        .eq("is_hidden", False)
        .eq("moderation_status", "approved")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.get("", response_model=ServiceListResponse)
def list_services(
    response: Response,
    category: str | None = Query(default=None),
    region: str | None = Query(default=None),
    search: str | None = Query(default=None),
    sort: str | None = Query(default=None),
    min_price: int | None = Query(default=None, ge=0),
    max_price: int | None = Query(default=None, ge=0),
    max_delivery_days: int | None = Query(default=None, ge=1, le=365),
    experience: str | None = Query(default=None, max_length=64),
    limit: int = Query(default=48, le=200),
    offset: int = Query(default=0, ge=0),
):
    supabase = get_supabase_admin()
    experience_levels = parse_experience_param(experience)
    use_experience_filter = bool(experience_levels)
    search_tokens = tokenize_search(search)

    def build_query():
        query = (
            supabase.table("services")
            .select(f"*, {_FREELANCER_PROFILE}(full_name, specialty, region, is_verified)", count="exact")
            .eq("is_hidden", False)
            .eq("moderation_status", "approved")
        )

        if category:
            query = query.eq("category", category)
        if region:
            query = query.eq("region", region)
        if search_tokens:
            query = apply_search_tokens(query, search_tokens, ["title", "description", "category"])
        if min_price is not None:
            query = query.gte("price", min_price)
        if max_price is not None:
            query = query.lte("price", max_price)
        if max_delivery_days is not None:
            query = query.lte("delivery_days", max_delivery_days)

        if sort in ("price-low", "price_asc"):
            query = query.order("price", desc=False)
        elif sort in ("price-high", "price_desc"):
            query = query.order("price", desc=True)
        elif sort == "popular":
            query = query.order("view_count", desc=True)
        elif sort in ("delivery", "delivery-fast", "delivery_asc"):
            query = query.order("delivery_days", desc=False)
        else:
            query = query.order("created_at", desc=True)

        return query

    def enrich_rows(rows: list[dict]) -> tuple[list[dict], dict[str, tuple[float, int]]]:
        freelancer_ids = list({r["freelancer_id"] for r in rows if r.get("freelancer_id")})
        stats_map = batch_review_stats(supabase, freelancer_ids)
        for row in rows:
            fid = row.get("freelancer_id")
            prof = row.get("profiles") or {}
            if fid and fid in stats_map:
                avg, count = stats_map[fid]
                row["profiles"] = {**prof, "avg_rating": avg, "review_count": count}
        return rows, stats_map

    def fetch() -> ServiceListResponse:
        if use_experience_filter:
            query = build_query()
            result = query.range(0, MAX_EXPERIENCE_SCAN - 1).execute()
            rows = result.data or []
            rows, stats_map = enrich_rows(rows)
            filtered = filter_service_rows_by_experience(rows, stats_map, experience_levels)
            if sort == "rating":
                filtered.sort(
                    key=lambda r: (
                        -(stats_map.get(r.get("freelancer_id") or "", (0.0, 0))[0]),
                        -(stats_map.get(r.get("freelancer_id") or "", (0.0, 0))[1]),
                        r.get("price") or 0,
                    )
                )
            filtered = filter_quality_service_rows(filtered)
            total = len(filtered)
            page = filtered[offset : offset + limit]
            return ServiceListResponse(items=page, total=total)

        query = build_query()
        result = query.range(0, MAX_SEARCH_SCAN - 1).execute()
        rows = result.data or []
        rows, stats_map = enrich_rows(rows)
        rows = filter_quality_service_rows(rows)
        if search_tokens:
            rows = sort_by_relevance(rows, search)
        elif sort == "rating":
            rows.sort(
                key=lambda r: (
                    -(stats_map.get(r.get("freelancer_id") or "", (0.0, 0))[0]),
                    -(stats_map.get(r.get("freelancer_id") or "", (0.0, 0))[1]),
                ),
            )
        total = len(rows)
        page = rows[offset : offset + limit]
        return ServiceListResponse(items=page, total=total)

    result = run_query(fetch)
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=120"
    return result


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
    existing = run_query(
        lambda: supabase.table("services")
        .select("id, view_count")
        .eq("id", service_id)
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Xizmat topilmadi")
    dedup = run_query(
        lambda: supabase.rpc(
            "record_view_if_new",
            {
                "p_target_type": "service",
                "p_target_id": service_id,
                "p_viewer_key": _viewer_key(request, user_id),
            },
        ).execute()
    )
    if not dedup.data:
        return None
    run_query(
        lambda: supabase.rpc("increment_service_view_count", {"p_service_id": service_id}).execute()
    )
    track_analytics_event(
        "service_view",
        user_id=user_id,
        properties={"service_id": service_id},
    )
    return None


@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(service_id: str, user_id: OptionalUserId = None):
    supabase = get_supabase_admin()
    result = run_query(
        lambda: supabase.table("services")
        .select(f"*, {_FREELANCER_PROFILE}(full_name, specialty, region, bio, is_verified)")
        .eq("id", service_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Xizmat topilmadi")
    if result.data.get("is_hidden") or result.data.get("moderation_status") != "approved":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Xizmat topilmadi")
    return result.data


@router.post("", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(payload: ServiceCreate, auth: UserAuthDep, background_tasks: BackgroundTasks):
    user_id = auth.user_id
    supabase = auth.supabase

    profile = run_query(
        lambda: supabase.table("profiles").select("role").eq("id", user_id).single().execute()
    )
    if not profile.data or profile.data.get("role") != "freelancer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faqat freelancer xizmat yaratishi mumkin",
        )

    raw = payload.model_dump()
    packages = raw.pop("packages") or default_packages(raw["price"], raw.get("delivery_days", 5))
    data = {
        **raw,
        "packages": packages,
        "freelancer_id": user_id,
        "moderation_status": "pending",
        "is_hidden": True,
    }
    result = run_query(lambda: supabase.table("services").insert(data).execute())
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Xizmat yaratilmadi")
    created = result.data[0]
    background_tasks.add_task(
        track_activation_once,
        user_id,
        "candidate_first_listing",
        properties={"service_id": created.get("id"), "action": "create_service"},
    )
    return created


@router.patch("/{service_id}", response_model=ServiceResponse)
def update_service(service_id: str, payload: ServiceUpdate, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    existing = run_query(
        lambda: supabase.table("services")
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

    content_fields = {"title", "description", "price", "delivery_days", "packages", "category", "tags", "includes", "faq"}
    if content_fields.intersection(updates.keys()):
        updates["moderation_status"] = "pending"
        updates["is_hidden"] = True

    result = run_query(
        lambda: supabase.table("services").update(updates).eq("id", service_id).execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Xizmat yangilanmadi")
    return result.data[0]


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(service_id: str, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    existing = run_query(
        lambda: supabase.table("services")
        .select("freelancer_id")
        .eq("id", service_id)
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Xizmat topilmadi")
    if existing.data.get("freelancer_id") != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat o'z xizmatingizni o'chirishingiz mumkin")

    active_orders = run_query(
        lambda: supabase.table("orders")
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

    run_query(
        lambda: supabase.table("services").update({"is_hidden": True}).eq("id", service_id).execute()
    )
    return None
