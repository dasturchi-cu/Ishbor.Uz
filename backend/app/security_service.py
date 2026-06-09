"""Security events, suspicious login detection, phone OTP."""

from __future__ import annotations

import hashlib
import logging
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException, Request, status

from app.database import get_supabase_admin
from app.db_utils import run_query
from app.sms_service import send_sms, _normalize_uz_phone

logger = logging.getLogger("ishbor.security")

_OTP_TTL_MINUTES = 10
_MAX_OTP_ATTEMPTS = 5
_SUSPICIOUS_WINDOW_MINUTES = 15
_SUSPICIOUS_FAIL_THRESHOLD = 8


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def client_ip(request: Request | None) -> str | None:
    if not request:
        return None
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


def log_security_event(
    event_type: str,
    *,
    user_id: str | None = None,
    severity: str = "info",
    metadata: dict[str, Any] | None = None,
    request: Request | None = None,
) -> None:
    admin = get_supabase_admin()
    row = {
        "user_id": user_id,
        "event_type": event_type,
        "severity": severity,
        "ip_address": client_ip(request),
        "user_agent": request.headers.get("user-agent") if request else None,
        "metadata": metadata or {},
    }
    try:
        run_query(lambda: admin.table("security_events").insert(row).execute())
    except Exception as exc:
        logger.error("security_event_write_failed type=%s err=%s", event_type, exc)


def record_login_attempt(
    *,
    success: bool,
    user_id: str | None,
    email: str | None,
    request: Request | None,
) -> None:
    ip = client_ip(request)
    log_security_event(
        "login_success" if success else "login_failed",
        user_id=user_id,
        severity="info" if success else "low",
        metadata={"email": email},
        request=request,
    )
    if not success and ip:
        _check_suspicious_ip(ip, email)


def _check_suspicious_ip(ip: str, email: str | None) -> None:
    admin = get_supabase_admin()
    since = (datetime.now(timezone.utc) - timedelta(minutes=_SUSPICIOUS_WINDOW_MINUTES)).isoformat()
    try:
        result = run_query(
            lambda: admin.table("security_events")
            .select("id", count="exact")
            .eq("event_type", "login_failed")
            .eq("ip_address", ip)
            .gte("created_at", since)
            .execute()
        )
        count = int(result.count or 0)
        if count >= _SUSPICIOUS_FAIL_THRESHOLD:
            log_security_event(
                "suspicious_login_burst",
                severity="high",
                metadata={"ip": ip, "fail_count": count, "email": email},
            )
    except Exception as exc:
        logger.warning("suspicious_check_failed: %s", exc)


def send_phone_otp(user_id: str, phone: str) -> None:
    mobile = _normalize_uz_phone(phone)
    if not mobile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid_phone")

    code = f"{secrets.randbelow(1_000_000):06d}"
    admin = get_supabase_admin()
    expires = datetime.now(timezone.utc) + timedelta(minutes=_OTP_TTL_MINUTES)

    run_query(
        lambda: admin.table("phone_verification_codes")
        .insert(
            {
                "user_id": user_id,
                "phone": mobile,
                "code_hash": _hash_code(code),
                "expires_at": expires.isoformat(),
            }
        )
        .execute()
    )

    sent = send_sms(mobile, f"IshBor.uz tasdiqlash kodi: {code}. 10 daqiqa amal qiladi.")
    if not sent:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="sms_send_failed",
        )


def verify_phone_otp(user_id: str, phone: str, code: str) -> None:
    mobile = _normalize_uz_phone(phone)
    if not mobile or not re.fullmatch(r"\d{6}", code.strip()):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid_otp")

    admin = get_supabase_admin()
    result = run_query(
        lambda: admin.table("phone_verification_codes")
        .select("*")
        .eq("user_id", user_id)
        .eq("phone", mobile)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    row = (result.data or [None])[0]
    if not row:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="otp_not_found")

    if int(row.get("attempts") or 0) >= _MAX_OTP_ATTEMPTS:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="otp_max_attempts")

    expires = row.get("expires_at")
    if expires:
        try:
            end = datetime.fromisoformat(str(expires).replace("Z", "+00:00"))
            if end.tzinfo is None:
                end = end.replace(tzinfo=timezone.utc)
            if end < datetime.now(timezone.utc):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="otp_expired")
        except HTTPException:
            raise
        except (TypeError, ValueError):
            pass

    if row.get("code_hash") != _hash_code(code.strip()):
        run_query(
            lambda: admin.table("phone_verification_codes")
            .update({"attempts": int(row.get("attempts") or 0) + 1})
            .eq("id", row["id"])
            .execute()
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid_otp")

    now = datetime.now(timezone.utc).isoformat()
    run_query(
        lambda: admin.table("profiles")
        .update({"phone": mobile, "phone_verified_at": now})
        .eq("id", user_id)
        .execute()
    )
    log_security_event("phone_verified", user_id=user_id, severity="info", metadata={"phone": mobile})
