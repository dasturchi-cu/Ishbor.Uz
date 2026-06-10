from app.auth_profile_cache import (
    _cache,
    _inflight,
    fetch_profile_guard_deduped,
    invalidate_profile_guard,
)


def test_fetch_profile_guard_deduped_no_deadlock_on_cache_miss():
    """Regression: nested Lock in fetch_profile_guard_deduped caused permanent hang."""
    _cache.clear()
    _inflight.clear()
    invalidate_profile_guard("user-deadlock-test")

    calls = {"n": 0}

    def fetch_fn():
        calls["n"] += 1
        return {"is_banned": False, "is_suspended": False, "suspended_until": None}

    guard = fetch_profile_guard_deduped("user-deadlock-test", fetch_fn)
    assert guard.is_banned is False
    assert calls["n"] == 1

    guard2 = fetch_profile_guard_deduped("user-deadlock-test", fetch_fn)
    assert guard2.is_banned is False
    assert calls["n"] == 1
