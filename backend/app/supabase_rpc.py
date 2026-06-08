"""Supabase RPC yordamchilari va xato mapping."""

from fastapi import HTTPException, status
from postgrest.exceptions import APIError


_RPC_ERRORS: dict[str, tuple[int, str]] = {
    "ORDER_NOT_FOUND": (status.HTTP_404_NOT_FOUND, "Buyurtma topilmadi"),
    "FORBIDDEN": (status.HTTP_403_FORBIDDEN, "Ruxsat yo'q"),
    "ORDER_NOT_PENDING": (status.HTTP_400_BAD_REQUEST, "Buyurtma pending holatda emas"),
    "ALREADY_HELD": (status.HTTP_400_BAD_REQUEST, "To'lov allaqachon amalga oshirilgan"),
    "PROFILE_NOT_FOUND": (status.HTTP_404_NOT_FOUND, "Profil topilmadi"),
    "INSUFFICIENT_BALANCE": (status.HTTP_400_BAD_REQUEST, "Balans yetarli emas"),
    "REQUEST_NOT_FOUND": (status.HTTP_404_NOT_FOUND, "So'rov topilmadi"),
    "ALREADY_PROCESSED": (status.HTTP_400_BAD_REQUEST, "So'rov allaqachon ko'rib chiqilgan"),
    "INVALID_PAYOUT": (status.HTTP_400_BAD_REQUEST, "To'lov summasi noto'g'ri"),
}


def map_rpc_error(exc: APIError) -> HTTPException:
    msg = str(exc.message or exc)
    for code, (http_status, detail) in _RPC_ERRORS.items():
        if code in msg:
            return HTTPException(status_code=http_status, detail=detail)
    return HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=msg)


def rpc_row(result) -> dict:
    data = result.data
    if isinstance(data, list):
        return data[0] if data else {}
    if isinstance(data, dict):
        return data
    return {}
