"""Rate limiting — Redis (tavsiya) yoki Postgres fallback."""

from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta

from app.config import settings
from app.database import get_supabase_admin
from app.db_utils import run_query

logger = logging.getLogger("ishbor.rate_limit")

_WINDOW_SECONDS = 60
_MAX_HITS = 40
_redis_client = None
_redis_unavailable = False


def _get_redis():
    global _redis_client, _redis_unavailable
    if _redis_unavailable or not settings.redis_url.strip():
        return None
    if _redis_client is not None:
        return _redis_client
    try:
        import redis

        client = redis.from_url(
            settings.redis_url.strip(),
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=2,
        )
        client.ping()
        _redis_client = client
        return _redis_client
    except Exception as exc:
        logger.warning("Redis unavailable, using Postgres rate limit: %s", exc)
        _redis_unavailable = True
        return None


def _check_redis(bucket_key: str, *, max_hits: int, window_seconds: int) -> bool | None:
    client = _get_redis()
    if client is None:
        return None
    key = f"rl:{bucket_key}"
    try:
        pipe = client.pipeline()
        pipe.incr(key)
        pipe.ttl(key)
        count, ttl = pipe.execute()
        if ttl == -1:
            client.expire(key, window_seconds)
        return int(count) <= max_hits
    except Exception as exc:
        logger.warning("Redis rate limit error: %s", exc)
        global _redis_unavailable
        _redis_unavailable = True
        _redis_client = None
        return None


def _check_postgres(bucket_key: str, *, max_hits: int, window_seconds: int) -> bool:
    supabase = get_supabase_admin()
    window_start = (datetime.now(UTC) - timedelta(seconds=window_seconds)).isoformat()

    try:
        run_query(
            lambda: supabase.table("rate_limit_hits")
            .delete()
            .lt("created_at", window_start)
            .execute()
        )
    except Exception:
        pass

    try:
        recent = run_query(
            lambda: supabase.table("rate_limit_hits")
            .select("id", count="exact")
            .eq("bucket_key", bucket_key)
            .gte("created_at", window_start)
            .execute()
        )
        if (recent.count or 0) >= max_hits:
            return False
        run_query(
            lambda: supabase.table("rate_limit_hits")
            .insert({"bucket_key": bucket_key})
            .execute()
        )
        return True
    except Exception:
        return False


def check_rate_limit(
    bucket_key: str,
    *,
    max_hits: int = _MAX_HITS,
    window_seconds: int = _WINDOW_SECONDS,
) -> bool:
    """Return True if request is allowed."""
    redis_ok = _check_redis(bucket_key, max_hits=max_hits, window_seconds=window_seconds)
    if redis_ok is not None:
        return redis_ok
    return _check_postgres(bucket_key, max_hits=max_hits, window_seconds=window_seconds)
