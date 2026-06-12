from fastapi import APIRouter, HTTPException, status

from app.admin_rbac import require_admin_role
from app.config import settings
from app.database import get_supabase_admin
from app.db_utils import run_query
from app.deps import UserAuthDep
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


def _check_database_ready() -> None:
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


@router.get("/health/ready")
def health_ready():
    _check_database_ready()
    migrations_ok, _migration_details = verify_launch_readiness()
    return {
        "status": "ready" if migrations_ok else "degraded",
        "database": "ok",
    }


@router.get("/health/ready/detailed")
def health_ready_detailed(auth: UserAuthDep):
    require_admin_role(auth.user_id, "moderator")
    _check_database_ready()
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
