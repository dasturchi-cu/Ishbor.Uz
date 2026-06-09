"""Cloudflare Turnstile verification (optional when configured)."""

from __future__ import annotations

import logging

import httpx

from app.config import settings

logger = logging.getLogger("ishbor.captcha")


def captcha_required() -> bool:
    return bool(settings.turnstile_secret_key.strip())


def verify_turnstile(token: str | None, remote_ip: str | None = None) -> bool:
    secret = settings.turnstile_secret_key.strip()
    if not secret:
        return True
    if not token or not token.strip():
        return False
    try:
        res = httpx.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            data={"secret": secret, "response": token.strip(), "remoteip": remote_ip or ""},
            timeout=10.0,
        )
        if res.status_code >= 400:
            return False
        body = res.json()
        return bool(body.get("success"))
    except Exception as exc:
        logger.warning("turnstile_verify_error: %s", exc)
        return False
