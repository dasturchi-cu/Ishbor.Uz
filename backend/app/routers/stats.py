import time

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.database import get_supabase_admin
from app.db_utils import run_query
from app.postgrest_embed import SERVICE_FREELANCER_PROFILE
from app.review_stats import batch_min_service_prices, batch_review_stats, batch_trust_scores

router = APIRouter(prefix="/stats", tags=["stats"])


def _build_public_activity(supabase, limit: int = 6) -> list[dict]:
    events: list[dict] = []

    completed_orders = run_query(
        lambda: supabase.table("orders")
        .select("id, created_at, services(title)")
        .eq("status", "completed")
        .order("created_at", desc=True)
        .limit(4)
        .execute()
    )
    for row in completed_orders.data or []:
        title = (row.get("services") or {}).get("title") or ""
        if not title:
            continue
        events.append(
            {
                "id": f"completed-{row['id']}",
                "kind": "order_completed",
                "title": title,
                "created_at": row.get("created_at"),
            }
        )

    new_services = run_query(
        lambda: supabase.table("services")
        .select("id, title, created_at")
        .eq("is_hidden", False)
        .order("created_at", desc=True)
        .limit(4)
        .execute()
    )
    for row in new_services.data or []:
        title = row.get("title") or ""
        if not title:
            continue
        events.append(
            {
                "id": f"service-{row['id']}",
                "kind": "new_service",
                "title": title,
                "created_at": row.get("created_at"),
            }
        )

    events.sort(key=lambda e: e.get("created_at") or "", reverse=True)
    return events[:limit]


_STATS_CACHE = None
_STATS_CACHE_AT = 0
_STATS_TTL = 300  # 5 minut

@router.get("/public")
def public_stats():
    global _STATS_CACHE, _STATS_CACHE_AT
    now = time.time()
    if _STATS_CACHE and (now - _STATS_CACHE_AT < _STATS_TTL):
        return JSONResponse(
            content=_STATS_CACHE,
            headers={"Cache-Control": f"public, max-age={_STATS_TTL}"},
        )

    supabase = get_supabase_admin()

    # Heavy queries...
    freelancers = run_query(
        lambda: supabase.table("profiles").select("id", count="exact").eq("role", "freelancer").execute()
    )
    clients = run_query(
        lambda: supabase.table("profiles").select("id", count="exact").eq("role", "client").execute()
    )
    projects = run_query(lambda: supabase.table("projects").select("id", count="exact").execute())
    services = run_query(
        lambda: supabase.table("services")
        .select("id", count="exact")
        .eq("is_hidden", False)
        .execute()
    )
    orders = run_query(lambda: supabase.table("orders").select("id", count="exact").execute())
    completed_orders = run_query(
        lambda: supabase.table("orders")
        .select("id", count="exact")
        .eq("status", "completed")
        .execute()
    )

    reviews_agg = run_query(lambda: supabase.rpc("get_reviews_aggregate").execute())
    reviews_payload = reviews_agg.data
    if isinstance(reviews_payload, list):
        reviews_payload = reviews_payload[0] if reviews_payload else {}
    if not isinstance(reviews_payload, dict):
        reviews_payload = {}
    avg_rating = float(reviews_payload.get("avg_rating") or 0)
    review_count = int(reviews_payload.get("count") or 0)

    category_result = run_query(lambda: supabase.rpc("get_service_category_counts").execute())
    category_raw = category_result.data
    if isinstance(category_raw, list):
        category_raw = category_raw[0] if category_raw else {}
    category_counts: dict[str, int] = category_raw if isinstance(category_raw, dict) else {}

    top_services = run_query(
        lambda: supabase.table("services")
        .select(f"id, title, price, category, freelancer_id, {SERVICE_FREELANCER_PROFILE}(full_name)")
        .eq("is_hidden", False)
        .order("created_at", desc=True)
        .limit(8)
        .execute()
    )
    service_rows = top_services.data or []
    service_freelancer_ids = list({s["freelancer_id"] for s in service_rows if s.get("freelancer_id")})
    service_review_stats = batch_review_stats(supabase, service_freelancer_ids)
    enriched_services = []
    for s in service_rows:
        fid = s.get("freelancer_id")
        avg, count = service_review_stats.get(fid, (0.0, 0)) if fid else (0.0, 0)
        profile = s.get("profiles") or {}
        enriched_services.append(
            {
                **s,
                "profiles": {**profile, "avg_rating": avg, "review_count": count},
            }
        )

    top_freelancers = run_query(
        lambda: supabase.table("profiles")
        .select("id, full_name, specialty, region, role, is_verified")
        .eq("role", "freelancer")
        .eq("is_banned", False)
        .order("created_at", desc=True)
        .limit(4)
        .execute()
    )

    freelancer_rows = top_freelancers.data or []
    freelancer_ids = [f["id"] for f in freelancer_rows]
    review_stats = batch_review_stats(supabase, freelancer_ids)
    min_prices = batch_min_service_prices(supabase, freelancer_ids)
    trust_scores = batch_trust_scores(supabase, freelancer_ids)

    enriched_freelancers = []
    for f in freelancer_rows:
        fid = f["id"]
        avg, count = review_stats.get(fid, (0.0, 0))
        enriched_freelancers.append(
            {
                **f,
                "avg_rating": avg,
                "review_count": count,
                "min_price": min_prices.get(fid, 0),
                "trust_score": trust_scores.get(fid, 0),
            }
        )

    project_total = (projects.count or 0) + (orders.count or 0)
    recent_activity = _build_public_activity(supabase)

    _STATS_CACHE = {
        "commission_percent": 10,
        "commission_bps": 1000,
        "freelancer_payout_percent": 90,
        "freelancers": freelancers.count or 0,
        "clients": clients.count or 0,
        "projects": project_total,
        "services": services.count or 0,
        "completed_orders": completed_orders.count or 0,
        "avg_rating": avg_rating,
        "review_count": review_count,
        "category_counts": category_counts,
        "top_services": enriched_services,
        "recent_activity": recent_activity,
        "featured_freelancers": enriched_freelancers,
    }
    _STATS_CACHE_AT = now

    return JSONResponse(
        content=_STATS_CACHE,
        headers={"Cache-Control": f"public, max-age={_STATS_TTL}"},
    )
