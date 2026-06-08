import pytest
from fastapi import HTTPException

from app.order_transitions import validate_order_transition


CLIENT = "client-uuid"
FREELANCER = "freelancer-uuid"
OTHER = "other-uuid"


def test_pending_to_active_requires_held_payment():
    with pytest.raises(HTTPException) as exc:
        validate_order_transition(
            "pending",
            "active",
            FREELANCER,
            CLIENT,
            FREELANCER,
            payment_status="unpaid",
        )
    assert exc.value.status_code == 400


def test_pending_to_active_freelancer_with_held_payment():
    validate_order_transition(
        "pending",
        "active",
        FREELANCER,
        CLIENT,
        FREELANCER,
        payment_status="held",
    )


def test_pending_to_active_rejects_client():
    with pytest.raises(HTTPException) as exc:
        validate_order_transition(
            "pending",
            "active",
            CLIENT,
            CLIENT,
            FREELANCER,
            payment_status="held",
        )
    assert exc.value.status_code == 403


def test_active_to_delivered_freelancer_only():
    validate_order_transition("active", "delivered", FREELANCER, CLIENT, FREELANCER)
    with pytest.raises(HTTPException) as exc:
        validate_order_transition("active", "delivered", CLIENT, CLIENT, FREELANCER)
    assert exc.value.status_code == 403


def test_delivered_to_completed_client_only():
    validate_order_transition("delivered", "completed", CLIENT, CLIENT, FREELANCER)
    with pytest.raises(HTTPException) as exc:
        validate_order_transition("delivered", "completed", FREELANCER, CLIENT, FREELANCER)
    assert exc.value.status_code == 403


def test_invalid_transition_rejected():
    with pytest.raises(HTTPException) as exc:
        validate_order_transition("completed", "active", CLIENT, CLIENT, FREELANCER)
    assert exc.value.status_code == 400


def test_pending_cancel_client_only():
    validate_order_transition("pending", "cancelled", CLIENT, CLIENT, FREELANCER)
    with pytest.raises(HTTPException) as exc:
        validate_order_transition("pending", "cancelled", FREELANCER, CLIENT, FREELANCER)
    assert exc.value.status_code == 403


def test_active_disputed_client_only():
    validate_order_transition("active", "disputed", CLIENT, CLIENT, FREELANCER)
    with pytest.raises(HTTPException) as exc:
        validate_order_transition("active", "disputed", FREELANCER, CLIENT, FREELANCER)
    assert exc.value.status_code == 403
