"""SMS via Eskiz.uz (O'zbekiston). Credential bo'lmasa stub log."""

from __future__ import annotations

import logging
import re
import time

import httpx

from app.config import settings

logger = logging.getLogger("ishbor.sms")

_ESKIZ_BASE = "https://notify.eskiz.uz/api"
_token: str | None = None
_token_expires_at: float = 0.0


def _normalize_uz_phone(phone: str) -> str | None:
    digits = re.sub(r"\D", "", phone or "")
    if digits.startswith("998") and len(digits) == 12:
        return digits
    if len(digits) == 9:
        return f"998{digits}"
    return None


def _eskiz_token() -> str | None:
    global _token, _token_expires_at
    email = settings.eskiz_email.strip()
    password = settings.eskiz_password.strip()
    if not email or not password:
        return None
    now = time.time()
    if _token and now < _token_expires_at - 60:
        return _token
    try:
        res = httpx.post(
            f"{_ESKIZ_BASE}/auth/login",
            data={"email": email, "password": password},
            timeout=10.0,
        )
        if res.status_code >= 400:
            logger.warning("Eskiz auth failed status=%s", res.status_code)
            return None
        body = res.json()
        token = body.get("data", {}).get("token") if isinstance(body.get("data"), dict) else body.get("token")
        if not token:
            return None
        _token = str(token)
        _token_expires_at = now + 29 * 24 * 3600
        return _token
    except Exception as exc:
        logger.warning("Eskiz auth error: %s", exc)
        return None


def send_sms(phone: str, message: str) -> bool:
    """Send SMS; return True if sent (or stub logged)."""
    mobile = _normalize_uz_phone(phone)
    if not mobile:
        logger.debug("SMS skipped invalid phone=%s", phone)
        return False
    text = (message or "").strip()[:480]
    if not text:
        return False

    token = _eskiz_token()
    if not token:
        logger.debug("[sms-stub] to=%s msg=%s", mobile, text[:80])
        return True

    sender = settings.eskiz_from.strip() or "4546"
    try:
        res = httpx.post(
            f"{_ESKIZ_BASE}/message/sms/send",
            headers={"Authorization": f"Bearer {token}"},
            data={"mobile_phone": mobile, "message": text, "from": sender},
            timeout=15.0,
        )
        if res.status_code >= 400:
            logger.warning("Eskiz send failed status=%s body=%s", res.status_code, res.text[:200])
            return False
        return True
    except Exception as exc:
        logger.warning("Eskiz send error to=%s: %s", mobile, exc)
        return False
