"""Telegram Bot API orqali bildirishnomalar."""

from __future__ import annotations

import logging

import httpx

from app.config import settings

logger = logging.getLogger("ishbor.telegram")


def send_telegram(chat_id: str, message: str) -> bool:
    token = settings.telegram_bot_token.strip()
    text = (message or "").strip()[:4000]
    if not chat_id or not text:
        return False
    if not token:
        logger.debug("[telegram-stub] chat=%s msg=%s", chat_id, text[:80])
        return True
    try:
        res = httpx.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": text, "disable_web_page_preview": True},
            timeout=10.0,
        )
        if res.status_code >= 400:
            logger.warning("Telegram send failed status=%s body=%s", res.status_code, res.text[:200])
            return False
        return True
    except Exception as exc:
        logger.warning("Telegram send error chat=%s: %s", chat_id, exc)
        return False
