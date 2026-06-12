"""Platform conversion funnel metrics from analytics_events."""

from __future__ import annotations

from typing import Any

from app.database import get_supabase_admin
from app.db_utils import run_query


def _count_events_since(event_name: str, since: str) -> int:
    from postgrest.exceptions import APIError

    admin = get_supabase_admin()
    try:
        result = run_query(
            lambda: admin.table("analytics_events")
            .select("id", count="exact")
            .eq("event_name", event_name)
            .gte("created_at", since)
            .limit(1)
            .execute()
        )
        return int(result.count or 0)
    except APIError:
        return 0


def _rate(numerator: int, denominator: int) -> float:
    if denominator <= 0:
        return 0.0
    return round(numerator / denominator * 100, 1)


def build_funnel_report(since_iso: str, period_days: int) -> dict[str, Any]:
    """Ordered funnel stages for admin dashboard."""
    register_views = _count_events_since("funnel_register_view", since_iso)
    registrations = _count_events_since("register", since_iso)
    logins = _count_events_since("login", since_iso)
    onboarding_complete = _count_events_since("onboarding_complete", since_iso)
    service_views = _count_events_since("service_view", since_iso)
    freelancer_views = _count_events_since("freelancer_view", since_iso)
    project_views = _count_events_since("project_view", since_iso)
    checkout_started = _count_events_since("checkout_started", since_iso) + _count_events_since(
        "funnel_checkout_started", since_iso
    )
    payment_attempts = _count_events_since("payment_attempt", since_iso)
    payment_succeeded = _count_events_since("payment_succeeded", since_iso)
    messages_started = _count_events_since("message_started", since_iso)

    discovery_views = service_views + freelancer_views + project_views

    stages = [
        {
            "id": "register_views",
            "count": register_views,
            "rate_from_previous": None,
        },
        {
            "id": "registrations",
            "count": registrations,
            "rate_from_previous": _rate(registrations, register_views),
        },
        {
            "id": "logins",
            "count": logins,
            "rate_from_previous": _rate(logins, registrations) if registrations else _rate(logins, register_views),
        },
        {
            "id": "profile_completion",
            "count": onboarding_complete,
            "rate_from_previous": _rate(onboarding_complete, registrations),
        },
        {
            "id": "discovery_views",
            "count": discovery_views,
            "rate_from_previous": None,
            "breakdown": {
                "service_view": service_views,
                "freelancer_view": freelancer_views,
                "project_view": project_views,
            },
        },
        {
            "id": "checkout_started",
            "count": checkout_started,
            "rate_from_previous": _rate(checkout_started, discovery_views),
        },
        {
            "id": "payment_attempts",
            "count": payment_attempts,
            "rate_from_previous": _rate(payment_attempts, checkout_started),
        },
        {
            "id": "payment_succeeded",
            "count": payment_succeeded,
            "rate_from_previous": _rate(payment_succeeded, payment_attempts),
        },
        {
            "id": "messages_started",
            "count": messages_started,
            "rate_from_previous": None,
        },
    ]

    return {
        "period_days": period_days,
        "stages": stages,
        "summary": {
            "signup_rate": _rate(registrations, register_views),
            "onboarding_rate": _rate(onboarding_complete, registrations),
            "checkout_rate": _rate(checkout_started, discovery_views),
            "payment_conversion": _rate(payment_succeeded, payment_attempts),
        },
    }
