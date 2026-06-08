from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.jwt_verify import verify_supabase_token
from app.database import get_supabase

security = HTTPBearer(auto_error=False)


def _assert_not_banned(user_id: str) -> None:
    supabase = get_supabase()
    row = supabase.table("profiles").select("is_banned").eq("id", user_id).single().execute()
    if row.data and row.data.get("is_banned"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hisob bloklangan")


def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> str:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token kerak")

    payload = verify_supabase_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Noto'g'ri token")
    _assert_not_banned(user_id)
    return user_id


def get_optional_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> str | None:
    if credentials is None:
        return None
    try:
        payload = verify_supabase_token(credentials.credentials)
        return payload.get("sub") or None
    except HTTPException:
        return None


CurrentUserId = Annotated[str, Depends(get_current_user_id)]
OptionalUserId = Annotated[str | None, Depends(get_optional_user_id)]
