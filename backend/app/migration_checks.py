"""DB migration / RLS readiness verification."""

from __future__ import annotations

from typing import Any

from app.database import get_supabase_admin
from app.db_utils import run_query

REQUIRED_CHECKS: dict[str, bool] = {
    "profiles_insert_guard_trigger": True,
    "rate_limit_hits_table": True,
    "profiles_rls_enabled": True,
    "vacancy_applications_guard_trigger": True,
    "project_applications_guard_trigger": True,
    "service_moderation_guard_trigger": True,
    "participant_profiles_view": True,
    "participant_profiles_security_invoker": True,
    "profiles_order_participant_leak": False,
    "payment_intents_client_update": False,
    "orders_client_insert": False,
    "payment_intents_client_insert": False,
    "services_includes_column": True,
    "services_faq_column": True,
}


def fetch_launch_readiness() -> dict[str, Any]:
    supabase = get_supabase_admin()
    result = run_query(lambda: supabase.rpc("check_launch_readiness").execute())
    data = result.data
    if isinstance(data, dict):
        return data
    if isinstance(data, list) and data and isinstance(data[0], dict):
        return data[0]
    return {}


def verify_launch_readiness() -> tuple[bool, dict[str, Any]]:
    """Return (ok, details). Missing RPC => migrations not pushed."""
    try:
        checks = fetch_launch_readiness()
    except Exception as exc:
        return False, {
            "error": "check_launch_readiness RPC unavailable — run pnpm db:push",
            "detail": str(exc)[:200],
        }

    if not checks:
        return False, {"error": "check_launch_readiness returned empty result"}

    failures: dict[str, Any] = {}
    for key, expected in REQUIRED_CHECKS.items():
        actual = checks.get(key)
        if actual is not expected:
            failures[key] = {"expected": expected, "actual": actual}

    ok = not failures
    return ok, {"checks": checks, "failures": failures}
