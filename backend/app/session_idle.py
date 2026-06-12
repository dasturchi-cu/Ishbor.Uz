"""Server-side session idle enforcement (complements client idle logout)."""

from __future__ import annotations

import logging
import time

from fastapi import HTTPException, status

from app.config import settings
from app.database import get_supabase_admin
from app.db_utils import run_query
from app.rate_limit import _get_redis

logger = logging.getLogger("ishbor.session_idle")


def enforce_and_touch_session_idle(user_id: str) -> None:
    minutes = settings.session_idle_minutes
    if minutes <= 0:
        return

    window_sec = minutes * 60
    key = f"idle:{user_id}"
    now = time.time()

    client = _get_redis()
    if client is not None:
        try:
            last_raw = client.get(key)
            if last_raw is not None:
                elapsed = now - float(last_raw)
                if elapsed > window_sec:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Session idle timeout",
                    )
            client.set(key, str(now), ex=max(window_sec * 2, 60))
            return
        except HTTPException:
            raise
        except Exception as exc:
            logger.warning("Redis session idle check failed, falling back to Postgres: %s", exc)

    from datetime import UTC, datetime

    bucket_key = key
    admin = get_supabase_admin()
    row = run_query(
        lambda: admin.table("rate_limit_hits")
        .select("created_at")
        .eq("bucket_key", bucket_key)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    data = (row.data or [None])[0]
    if data and data.get("created_at"):
        started = data["created_at"]
        if isinstance(started, str):
            started_dt = datetime.fromisoformat(started.replace("Z", "+00:00"))
        else:
            started_dt = started
        if started_dt.tzinfo is None:
            started_dt = started_dt.replace(tzinfo=UTC)
        elapsed = (datetime.now(UTC) - started_dt).total_seconds()
        if elapsed > window_sec:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session idle timeout",
            )

    run_query(
        lambda: admin.table("rate_limit_hits").insert({"bucket_key": bucket_key}).execute()
    )
