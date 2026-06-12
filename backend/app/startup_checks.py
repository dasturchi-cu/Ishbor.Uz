"""Production startup validation — logs critical misconfigurations."""

from __future__ import annotations

import logging

from app.config import settings

logger = logging.getLogger("ishbor.startup")


def validate_production_settings() -> None:
    if not settings.is_production:
        return

    required = {
        "SUPABASE_URL": settings.supabase_url.strip(),
        "SUPABASE_SERVICE_ROLE_KEY": settings.supabase_service_role_key.strip(),
        "SUPABASE_JWT_SECRET": settings.supabase_jwt_secret.strip(),
        "PAYMENT_WEBHOOK_SECRET": settings.payment_webhook_secret.strip(),
        "CRON_SECRET": settings.cron_secret.strip(),
    }
    if settings.telegram_enabled:
        required["TELEGRAM_WEBHOOK_SECRET"] = settings.telegram_webhook_secret.strip()

    missing = [name for name, value in required.items() if not value]
    if missing:
        msg = f"Production missing required env: {', '.join(missing)}"
        logger.error(msg)
        raise RuntimeError(msg)

    if not settings.cors_origin_list:
        msg = "Production CORS_ORIGINS is empty"
        logger.error(msg)
        raise RuntimeError(msg)

    anon = settings.supabase_anon_key.strip()
    if not (anon.startswith("eyJ") and len(anon) > 80):
        msg = (
            "Production requires SUPABASE_ANON_KEY as legacy JWT (eyJ...) "
            "for RLS-scoped user requests"
        )
        logger.error(msg)
        raise RuntimeError(msg)

    if settings.docs_enabled:
        msg = "Production must not expose API docs (set DOCS_ENABLED=false)"
        logger.error(msg)
        raise RuntimeError(msg)

    if not settings.click_enabled and not settings.payme_enabled:
        logger.info(
            "Production: live payments deferred by design — "
            "sandbox/checkout flags only until merchant credentials are configured"
        )

    if not settings.redis_url.strip():
        logger.warning(
            "Production: REDIS_URL is empty — rate limiting uses Postgres fallback (slower under load)"
        )
