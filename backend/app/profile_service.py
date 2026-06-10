"""Profil yozish — onboarding va PATCH /profiles/me."""

from __future__ import annotations

from fastapi import HTTPException, status
from postgrest.exceptions import APIError

from app.database import get_supabase_admin
from app.db_utils import run_query
from app.timing_log import timed


def ensure_profile_row(user_id: str, *, email: str | None = None, role: str = "freelancer") -> None:
    """auth.users trigger o'tkazib yuborgan bo'lsa, profil qatorini yaratadi."""
    admin = get_supabase_admin()
    existing = run_query(
        lambda: admin.table("profiles").select("id").eq("id", user_id).limit(1).execute()
    )
    if existing.data:
        return

    resolved_email = email
    if not resolved_email:
        try:
            auth_user = admin.auth.admin.get_user_by_id(user_id)
            resolved_email = auth_user.user.email if auth_user and auth_user.user else None
        except Exception:
            resolved_email = None

    try:
        run_query(
            lambda: admin.table("profiles")
            .insert(
                {
                    "id": user_id,
                    "email": resolved_email,
                    "full_name": "",
                    "role": role if role in ("freelancer", "client") else "freelancer",
                }
            )
            .execute()
        )
    except APIError as exc:
        code = getattr(exc, "code", None)
        if code != "23505":
            raise


def update_profile_row(user_id: str, data: dict) -> dict:
    """Service role orqali profil yangilash — yangilangan qatorni qaytaradi."""
    admin = get_supabase_admin()

    def _apply_update() -> None:
        run_query(
            lambda: admin.table("profiles").update(data).eq("id", user_id).execute(),
            op="profiles.update",
        )

    try:
        with timed("profile.update_row", user_id=user_id, fields=list(data.keys())):
            _apply_update()
    except APIError as exc:
        raise _map_profile_api_error(exc) from exc

    refetch = run_query(
        lambda: admin.table("profiles").select("*").eq("id", user_id).limit(1).execute()
    )
    if refetch.data:
        return refetch.data[0]

    ensure_profile_row(user_id, role=str(data.get("role") or "freelancer"))
    try:
        _apply_update()
    except APIError as exc:
        raise _map_profile_api_error(exc) from exc

    refetch = run_query(
        lambda: admin.table("profiles").select("*").eq("id", user_id).limit(1).execute()
    )
    if refetch.data:
        return refetch.data[0]

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profil topilmadi")


def _map_profile_api_error(exc: APIError) -> HTTPException:
    code = getattr(exc, "code", None)
    message = getattr(exc, "message", "") or str(exc)

    if code == "23505" or "unique" in message.lower():
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username band")
    if code == "23514":
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Kiritilgan qiymat noto'g'ri")
    if code == "42703" or ("column" in message.lower() and "does not exist" in message.lower()):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ma'lumotlar bazasi yangilanmagan. Migratsiyalarni ishga tushiring.",
        )
    if code == "42501" or "row-level security" in message.lower():
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Profil saqlashga ruxsat yo'q. Qayta kiring.",
        )

    return HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="Profil saqlanmadi. Qayta urinib ko'ring.",
    )
