from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client

from app.auth.jwt_verify import verify_supabase_token
from app.auth_profile_cache import fetch_profile_guard_deduped, get_cached_profile_guard, store_profile_guard
from app.database import create_supabase_user_client, get_supabase_admin
from app.db_utils import run_query
from app.supabase_instrumentation import reset_request_component, set_request_component

security = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class UserAuth:
    user_id: str
    supabase: Client


@dataclass(frozen=True)
class UserAuthWithProfile:
    user_id: str
    supabase: Client
    profile: dict


def _enforce_profile_guard(guard) -> None:
    if guard.is_banned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hisob bloklangan")
    if guard.is_suspended:
        from datetime import datetime, timezone

        until = guard.suspended_until
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


def _fetch_guard_row(supabase: Client, user_id: str) -> dict | None:
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
    data = row.data or []
    return data[0] if data else None


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
    guard = fetch_profile_guard_deduped(user_id, lambda: _fetch_guard_row(supabase, user_id))
    _enforce_profile_guard(guard)

    return UserAuth(user_id=user_id, supabase=supabase)


def require_user_auth_with_profile(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
) -> UserAuthWithProfile:
    """Dashboard summary: bitta profiles.select (guard + to'liq profil)."""
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token kerak")

    token = credentials.credentials
    payload = verify_supabase_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Noto'g'ri token")

    supabase = create_supabase_user_client(token)
    comp_token = set_request_component("auth_summary_profile")
    try:
        row = run_query(
            lambda: supabase.table("profiles").select("*").eq("id", user_id).single().execute()
        )
    finally:
        reset_request_component(comp_token)

    if not row.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil topilmadi")

    profile = row.data
    guard = store_profile_guard(
        user_id,
        {
            "is_banned": profile.get("is_banned"),
            "is_suspended": profile.get("is_suspended"),
            "suspended_until": profile.get("suspended_until"),
        },
    )
    _enforce_profile_guard(guard)

    return UserAuthWithProfile(user_id=user_id, supabase=supabase, profile=profile)


UserAuthDep = Annotated[UserAuth, Depends(require_user_auth)]
UserAuthWithProfileDep = Annotated[UserAuthWithProfile, Depends(require_user_auth_with_profile)]


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
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None

    cached = get_cached_profile_guard(user_id)
    if cached is not None:
        if cached.is_banned:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hisob bloklangan")
        return user_id

    try:
        admin = get_supabase_admin()
        row = run_query(
            lambda: admin.table("profiles")
            .select("is_banned, is_suspended, suspended_until")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
    except Exception:
        return None
    data = row.data or []
    profile_row = data[0] if data else None
    guard = fetch_profile_guard_deduped(user_id, lambda: profile_row)
    if guard.is_banned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hisob bloklangan")
    return user_id


CurrentUserId = Annotated[str, Depends(get_current_user_id)]
OptionalUserId = Annotated[str | None, Depends(get_optional_user_id)]
AdminSupabase = Annotated[Client, Depends(get_supabase_admin)]
