"""Project status o'tish qoidalari (marketplace flow)."""

from fastapi import HTTPException, status

ALLOWED_PROJECT_TRANSITIONS: dict[str, set[str]] = {
    "draft": {"open", "cancelled"},
    "open": {"in_review", "accepted", "cancelled"},
    "in_review": {"accepted", "open", "cancelled"},
    "accepted": {"active", "cancelled"},
    "active": {"submitted", "disputed", "cancelled"},
    "submitted": {"completed", "revision_requested", "disputed"},
    "revision_requested": {"submitted", "disputed"},
    "disputed": {"completed", "cancelled", "active"},
    "completed": set(),
    "cancelled": set(),
    # legacy
    "closed": {"completed", "cancelled"},
    "in_progress": {"submitted", "completed", "disputed"},
}


def validate_project_transition(
    current: str,
    new: str,
    user_id: str,
    client_id: str,
) -> None:
    allowed = ALLOWED_PROJECT_TRANSITIONS.get(current, set())
    if new not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{current}' dan '{new}' ga o'tish mumkin emas",
        )

    if user_id != client_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat loyiha egasi o'zgartiradi")
