"""Admin user enrichment — batch stats without N+1."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.database import get_supabase_admin
from app.db_utils import run_query


def _batch_last_active(user_ids: list[str]) -> dict[str, str]:
    if not user_ids:
        return {}
    supabase = get_supabase_admin()
    since = (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()
    result = run_query(
        lambda: supabase.table("user_activities")
        .select("user_id, created_at")
        .in_("user_id", user_ids)
        .gte("created_at", since)
        .order("created_at", desc=True)
        .execute()
    )
    out: dict[str, str] = {}
    for row in result.data or []:
        uid = row.get("user_id")
        if uid and uid not in out and row.get("created_at"):
            out[uid] = row["created_at"]
    return out


def _batch_reputation(user_ids: list[str]) -> dict[str, dict]:
    if not user_ids:
        return {}
    supabase = get_supabase_admin()
    result = run_query(
        lambda: supabase.table("user_reputation")
        .select("user_id, trust_score, avg_rating, completed_orders, dispute_count")
        .in_("user_id", user_ids)
        .execute()
    )
    return {row["user_id"]: row for row in (result.data or [])}


def _batch_order_stats(user_ids: list[str]) -> dict[str, dict]:
    if not user_ids:
        return {}
    supabase = get_supabase_admin()
    stats: dict[str, dict] = {uid: {"orders_count": 0, "revenue": 0} for uid in user_ids}

    client_orders = run_query(
        lambda: supabase.table("orders")
        .select("client_id, amount, status")
        .in_("client_id", user_ids)
        .execute()
    )
    for row in client_orders.data or []:
        uid = row.get("client_id")
        if uid in stats:
            stats[uid]["orders_count"] += 1

    freelancer_orders = run_query(
        lambda: supabase.table("orders")
        .select("freelancer_id, amount, status")
        .in_("freelancer_id", user_ids)
        .execute()
    )
    for row in freelancer_orders.data or []:
        uid = row.get("freelancer_id")
        if uid in stats:
            stats[uid]["orders_count"] += 1
            if row.get("status") == "completed":
                stats[uid]["revenue"] += int(row.get("amount") or 0)

    return stats


def enrich_admin_users(profiles: list[dict]) -> list[dict]:
    if not profiles:
        return []
    user_ids = [p["id"] for p in profiles if p.get("id")]
    rep_map = _batch_reputation(user_ids)
    order_map = _batch_order_stats(user_ids)
    active_map = _batch_last_active(user_ids)

    enriched: list[dict] = []
    for profile in profiles:
        uid = profile["id"]
        rep = rep_map.get(uid, {})
        orders = order_map.get(uid, {"orders_count": 0, "revenue": 0})
        enriched.append(
            {
                **profile,
                "trust_score": rep.get("trust_score"),
                "avg_rating": rep.get("avg_rating"),
                "orders_count": orders["orders_count"],
                "revenue": orders["revenue"],
                "last_active_at": active_map.get(uid),
                "verification_status": "verified" if profile.get("is_verified") else "unverified",
                "account_status": (
                    "banned"
                    if profile.get("is_banned")
                    else "suspended"
                    if profile.get("is_suspended")
                    else "active"
                ),
            }
        )
    return enriched


def user_ids_for_preset(preset: str) -> list[str] | None:
    """Return user id list for preset filters, or None if no preset."""
    supabase = get_supabase_admin()
    if preset == "new_users":
        since = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        result = run_query(
            lambda: supabase.table("profiles")
            .select("id")
            .gte("created_at", since)
            .execute()
        )
        return [r["id"] for r in (result.data or [])]
    if preset == "top_rated":
        result = run_query(
            lambda: supabase.table("user_reputation")
            .select("user_id")
            .gte("trust_score", 70)
            .execute()
        )
        return [r["user_id"] for r in (result.data or [])]
    if preset == "active":
        since = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        result = run_query(
            lambda: supabase.table("user_activities")
            .select("user_id")
            .gte("created_at", since)
            .execute()
        )
        return list({r["user_id"] for r in (result.data or []) if r.get("user_id")})
    return None
