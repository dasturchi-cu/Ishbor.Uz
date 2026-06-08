from datetime import datetime, timedelta, timezone
from typing import Any

from app.database import get_supabase_admin


def _period_days(key: str) -> int:
    return {"7d": 7, "30d": 30, "3m": 90, "1y": 365}.get(key, 30)


def _month_buckets(months: int) -> list[str]:
    keys: list[str] = []
    now = datetime.now(timezone.utc)
    for i in range(months - 1, -1, -1):
        d = now - timedelta(days=i * 30)
        keys.append(d.strftime("%b"))
    return keys


def build_user_analytics(user_id: str, role: str, period: str = "30d") -> dict[str, Any]:
    supabase = get_supabase_admin()
    days = _period_days(period)
    since = datetime.now(timezone.utc) - timedelta(days=days)

    profile = (
        supabase.table("profiles")
        .select("profile_views, role")
        .eq("id", user_id)
        .single()
        .execute()
    )
    profile_views = (profile.data or {}).get("profile_views") or 0

    order_col = "freelancer_id" if role == "freelancer" else "client_id"
    orders_res = (
        supabase.table("orders")
        .select("id, status, amount, created_at, client_id")
        .eq(order_col, user_id)
        .gte("created_at", since.isoformat())
        .execute()
    )
    orders = orders_res.data or []

    client_ids = list({o["client_id"] for o in orders if o.get("client_id")})
    region_by_client: dict[str, str] = {}
    if client_ids:
        clients = (
            supabase.table("profiles")
            .select("id, region")
            .in_("id", client_ids)
            .execute()
        )
        for row in clients.data or []:
            region_by_client[row["id"]] = (row.get("region") or "").strip()

    services_res = (
        supabase.table("services")
        .select("view_count")
        .eq("freelancer_id", user_id)
        .execute()
    )
    service_views = sum((s.get("view_count") or 0) for s in (services_res.data or []))

    completed_revenue = sum(o["amount"] for o in orders if o.get("status") == "completed")
    chart_months = 4 if period == "7d" else 6
    buckets = {k: 0 for k in _month_buckets(chart_months)}

    for o in orders:
        if o.get("status") != "completed" or not o.get("created_at"):
            continue
        try:
            d = datetime.fromisoformat(str(o["created_at"]).replace("Z", "+00:00"))
            key = d.strftime("%b")
            if key in buckets:
                buckets[key] += int(o.get("amount") or 0)
        except ValueError:
            continue

    status_counts: dict[str, int] = {
        "pending": 0,
        "active": 0,
        "delivered": 0,
        "completed": 0,
        "cancelled": 0,
        "disputed": 0,
    }
    for o in orders:
        st = o.get("status")
        if st in status_counts:
            status_counts[st] += 1

    pie_data = [
        {"name": "active", "value": status_counts["pending"] + status_counts["active"], "color": "var(--color-primary)"},
        {"name": "completed", "value": status_counts["completed"], "color": "var(--success)"},
        {"name": "delivered", "value": status_counts["delivered"], "color": "var(--warning)"},
        {"name": "cancelled", "value": status_counts["cancelled"] + status_counts["disputed"], "color": "var(--error)"},
    ]
    pie_data = [p for p in pie_data if p["value"] > 0]

    regions: dict[str, int] = {}
    for o in orders:
        cid = o.get("client_id")
        region = region_by_client.get(cid or "", "")
        if region:
            regions[region] = regions.get(region, 0) + 1
    total_r = sum(regions.values())
    region_list = (
        [
            {"region": r, "pct": round((c / total_r) * 100)}
            for r, c in sorted(regions.items(), key=lambda x: -x[1])[:5]
        ]
        if total_r
        else []
    )

    return {
        "period": period,
        "completed_revenue": completed_revenue,
        "order_count": len(orders),
        "profile_views": profile_views,
        "service_views": service_views,
        "chart_data": [{"date": k, "amount": v} for k, v in buckets.items()],
        "pie_data": pie_data,
        "regions": region_list,
    }
