import uuid

from app.telegram_link_service import create_telegram_link_token, verify_telegram_link_token


def test_telegram_link_token_roundtrip(monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "telegram_webhook_secret", "test-telegram-link-secret")
    user_id = str(uuid.uuid4())
    token = create_telegram_link_token(user_id)
    assert len(token) <= 64
    assert verify_telegram_link_token(token) == user_id


def test_telegram_link_token_rejects_uuid(monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "telegram_webhook_secret", "test-telegram-link-secret")
    assert verify_telegram_link_token(str(uuid.uuid4())) is None


def test_telegram_link_token_rejects_tampered(monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "telegram_webhook_secret", "test-telegram-link-secret")
    token = create_telegram_link_token(str(uuid.uuid4()))
    assert verify_telegram_link_token(token[:-1] + "x") is None
