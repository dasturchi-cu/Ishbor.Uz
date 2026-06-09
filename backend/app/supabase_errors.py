from fastapi import Request
from fastapi.responses import JSONResponse
from postgrest.exceptions import APIError

from app.config import settings

MAX_INT = 2_147_483_647


def map_supabase_error(exc: APIError) -> str:
    code = getattr(exc, "code", None)
    message = getattr(exc, "message", "") or str(exc)
    details = getattr(exc, "details", "") or ""

    if code == "PGRST201" or "more than one relationship was found" in message.lower():
        return "Ma'lumotlar bazasi so'rovi xatosi (profil bog'lanishi). Administratorga xabar bering."
    if code == "22003" or "out of range" in message.lower():
        return f"Qiymat juda katta (maksimum {MAX_INT:,} so'm)".replace(",", " ")
    if code == "23505":
        return "Bu ma'lumot allaqachon mavjud"
    if code == "23503":
        return "Bog'liq ma'lumot topilmadi"
    if code == "23514":
        return "Kiritilgan qiymat noto'g'ri"
    if code == "42501" or "row-level security" in message.lower():
        return "Ruxsat yo'q. Mijoz sifatida kiring yoki qayta urinib ko'ring."
    if "column" in message.lower() and "does not exist" in message.lower():
        return "Ma'lumotlar bazasi yangilanmagan. Migratsiyalarni ishga tushiring."
    if not settings.is_production and details:
        return f"Ma'lumotlar bazasi xatosi: {details[:200]}"

    return "Ma'lumotlar bazasi xatosi"


async def supabase_api_error_handler(_request: Request, exc: APIError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"detail": map_supabase_error(exc)})
