"""Profil guard (ban/suspend) — TTL + inflight dedupe."""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass
from typing import Any, Callable

GUARD_TTL_SEC = 60.0

_lock = threading.Lock()
_cache: dict[str, tuple[dict[str, Any] | None, float]] = {}
_inflight: dict[str, threading.Event] = {}


@dataclass(frozen=True)
class ProfileGuard:
    is_banned: bool
    is_suspended: bool
    suspended_until: str | None


def _to_guard(row: dict[str, Any] | None) -> ProfileGuard:
    if not row:
        return ProfileGuard(is_banned=False, is_suspended=False, suspended_until=None)
    return ProfileGuard(
        is_banned=bool(row.get("is_banned")),
        is_suspended=bool(row.get("is_suspended")),
        suspended_until=row.get("suspended_until"),
    )


def get_cached_profile_guard(user_id: str) -> ProfileGuard | None:
    now = time.monotonic()
    with _lock:
        entry = _cache.get(user_id)
        if entry and now - entry[1] < GUARD_TTL_SEC:
            return _to_guard(entry[0])
    return None


def store_profile_guard(user_id: str, row: dict[str, Any] | None) -> ProfileGuard:
    with _lock:
        _cache[user_id] = (row, time.monotonic())
    return _to_guard(row)


def invalidate_profile_guard(user_id: str) -> None:
    with _lock:
        _cache.pop(user_id, None)


def fetch_profile_guard_deduped(user_id: str, fetch_fn: Callable[[], dict[str, Any] | None]) -> ProfileGuard:
    cached = get_cached_profile_guard(user_id)
    if cached is not None:
        return cached

    leader = False
    wait_event: threading.Event | None = None

    with _lock:
        cached = get_cached_profile_guard(user_id)
        if cached is not None:
            return cached
        if user_id not in _inflight:
            wait_event = threading.Event()
            _inflight[user_id] = wait_event
            leader = True
        else:
            wait_event = _inflight[user_id]

    if not leader:
        wait_event.wait(timeout=15.0)
        cached = get_cached_profile_guard(user_id)
        if cached is not None:
            return cached
        row = fetch_fn()
        return store_profile_guard(user_id, row)

    try:
        row = fetch_fn()
        return store_profile_guard(user_id, row)
    finally:
        with _lock:
            ev = _inflight.pop(user_id, None)
        if ev:
            ev.set()
