from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.database import get_supabase_admin
from app.db_utils import run_query

router = APIRouter(prefix="/waitlist", tags=["waitlist"])


class WaitlistCreate(BaseModel):
    email: EmailStr
    source: str = Field(default="general", max_length=64)


@router.post("", status_code=status.HTTP_204_NO_CONTENT)
def join_waitlist(payload: WaitlistCreate):
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

    run_query(
        lambda: supabase.table("waitlist_emails")
        .insert({"email": email, "source": payload.source})
        .execute()
    )
    return None
