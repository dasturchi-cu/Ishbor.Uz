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
    }
    missing = [name for name, value in required.items() if not value]
    if missing:
        logger.error("Production missing required env: %s", ", ".join(missing))

    if not settings.cors_origin_list:
        logger.error("Production CORS_ORIGINS is empty")

    if not settings.click_enabled and not settings.payme_enabled:
        logger.warning("Production: neither Click nor Payme is configured — checkout will fail")
