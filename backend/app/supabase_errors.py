from fastapi import Request
from fastapi.responses import JSONResponse
from postgrest.exceptions import APIError

MAX_INT = 2_147_483_647


def map_supabase_error(exc: APIError) -> str:
    code = getattr(exc, "code", None)
    message = getattr(exc, "message", "") or str(exc)

    if code == "22003" or "out of range" in message.lower():
        return f"Qiymat juda katta (maksimum {MAX_INT:,} so'm)".replace(",", " ")
    if code == "23505":
        return "Bu ma'lumot allaqachon mavjud"
    if code == "23503":
        return "Bog'liq ma'lumot topilmadi"
    if code == "23514":
        return "Kiritilgan qiymat noto'g'ri"

    return "Ma'lumotlar bazasi xatosi"


async def supabase_api_error_handler(_request: Request, exc: APIError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"detail": map_supabase_error(exc)})
