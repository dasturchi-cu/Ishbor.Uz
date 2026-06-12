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


FUNNEL_EVENTS = frozenset(
    {
        "funnel_landing_cta_click",
        "funnel_register_view",
        "funnel_register_role_select",
        "funnel_register_step2",
        "funnel_register_complete",
        "funnel_browse_catalog",
        "funnel_checkout_started",
    }
)

ACTIVATION_EVENTS = frozenset(
    {
        "onboarding_complete",
        "candidate_first_listing",
        "employer_first_action",
    }
)


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


def track_activation_once(
    user_id: str,
    event_name: str,
    *,
    properties: dict[str, Any] | None = None,
) -> bool:
    """Record first-time activation event per user. Returns True if newly recorded."""
    if event_name not in ACTIVATION_EVENTS:
        track_analytics_event(event_name, user_id=user_id, properties=properties)
        return True
    admin = get_supabase_admin()
    try:
        existing = run_query(
            lambda: admin.table("analytics_events")
            .select("id")
            .eq("user_id", user_id)
            .eq("event_name", event_name)
            .limit(1)
            .execute()
        )
        if existing.data:
            return False
    except Exception:
        pass
    track_analytics_event(event_name, user_id=user_id, properties=properties)
    return True


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
        "funnel_cta_clicks": 0,
        "funnel_register_views": 0,
        "funnel_signup_rate": 0.0,
        "activation_onboarding": 0,
        "activation_employer": 0,
        "activation_candidate": 0,
        "users_series": users_series,
        "revenue_series": revenue_series,
        "commission_series": commission_series,
        "top_searches": [],
        "login_events": 0,
        "service_views": 0,
        "freelancer_views": 0,
        "project_views": 0,
        "checkout_started_events": 0,
        "payment_attempt_events": 0,
        "payment_succeeded_events": 0,
        "message_started_events": 0,
        "funnel_report": {"period_days": days, "stages": [], "summary": {}},
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
    funnel_cta = _count_events("funnel_landing_cta_click")
    funnel_register_views = _count_events("funnel_register_view")
    activation_onboarding = _count_events("onboarding_complete")
    activation_employer = _count_events("employer_first_action")
    activation_candidate = _count_events("candidate_first_listing")
    top_searches = _top_search_terms(since)
    from app.analytics_funnel import build_funnel_report

    funnel_report = build_funnel_report(since, days)
    logins = _count_events("login")
    service_views = _count_events("service_view")
    freelancer_views = _count_events("freelancer_view")
    project_views = _count_events("project_view")
    checkout_started = _count_events("checkout_started") + _count_events("funnel_checkout_started")
    payment_attempts = _count_events("payment_attempt")
    payment_succeeded = _count_events("payment_succeeded")
    messages_started = _count_events("message_started")

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
        "funnel_cta_clicks": funnel_cta,
        "funnel_register_views": funnel_register_views,
        "funnel_signup_rate": round(signups / max(funnel_register_views, 1) * 100, 1),
        "activation_onboarding": activation_onboarding,
        "activation_employer": activation_employer,
        "activation_candidate": activation_candidate,
        "users_series": users_series,
        "revenue_series": revenue_series,
        "commission_series": commission_series,
        "top_searches": top_searches,
        "login_events": logins,
        "service_views": service_views,
        "freelancer_views": freelancer_views,
        "project_views": project_views,
        "checkout_started_events": checkout_started,
        "payment_attempt_events": payment_attempts,
        "payment_succeeded_events": payment_succeeded,
        "message_started_events": messages_started,
        "funnel_report": funnel_report,
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
    from app.notification_service import deliver_notification_channels

    batch_size = 200
    sent = 0
    for i in range(0, len(payload), batch_size):
        chunk = payload[i : i + batch_size]
        run_query(lambda c=chunk: admin.table("notifications").insert(c).execute())
        sent += len(chunk)
    for row in rows:
        try:
            deliver_notification_channels(
                row["id"],
                title,
                body,
                ntype="broadcast",
            )
        except Exception:
            pass
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
