"""Signed Telegram /start link tokens — prevents account-linking IDOR."""

from __future__ import annotations

import base64
import hashlib
import hmac
import struct
import time
import uuid

from app.config import settings

_TOKEN_TTL_SEC = 900


def _link_secret() -> str | None:
    secret = settings.telegram_webhook_secret.strip() or settings.supabase_jwt_secret.strip()
    if secret:
        return secret
    if settings.is_production:
        return None
    return "ishbor-dev-telegram-link-only"


def create_telegram_link_token(user_id: str) -> str:
    secret = _link_secret()
    if not secret:
        raise RuntimeError("Telegram link secret is not configured")
    uid = uuid.UUID(user_id)
    exp = int(time.time()) + _TOKEN_TTL_SEC
    payload = uid.bytes + struct.pack(">I", exp)
    sig = hmac.new(secret.encode(), payload, hashlib.sha256).digest()[:8]
    raw = payload + sig
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def verify_telegram_link_token(token: str) -> str | None:
    secret = _link_secret()
    if not secret:
        return None
    if not token or len(token) > 64:
        return None
    try:
        pad = "=" * (-len(token) % 4)
        raw = base64.urlsafe_b64decode(token + pad)
        if len(raw) != 28:
            return None
        payload, sig = raw[:20], raw[20:]
        uid = uuid.UUID(bytes=payload[:16])
        exp = struct.unpack(">I", payload[16:20])[0]
        if exp < int(time.time()):
            return None
        expected = hmac.new(secret.encode(), payload, hashlib.sha256).digest()[:8]
        if not hmac.compare_digest(expected, sig):
            return None
        return str(uid)
    except (ValueError, struct.error, TypeError):
        return None
