from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client

from app.auth.jwt_verify import verify_supabase_token
from app.database import create_supabase_user_client, get_supabase_admin
from app.db_utils import run_query
from app.supabase_instrumentation import reset_request_component, set_request_component

security = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class UserAuth:
    user_id: str
    supabase: Client


def require_user_auth(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> UserAuth:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token kerak")

    token = credentials.credentials
    payload = verify_supabase_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Noto'g'ri token")

    supabase = create_supabase_user_client(token)
    comp_token = set_request_component("auth_deps")
    try:
        row = run_query(
            lambda: supabase.table("profiles")
            .select("is_banned, is_suspended, suspended_until")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
    finally:
        reset_request_component(comp_token)
    profile = (row.data or [None])[0]
    if profile and profile.get("is_banned"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hisob bloklangan")
    if profile and profile.get("is_suspended"):
        from datetime import datetime, timezone

        until = profile.get("suspended_until")
        if until is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hisob vaqtincha to'xtatilgan")
        try:
            end = datetime.fromisoformat(str(until).replace("Z", "+00:00"))
            if end.tzinfo is None:
                end = end.replace(tzinfo=timezone.utc)
            if end > datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Hisob vaqtincha to'xtatilgan",
                )
        except HTTPException:
            raise
        except (TypeError, ValueError):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hisob vaqtincha to'xtatilgan")

    return UserAuth(user_id=user_id, supabase=supabase)


UserAuthDep = Annotated[UserAuth, Depends(require_user_auth)]


def get_current_user_id(auth: UserAuthDep) -> str:
    return auth.user_id


def get_optional_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> str | None:
    if credentials is None:
        return None
    try:
        payload = verify_supabase_token(credentials.credentials)
    except HTTPException:
        # Yaroqsiz yoki muddati o'tgan token — ochiq katalog ishlashda davom etadi
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    try:
        admin = get_supabase_admin()
        row = run_query(
            lambda: admin.table("profiles")
            .select("is_banned")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
    except Exception:
        return None
    profile = (row.data or [None])[0]
    if profile and profile.get("is_banned"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hisob bloklangan")
    return user_id


CurrentUserId = Annotated[str, Depends(get_current_user_id)]
OptionalUserId = Annotated[str | None, Depends(get_optional_user_id)]
AdminSupabase = Annotated[Client, Depends(get_supabase_admin)]
