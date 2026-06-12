"""Security endpoints: phone OTP, login audit, security events."""

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.captcha_service import captcha_required, verify_turnstile
from app.config import settings
from app.deps import UserAuthDep
from app.schemas import SecurityConfigResponse
from app.db_utils import run_query
from app.database import get_supabase_admin
from app.rate_limit import check_rate_limit
from app.security_service import (
    log_security_event,
    record_login_attempt,
    send_phone_otp,
    verify_phone_otp,
    client_ip,
)

router = APIRouter(prefix="/security", tags=["security"])


@router.get("/config", response_model=SecurityConfigResponse)
def security_config():
    return SecurityConfigResponse(
        require_email_verified=settings.require_email_verified,
        session_idle_minutes=settings.session_idle_minutes,
    )


class PhoneOtpSend(BaseModel):
    phone: str = Field(min_length=9, max_length=20)


class PhoneOtpVerify(BaseModel):
    phone: str = Field(min_length=9, max_length=20)
    code: str = Field(min_length=6, max_length=6)


class LoginAudit(BaseModel):
    success: bool
    email: str | None = None
    captcha_token: str | None = None


class RegisterAudit(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    captcha_token: str | None = None


@router.post("/phone/send", status_code=status.HTTP_204_NO_CONTENT)
def send_phone_verification(body: PhoneOtpSend, auth: UserAuthDep):
    if not check_rate_limit(f"otp_send:{auth.user_id}", max_hits=3, window_seconds=3600):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="OTP limit — 3 marta/soat",
        )
    send_phone_otp(auth.user_id, body.phone)
    return None


@router.post("/phone/verify", status_code=status.HTTP_204_NO_CONTENT)
def confirm_phone_verification(body: PhoneOtpVerify, auth: UserAuthDep):
    verify_phone_otp(auth.user_id, body.phone, body.code)
    return None


@router.get("/events/me")
def my_security_events(auth: UserAuthDep, limit: int = 20):
    supabase = auth.supabase
    result = run_query(
        lambda: supabase.table("security_events")
        .select("id, event_type, severity, ip_address, metadata, created_at")
        .eq("user_id", auth.user_id)
        .order("created_at", desc=True)
        .limit(min(limit, 50))
        .execute()
    )
    return result.data or []


@router.post("/audit/register", status_code=status.HTTP_204_NO_CONTENT)
def audit_register_precheck(body: RegisterAudit, request: Request):
    ip = client_ip(request) or "unknown"
    if not check_rate_limit(f"register_precheck:{ip}", max_hits=10, window_seconds=3600):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Juda ko'p urinish. Biroz kuting.",
        )
    if captcha_required() and not verify_turnstile(body.captcha_token, ip):
        log_security_event(
            "captcha_failed",
            severity="medium",
            metadata={"email": body.email, "flow": "register"},
            request=request,
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="captcha_failed")
    return None


@router.post("/audit/login", status_code=status.HTTP_204_NO_CONTENT)
def audit_login_event(body: LoginAudit, request: Request, background_tasks: BackgroundTasks):
    if captcha_required() and not verify_turnstile(body.captcha_token, client_ip(request)):
        log_security_event("captcha_failed", severity="medium", metadata={"email": body.email}, request=request)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="captcha_failed")

    background_tasks.add_task(
        record_login_attempt,
        success=body.success,
        user_id=None,
        email=body.email,
        request=request,
    )
    return None


@router.post("/audit/login-authed", status_code=status.HTTP_204_NO_CONTENT)
def audit_login_authed(body: LoginAudit, auth: UserAuthDep, request: Request):
    record_login_attempt(
        success=body.success,
        user_id=auth.user_id,
        email=body.email,
        request=request,
    )
    return None
