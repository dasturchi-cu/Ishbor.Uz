from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field

from app.captcha_service import captcha_required, verify_turnstile
from app.client_ip import get_client_ip
from app.database import get_supabase_admin
from app.db_utils import run_query

router = APIRouter(prefix="/waitlist", tags=["waitlist"])


class WaitlistCreate(BaseModel):
    email: EmailStr
    source: str = Field(default="general", max_length=64)
    turnstile_token: str | None = Field(default=None, max_length=2048)


@router.post("", status_code=status.HTTP_204_NO_CONTENT)
def join_waitlist(payload: WaitlistCreate, request: Request):
    if captcha_required() and not verify_turnstile(payload.turnstile_token, get_client_ip(request)):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="captcha_failed")
    email = payload.email.strip().lower()
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email kerak")

    supabase = get_supabase_admin()
    existing = run_query(
        lambda: supabase.table("waitlist_emails")
        .select("id")
        .eq("email", email)
        .eq("source", payload.source)
        .limit(1)
        .execute()
    )
    if existing.data:
        return None

    try:
        run_query(
            lambda: supabase.table("waitlist_emails")
            .insert({"email": email, "source": payload.source})
            .execute()
        )
    except Exception as exc:
        from postgrest.exceptions import APIError

        if isinstance(exc, APIError) and getattr(exc, "code", None) == "23505":
            return None
        raise
    return None
