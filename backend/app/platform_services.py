"""SaaS platform: audit, activity, analytics, fraud, moderation helpers."""

from __future__ import annotations

from typing import Any

from fastapi import Request

from app.database import get_supabase_admin
from app.db_utils import run_query


def _client_ip(request: Request | None) -> str | None:
    if request is None:
        return None
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


def log_audit(
    *,
    actor_id: str | None,
    action: str,
    entity_type: str | None = None,
    entity_id: str | None = None,
    metadata: dict[str, Any] | None = None,
    request: Request | None = None,
) -> None:
    admin = get_supabase_admin()
    row = {
        "actor_id": actor_id,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "metadata": metadata or {},
        "ip_address": _client_ip(request),
        "user_agent": request.headers.get("user-agent") if request else None,
    }
    try:
        admin.table("audit_logs").insert(row).execute()
    except Exception:
        pass


def log_activity(
    user_id: str,
    activity_type: str,
    title: str,
    body: str | None = None,
    href: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    admin = get_supabase_admin()
    try:
        admin.rpc(
            "record_user_activity",
            {
                "p_user_id": user_id,
                "p_type": activity_type,
                "p_title": title,
                "p_body": body,
                "p_href": href,
                "p_metadata": metadata or {},
            },
        ).execute()
    except Exception:
        try:
            admin.table("user_activities").insert(
                {
                    "user_id": user_id,
                    "activity_type": activity_type,
                    "title": title,
                    "body": body,
                    "href": href,
                    "metadata": metadata or {},
                }
            ).execute()
        except Exception:
            pass


def track_analytics_event(
    event_name: str,
    *,
    user_id: str | None = None,
    properties: dict[str, Any] | None = None,
    session_id: str | None = None,
) -> None:
    admin = get_supabase_admin()
    try:
        admin.table("analytics_events").insert(
            {
                "user_id": user_id,
                "event_name": event_name,
                "properties": properties or {},
                "session_id": session_id,
            }
        ).execute()
    except Exception:
        pass


def log_fraud(
    *,
    user_id: str | None,
    fraud_type: str,
    severity: str = "medium",
    details: dict[str, Any] | None = None,
) -> None:
    admin = get_supabase_admin()
    try:
        admin.table("fraud_detection_logs").insert(
            {
                "user_id": user_id,
                "fraud_type": fraud_type,
                "severity": severity,
                "details": details or {},
            }
        ).execute()
    except Exception:
        pass


def log_moderation(
    *,
    admin_id: str,
    target_user_id: str | None,
    action: str,
    reason: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    admin = get_supabase_admin()
    try:
        admin.table("moderation_actions").insert(
            {
                "admin_id": admin_id,
                "target_user_id": target_user_id,
                "action": action,
                "reason": reason,
                "metadata": metadata or {},
            }
        ).execute()
    except Exception:
        pass


def refresh_reputation(user_id: str) -> None:
    admin = get_supabase_admin()
    try:
        admin.rpc("refresh_user_reputation", {"p_user_id": user_id}).execute()
    except Exception:
        pass


def get_user_reputation(user_id: str) -> dict[str, Any] | None:
    admin = get_supabase_admin()
    result = run_query(
        lambda: admin.table("user_reputation").select("*").eq("user_id", user_id).limit(1).execute()
    )
    if result.data:
        return result.data[0]
    refresh_reputation(user_id)
    result2 = run_query(
        lambda: admin.table("user_reputation").select("*").eq("user_id", user_id).limit(1).execute()
    )
    return (result2.data or [None])[0]


def build_admin_analytics(days: int = 30) -> dict[str, Any]:
    admin = get_supabase_admin()
    from datetime import datetime, timedelta, timezone

    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    def _count_events(name: str) -> int:
        r = run_query(
            lambda: admin.table("analytics_events")
            .select("id", count="exact")
            .eq("event_name", name)
            .gte("created_at", since)
            .limit(1)
            .execute()
        )
        return int(r.count or 0)

    users = run_query(
        lambda: admin.table("profiles").select("id", count="exact").gte("created_at", since).limit(1).execute()
    )
    orders = run_query(
        lambda: admin.table("orders").select("id, amount, status", count="exact").gte("created_at", since).execute()
    )
    order_rows = orders.data or []
    completed = [o for o in order_rows if o.get("status") == "completed"]
    revenue = sum(int(o.get("amount") or 0) for o in completed)

    searches = _count_events("search")
    signups = _count_events("register")

    return {
        "period_days": days,
        "new_users": int(users.count or 0),
        "orders_total": len(order_rows),
        "orders_completed": len(completed),
        "revenue_completed": revenue,
        "search_events": searches,
        "register_events": signups,
        "conversion_rate": round(len(completed) / max(len(order_rows), 1) * 100, 1),
    }
