from fastapi import APIRouter, HTTPException, status

from app.config import settings
from app.database import get_supabase_admin
from app.db_utils import run_query
from app.migration_checks import verify_launch_readiness

router = APIRouter()


@router.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ishbor-api",
        "environment": settings.environment,
    }


@router.get("/health/live")
def health_live():
    return {"status": "ok"}


@router.get("/health/ready")
def health_ready():
    if not settings.supabase_url.strip() or not settings.supabase_service_role_key.strip():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not configured",
        )

    try:
        supabase = get_supabase_admin()
        run_query(lambda: supabase.table("profiles").select("id").limit(1).execute())
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        ) from exc

    migrations_ok, migration_details = verify_launch_readiness()

    return {
        "status": "ready" if migrations_ok else "degraded",
        "database": "ok",
        "migrations": migration_details,
        "payments": {
            "click": settings.click_enabled,
            "payme": settings.payme_enabled,
        },
        "notifications": {
            "email": bool(settings.resend_api_key.strip()),
            "sms": settings.sms_enabled,
            "telegram": settings.telegram_enabled,
            "redis": settings.redis_enabled,
        },
    }
