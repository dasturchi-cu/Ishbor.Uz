"""Admin role hierarchy: super_admin > admin > moderator > support."""

from __future__ import annotations

import time
from typing import Literal

from fastapi import HTTPException, status

from app.config import settings
from app.database import get_supabase_admin
from app.db_utils import run_query

AdminRole = Literal["super_admin", "admin", "moderator", "support"]

_ROLE_RANK: dict[str, int] = {
    "support": 1,
    "moderator": 2,
    "admin": 3,
    "super_admin": 4,
}

_role_cache: dict[str, tuple[str | None, float]] = {}


def _cache_ttl_sec() -> float:
    return 5.0 if settings.is_production else 30.0


def _resolve_role(row: dict | None) -> str | None:
    if not row:
        return None
    if not row.get("is_admin"):
        return None
    role = row.get("admin_role")
    if role in _ROLE_RANK:
        return role
    return "admin"


def get_admin_role(user_id: str) -> str | None:
    now = time.monotonic()
    cached = _role_cache.get(user_id)
    if cached and now - cached[1] < _cache_ttl_sec():
        return cached[0]

    supabase = get_supabase_admin()
    result = run_query(
        lambda: supabase.table("profiles")
        .select("is_admin, admin_role")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    row = (result.data or [None])[0]
    role = _resolve_role(row)
    _role_cache[user_id] = (role, now)
    return role


def require_admin_role(user_id: str, minimum: AdminRole = "moderator") -> str:
    role = get_admin_role(user_id)
    if not role:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin ruxsati kerak")
    if _ROLE_RANK.get(role, 0) < _ROLE_RANK[minimum]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Yetarli admin darajasi yo'q")
    return role


def invalidate_admin_cache(user_id: str) -> None:
    _role_cache.pop(user_id, None)
