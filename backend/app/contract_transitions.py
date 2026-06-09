"""Contract status o'tish qoidalari."""

from fastapi import HTTPException, status

ALLOWED_CONTRACT_TRANSITIONS: dict[str, set[str]] = {
    "pending_payment": {"active", "cancelled"},
    "active": {"submitted", "disputed", "cancelled"},
    "submitted": {"completed", "revision_requested", "disputed"},
    "revision_requested": {"submitted", "disputed"},
    "disputed": {"completed", "cancelled", "active"},
    "completed": set(),
    "cancelled": set(),
}


def validate_contract_transition(
    current: str,
    new: str,
    user_id: str,
    client_id: str,
    freelancer_id: str,
    payment_status: str | None = None,
) -> None:
    allowed = ALLOWED_CONTRACT_TRANSITIONS.get(current, set())
    if new not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{current}' dan '{new}' ga o'tish mumkin emas",
        )

    is_client = user_id == client_id
    is_freelancer = user_id == freelancer_id

    if current == "pending_payment" and new == "active":
        if payment_status != "held":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Escrow to'ldirilmaguncha faol bo'lmaydi",
            )
    if current == "pending_payment" and new == "cancelled" and not is_client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat mijoz bekor qiladi")
    if current == "active" and new == "submitted" and not is_freelancer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat freelancer topshiradi")
    if current == "submitted" and new == "completed" and not is_client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat mijoz tasdiqlaydi")
    if current == "submitted" and new == "revision_requested" and not is_client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat mijoz qayta ishlash so'raydi")
    if current == "revision_requested" and new == "submitted" and not is_freelancer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat freelancer qayta topshiradi")
    if new == "disputed" and not is_client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat mijoz nizo ochadi")
