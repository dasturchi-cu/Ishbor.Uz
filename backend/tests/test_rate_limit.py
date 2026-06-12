from unittest.mock import MagicMock, patch

from app import rate_limit as rl


def test_check_rate_limit_uses_postgres_when_no_redis(monkeypatch):
    monkeypatch.setattr(rl.settings, "redis_url", "")
    calls: list[str] = []

    def fake_postgres(key: str, *, max_hits: int, window_seconds: int = 60) -> bool:
        calls.append(key)
        return True

    monkeypatch.setattr(rl, "_check_postgres", fake_postgres)
    assert rl.check_rate_limit("test:1") is True
    assert calls == ["test:1"]


def test_check_rate_limit_prefers_redis(monkeypatch):
    monkeypatch.setattr(rl.settings, "redis_url", "redis://localhost:6379/0")

    def fake_redis(key: str, *, max_hits: int, window_seconds: int = 60) -> bool:
        return True

    def fake_postgres(key: str, *, max_hits: int, window_seconds: int = 60) -> bool:
        raise AssertionError("Postgres should not be called when Redis succeeds")

    monkeypatch.setattr(rl, "_check_redis", fake_redis)
    monkeypatch.setattr(rl, "_check_postgres", fake_postgres)
    assert rl.check_rate_limit("test:2") is True


def test_check_rate_limit_redis_fallback_to_postgres(monkeypatch):
    monkeypatch.setattr(rl.settings, "redis_url", "redis://localhost:6379/0")
    monkeypatch.setattr(rl, "_check_redis", lambda *_a, **_k: None)
    monkeypatch.setattr(rl, "_check_postgres", lambda *_a, **_k: False)
    assert rl.check_rate_limit("test:3") is False
