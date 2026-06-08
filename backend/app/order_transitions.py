"""Buyurtma status o'tish qoidalari."""

from fastapi import HTTPException, status

ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "pending": {"active", "cancelled"},
    "active": {"delivered", "cancelled", "disputed"},
    "delivered": {"completed", "disputed", "active"},
    "disputed": {"completed", "cancelled", "active"},
    "completed": set(),
    "cancelled": set(),
}


def validate_order_transition(
    current: str,
    new: str,
    user_id: str,
    client_id: str,
    freelancer_id: str,
    payment_status: str | None = None,
) -> None:
    allowed = ALLOWED_TRANSITIONS.get(current, set())
    if new not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{current}' dan '{new}' ga o'tish mumkin emas",
        )

    is_client = user_id == client_id
    is_freelancer = user_id == freelancer_id

    if current == "pending" and new == "active":
        if payment_status != "held":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Freelancer qabul qilishdan oldin mijoz to'lovni amalga oshirishi kerak",
            )
        if not is_freelancer:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat freelancer qabul qiladi")
    if current == "pending" and new == "cancelled" and not (is_client or is_freelancer):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")
    if current == "active" and new == "delivered" and not is_freelancer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat freelancer yetkazadi")
    if current == "delivered" and new == "completed" and not is_client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat mijoz tasdiqlaydi")
    if current == "delivered" and new == "disputed" and not is_client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat mijoz nizo ochadi")
    if current == "delivered" and new == "active" and not is_client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat mijoz qayta ishlash so'raydi")
