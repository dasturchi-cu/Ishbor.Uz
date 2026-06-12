import pytest
from fastapi import HTTPException

from app.config import settings
from app.session_idle import enforce_and_touch_session_idle


def test_session_idle_skipped_when_disabled(monkeypatch):
    monkeypatch.setattr(settings, "session_idle_minutes", 0)
    enforce_and_touch_session_idle("user-1")


def test_session_idle_raises_when_expired(monkeypatch):
    monkeypatch.setattr(settings, "session_idle_minutes", 30)

    class _FakeRedis:
        def get(self, _key):
            return "1.0"

        def set(self, *_a, **_k):
            return None

    monkeypatch.setattr("app.session_idle._get_redis", lambda: _FakeRedis())
    monkeypatch.setattr("app.session_idle.time.time", lambda: 10000.0)

    with pytest.raises(HTTPException) as exc:
        enforce_and_touch_session_idle("user-1")
    assert exc.value.status_code == 401
