from fastapi import APIRouter

from app.database import get_supabase_admin
from app.review_stats import batch_min_service_prices, batch_review_stats

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/public")
def public_stats():
    supabase = get_supabase_admin()

    freelancers = supabase.table("profiles").select("id", count="exact").eq("role", "freelancer").execute()
    clients = supabase.table("profiles").select("id", count="exact").eq("role", "client").execute()
    projects = supabase.table("projects").select("id", count="exact").execute()
    services = supabase.table("services").select("id", count="exact").execute()
    orders = supabase.table("orders").select("id", count="exact").execute()

    reviews = supabase.table("reviews").select("rating").execute()
    ratings = [r["rating"] for r in (reviews.data or [])]
    avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0.0

    services_list = supabase.table("services").select("category").execute()
    category_counts: dict[str, int] = {}
    for row in services_list.data or []:
        cat = row.get("category") or "other"
        category_counts[cat] = category_counts.get(cat, 0) + 1

    top_services = (
        supabase.table("services")
        .select("id, title, price, category, freelancer_id, profiles(full_name)")
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

    top_freelancers = (
        supabase.table("profiles")
        .select("id, full_name, specialty, region, role")
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
            }
        )

    project_total = (projects.count or 0) + (orders.count or 0)

    return {
        "freelancers": freelancers.count or 0,
        "clients": clients.count or 0,
        "projects": project_total,
        "services": services.count or 0,
        "avg_rating": avg_rating,
        "review_count": len(ratings),
        "category_counts": category_counts,
        "top_services": enriched_services,
        "featured_freelancers": enriched_freelancers,
    }
