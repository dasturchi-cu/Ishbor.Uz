from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app import deps
from app.auth_profile_cache import ProfileGuard, invalidate_profile_guard


def _creds() -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials="test-token")


def test_optional_user_id_blocks_suspended_without_until(monkeypatch):
    user_id = "00000000-0000-4000-8000-000000000010"
    invalidate_profile_guard(user_id)
    monkeypatch.setattr(deps, "verify_supabase_token", lambda _t: {"sub": user_id})
    monkeypatch.setattr(deps, "get_cached_profile_guard", lambda _uid: None)
    monkeypatch.setattr(
        deps,
        "run_query",
        lambda _fn: type("Row", (), {"data": [{"is_banned": False, "is_suspended": True, "suspended_until": None}]})(),
    )

    with pytest.raises(HTTPException) as exc:
        deps.get_optional_user_id(_creds())

    assert exc.value.status_code == 403


def test_optional_user_id_blocks_suspended_until_future(monkeypatch):
    user_id = "00000000-0000-4000-8000-000000000011"
    until = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
    invalidate_profile_guard(user_id)
    monkeypatch.setattr(deps, "verify_supabase_token", lambda _t: {"sub": user_id})
    monkeypatch.setattr(
        deps,
        "get_cached_profile_guard",
        lambda _uid: ProfileGuard(is_banned=False, is_suspended=True, suspended_until=until),
    )

    with pytest.raises(HTTPException) as exc:
        deps.get_optional_user_id(_creds())

    assert exc.value.status_code == 403


def test_optional_user_id_allows_active_user(monkeypatch):
    user_id = "00000000-0000-4000-8000-000000000012"
    invalidate_profile_guard(user_id)
    monkeypatch.setattr(deps, "verify_supabase_token", lambda _t: {"sub": user_id})
    monkeypatch.setattr(deps, "get_cached_profile_guard", lambda _uid: None)
    monkeypatch.setattr(
        deps,
        "run_query",
        lambda _fn: type("Row", (), {"data": [{"is_banned": False, "is_suspended": False, "suspended_until": None}]})(),
    )

    assert deps.get_optional_user_id(_creds()) == user_id


def test_optional_user_id_returns_none_when_profile_missing(monkeypatch):
    user_id = "00000000-0000-4000-8000-000000000013"
    invalidate_profile_guard(user_id)
    monkeypatch.setattr(deps, "verify_supabase_token", lambda _t: {"sub": user_id})
    monkeypatch.setattr(deps, "get_cached_profile_guard", lambda _uid: None)
    monkeypatch.setattr(
        deps,
        "run_query",
        lambda _fn: type("Row", (), {"data": []})(),
    )

    assert deps.get_optional_user_id(_creds()) is None


def test_optional_user_id_light_delegates_guard(monkeypatch):
    user_id = "00000000-0000-4000-8000-000000000014"
    invalidate_profile_guard(user_id)
    monkeypatch.setattr(deps, "verify_supabase_token", lambda _t: {"sub": user_id})
    monkeypatch.setattr(
        deps,
        "get_cached_profile_guard",
        lambda _uid: ProfileGuard(is_banned=True, is_suspended=False, suspended_until=None),
    )

    with pytest.raises(HTTPException) as exc:
        deps.get_optional_user_id_light(_creds())

    assert exc.value.status_code == 403
