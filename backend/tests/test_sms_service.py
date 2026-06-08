from app.sms_service import _normalize_uz_phone, send_sms


def test_normalize_uz_phone():
    assert _normalize_uz_phone("+998901234567") == "998901234567"
    assert _normalize_uz_phone("901234567") == "998901234567"
    assert _normalize_uz_phone("invalid") is None


def test_send_sms_stub_without_credentials(monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "eskiz_email", "")
    monkeypatch.setattr(settings, "eskiz_password", "")
    assert send_sms("+998901234567", "Test") is True
