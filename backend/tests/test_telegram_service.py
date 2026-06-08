from app.telegram_service import send_telegram


def test_send_telegram_stub_without_token(monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "telegram_bot_token", "")
    assert send_telegram("12345", "Salom") is True
