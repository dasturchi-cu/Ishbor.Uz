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
    except Exception as exc:
        import logging

        logging.getLogger("ishbor.audit").error("audit_log_failed action=%s err=%s", action, exc)


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
    except Exception as exc:
        import logging

        logging.getLogger("ishbor.analytics").warning("analytics_insert_failed: %s", exc)


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
    except Exception as exc:
        import logging

        logging.getLogger("ishbor.fraud").error("fraud_log_failed: %s", exc)


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


def _empty_admin_analytics(days: int = 30) -> dict[str, Any]:
    from datetime import datetime, timedelta, timezone

    users_series: list[dict[str, Any]] = []
    revenue_series: list[dict[str, Any]] = []
    commission_series: list[dict[str, Any]] = []
    for offset in range(days - 1, -1, -1):
        day = (datetime.now(timezone.utc) - timedelta(days=offset)).date().isoformat()
        label = day[5:]
        users_series.append({"date": label, "value": 0})
        revenue_series.append({"date": label, "value": 0})
        commission_series.append({"date": label, "value": 0})
    return {
        "period_days": days,
        "new_users": 0,
        "orders_total": 0,
        "orders_completed": 0,
        "revenue_completed": 0,
        "platform_revenue_completed": 0,
        "search_events": 0,
        "register_events": 0,
        "conversion_rate": 0.0,
        "users_series": users_series,
        "revenue_series": revenue_series,
        "commission_series": commission_series,
        "top_searches": [],
    }


def build_admin_analytics(days: int = 30) -> dict[str, Any]:
    try:
        return _build_admin_analytics(days)
    except Exception:
        return _empty_admin_analytics(days)


def _build_admin_analytics(days: int = 30) -> dict[str, Any]:
    admin = get_supabase_admin()
    from collections import defaultdict
    from datetime import datetime, timedelta, timezone

    from postgrest.exceptions import APIError

    since_dt = datetime.now(timezone.utc) - timedelta(days=days)
    since = since_dt.isoformat()

    def _count_events(name: str) -> int:
        try:
            r = run_query(
                lambda: admin.table("analytics_events")
                .select("id", count="exact")
                .eq("event_name", name)
                .gte("created_at", since)
                .limit(1)
                .execute()
            )
            return int(r.count or 0)
        except APIError:
            return 0

    users = run_query(
        lambda: admin.table("profiles").select("created_at").gte("created_at", since).execute()
    )
    orders = run_query(
        lambda: admin.table("orders")
        .select("id, amount, platform_fee, status, created_at, updated_at")
        .gte("created_at", since)
        .execute()
    )
    order_rows = orders.data or []
    completed = [o for o in order_rows if o.get("status") == "completed"]
    revenue = sum(int(o.get("amount") or 0) for o in completed)
    platform_revenue = sum(int(o.get("platform_fee") or 0) for o in completed)

    searches = _count_events("search")
    signups = _count_events("register")
    top_searches = _top_search_terms(since)

    users_by_day: dict[str, int] = defaultdict(int)
    revenue_by_day: dict[str, int] = defaultdict(int)
    commission_by_day: dict[str, int] = defaultdict(int)
    for row in users.data or []:
        created = row.get("created_at")
        if created:
            users_by_day[str(created)[:10]] += 1
    for row in completed:
        completed_at = row.get("updated_at") or row.get("created_at")
        if completed_at:
            day_key = str(completed_at)[:10]
            revenue_by_day[day_key] += int(row.get("amount") or 0)
            commission_by_day[day_key] += int(row.get("platform_fee") or 0)

    users_series: list[dict[str, Any]] = []
    revenue_series: list[dict[str, Any]] = []
    commission_series: list[dict[str, Any]] = []
    for offset in range(days - 1, -1, -1):
        day = (datetime.now(timezone.utc) - timedelta(days=offset)).date().isoformat()
        users_series.append({"date": day[5:], "value": users_by_day.get(day, 0)})
        revenue_series.append({"date": day[5:], "value": revenue_by_day.get(day, 0)})
        commission_series.append({"date": day[5:], "value": commission_by_day.get(day, 0)})

    return {
        "period_days": days,
        "new_users": len(users.data or []),
        "orders_total": len(order_rows),
        "orders_completed": len(completed),
        "revenue_completed": revenue,
        "platform_revenue_completed": platform_revenue,
        "search_events": searches,
        "register_events": signups,
        "conversion_rate": round(len(completed) / max(len(order_rows), 1) * 100, 1),
        "users_series": users_series,
        "revenue_series": revenue_series,
        "commission_series": commission_series,
        "top_searches": top_searches,
    }


def _top_search_terms(since: str, limit: int = 10) -> list[dict[str, Any]]:
    from collections import defaultdict

    admin = get_supabase_admin()
    try:
        result = run_query(
            lambda: admin.table("analytics_events")
            .select("properties")
            .eq("event_name", "search")
            .gte("created_at", since)
            .order("created_at", desc=True)
            .limit(500)
            .execute()
        )
    except Exception:
        return []

    tallies: dict[str, dict[str, Any]] = defaultdict(lambda: {"query": "", "surface": "", "count": 0})
    for row in result.data or []:
        props = row.get("properties") or {}
        query = str(props.get("query") or "").strip().lower()
        if len(query) < 2:
            continue
        surface = str(props.get("surface") or "unknown")
        key = f"{surface}:{query}"
        tallies[key]["query"] = query
        tallies[key]["surface"] = surface
        tallies[key]["count"] = int(tallies[key]["count"]) + 1

    ranked = sorted(tallies.values(), key=lambda item: int(item["count"]), reverse=True)
    return ranked[:limit]


def broadcast_notification(
    *,
    title: str,
    body: str,
    href: str | None = None,
    target: str = "all",
) -> int:
    admin = get_supabase_admin()
    query = admin.table("profiles").select("id")
    if target == "freelancers":
        query = query.eq("role", "freelancer")
    elif target == "clients":
        query = query.eq("role", "client")
    result = run_query(lambda: query.execute())
    rows = result.data or []
    if not rows:
        return 0

    payload = [
        {
            "user_id": row["id"],
            "type": "broadcast",
            "title": title,
            "body": body,
            "href": href,
            "category": "general",
            "priority": 0,
        }
        for row in rows
    ]
    batch_size = 200
    sent = 0
    for i in range(0, len(payload), batch_size):
        chunk = payload[i : i + batch_size]
        run_query(lambda c=chunk: admin.table("notifications").insert(c).execute())
        sent += len(chunk)
    return sent


def build_user_activity_feed(user_id: str, limit: int = 12) -> list[dict[str, Any]]:
    """Dashboard uchun birlashtirilgan faoliyat lentasi (server-side merge)."""
    admin = get_supabase_admin()
    items: list[dict[str, Any]] = []

    activities = run_query(
        lambda: admin.table("user_activities")
        .select("id, title, body, href, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit * 2)
        .execute()
    )
    for row in activities.data or []:
        if not row.get("created_at"):
            continue
        items.append(
            {
                "id": f"activity-{row['id']}",
                "kind": "activity",
                "title": row["title"],
                "body": row.get("body"),
                "href": row.get("href"),
                "created_at": row["created_at"],
            }
        )

    orders = run_query(
        lambda: admin.table("orders")
        .select("id, client_id, freelancer_id, status, amount, updated_at, created_at, services(title)")
        .or_(f"client_id.eq.{user_id},freelancer_id.eq.{user_id}")
        .order("updated_at", desc=True)
        .limit(limit * 2)
        .execute()
    )
    order_rows = orders.data or []
    for row in order_rows:
        at = row.get("updated_at") or row.get("created_at")
        if not at:
            continue
        svc = row.get("services") or {}
        title = svc.get("title") if isinstance(svc, dict) else None
        items.append(
            {
                "id": f"order-{row['id']}",
                "kind": "order",
                "title": title or "order",
                "order_status": row.get("status"),
                "amount": int(row.get("amount") or 0),
                "href": f"/dashboard/orders/{row['id']}",
                "created_at": at,
            }
        )

    order_ids = [row["id"] for row in order_rows[:20]]
    if order_ids:
        other_ids = list(
            {
                row["freelancer_id"] if row["client_id"] == user_id else row["client_id"]
                for row in order_rows[:20]
            }
        )
        profiles = run_query(
            lambda: admin.table("profiles").select("id, full_name").in_("id", other_ids).execute()
        )
        profiles_map = {p["id"]: p.get("full_name") or "Foydalanuvchi" for p in (profiles.data or [])}

        stats_by_order: dict[str, dict[str, Any]] = {}
        try:
            stats_result = run_query(
                lambda: admin.rpc(
                    "get_conversation_message_stats",
                    {"p_user_id": user_id, "p_order_ids": order_ids},
                ).execute()
            )
            stats_by_order = {row["order_id"]: row for row in (stats_result.data or [])}
        except Exception:
            messages = run_query(
                lambda: admin.table("messages")
                .select("order_id, content, created_at")
                .in_("order_id", order_ids)
                .order("created_at", desc=True)
                .limit(min(len(order_ids) * 5, 200))
                .execute()
            )
            for msg in messages.data or []:
                oid = msg["order_id"]
                if oid not in stats_by_order:
                    stats_by_order[oid] = {
                        "order_id": oid,
                        "last_content": msg.get("content"),
                        "last_created_at": msg.get("created_at"),
                    }

        for row in order_rows[:20]:
            oid = row["id"]
            stats = stats_by_order.get(oid)
            if not stats or not stats.get("last_created_at"):
                continue
            other_id = row["freelancer_id"] if row["client_id"] == user_id else row["client_id"]
            items.append(
                {
                    "id": f"message-{oid}",
                    "kind": "message",
                    "title": profiles_map.get(other_id, "Foydalanuvchi"),
                    "body": stats.get("last_content"),
                    "href": f"/dashboard/messages?order={oid}",
                    "created_at": stats["last_created_at"],
                }
            )

    transactions = run_query(
        lambda: admin.table("transactions")
        .select("id, type, amount, order_id, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit * 2)
        .execute()
    )
    for row in transactions.data or []:
        if not row.get("created_at"):
            continue
        oid = row.get("order_id")
        items.append(
            {
                "id": f"payment-{row['id']}",
                "kind": "payment",
                "title": "payment",
                "payment_type": row.get("type") or "",
                "amount": abs(int(row.get("amount") or 0)),
                "href": f"/dashboard/orders/{oid}" if oid else "/dashboard/wallet",
                "created_at": row["created_at"],
            }
        )

    seen: set[str] = set()
    deduped: list[dict[str, Any]] = []
    for item in items:
        key = f"{item['kind']}:{item.get('href') or item['id']}"
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)

    deduped.sort(key=lambda x: x["created_at"], reverse=True)
    return deduped[:limit]
