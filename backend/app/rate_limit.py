"""Postgres-backed rate limiting (survives restarts, shared across workers)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from app.database import get_supabase_admin

_WINDOW_SECONDS = 60
_MAX_HITS = 40


def check_rate_limit(bucket_key: str, *, max_hits: int = _MAX_HITS) -> bool:
    """Return True if request is allowed."""
    supabase = get_supabase_admin()
    window_start = (datetime.now(UTC) - timedelta(seconds=_WINDOW_SECONDS)).isoformat()

    try:
        supabase.table("rate_limit_hits").delete().lt("created_at", window_start).execute()
    except Exception:
        pass

    try:
        recent = (
            supabase.table("rate_limit_hits")
            .select("id", count="exact")
            .eq("bucket_key", bucket_key)
            .gte("created_at", window_start)
            .execute()
        )
        if (recent.count or 0) >= max_hits:
            return False
        supabase.table("rate_limit_hits").insert({"bucket_key": bucket_key}).execute()
        return True
    except Exception:
        return True
