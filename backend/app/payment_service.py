"""Escrow va balans yordamchilari (atomik Postgres RPC — service role)."""

from fastapi import HTTPException, status
from postgrest.exceptions import APIError

from app.database import get_supabase_admin
from app.ledger_service import record_escrow_hold, record_escrow_refund, record_escrow_release
from app.platform_services import track_analytics_event
from app.receipt_service import create_payment_receipt
from app.supabase_rpc import map_rpc_error, rpc_row


def _track_payment_succeeded(order: dict, *, provider: str, user_id: str) -> None:
    track_analytics_event(
        "payment_succeeded",
        user_id=user_id,
        properties={
            "order_id": order.get("id"),
            "provider": provider,
            "amount": order.get("amount"),
        },
    )


def hold_escrow(_supabase, order: dict, user_id: str, provider: str, provider_ref: str | None = None) -> dict:
    if user_id != order["client_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat mijoz to'laydi")
    admin = get_supabase_admin()
    try:
        result = admin.rpc(
            "hold_escrow_rpc",
            {
                "p_order_id": order["id"],
                "p_client_id": user_id,
                "p_provider": provider,
                "p_provider_ref": provider_ref,
            },
        ).execute()
    except APIError as exc:
        raise map_rpc_error(exc) from exc
    row = rpc_row(result)
    if not row:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="To'lov saqlanmadi")
    try:
        record_escrow_hold(row["id"], user_id, int(row.get("amount") or 0), provider)
    except Exception:
        pass
    try:
        create_payment_receipt(row, provider=provider, provider_ref=provider_ref)
    except Exception:
        pass
    _track_payment_succeeded(row, provider=provider, user_id=user_id)
    return row


def release_escrow(_supabase, order: dict) -> dict:
    if order.get("payment_status") != "held":
        return order
    admin = get_supabase_admin()
    try:
        result = admin.rpc("release_escrow_rpc", {"p_order_id": order["id"]}).execute()
    except APIError as exc:
        raise map_rpc_error(exc) from exc
    row = rpc_row(result)
    released = row or order
    try:
        amount = int(released.get("amount") or 0)
        fee = int(released.get("platform_fee") or 0)
        record_escrow_release(released["id"], released["freelancer_id"], amount, fee)
    except Exception:
        pass
    return released


def pay_order_from_wallet(_supabase, order: dict, user_id: str) -> dict:
    if user_id != order["client_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat mijoz to'laydi")
    admin = get_supabase_admin()
    try:
        result = admin.rpc(
            "pay_order_from_wallet_rpc",
            {"p_order_id": order["id"], "p_client_id": user_id},
        ).execute()
    except APIError as exc:
        raise map_rpc_error(exc) from exc
    row = rpc_row(result)
    if not row:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="To'lov amalga oshmadi")
    try:
        record_escrow_hold(row["id"], user_id, int(row.get("amount") or 0), "wallet")
        create_payment_receipt(row, provider="wallet", provider_ref=None)
    except Exception:
        pass
    _track_payment_succeeded(row, provider="wallet", user_id=user_id)
    return row


def refund_escrow(_supabase, order: dict) -> dict:
    if order.get("payment_status") != "held":
        return order
    admin = get_supabase_admin()
    try:
        result = admin.rpc("refund_escrow_rpc", {"p_order_id": order["id"]}).execute()
    except APIError as exc:
        raise map_rpc_error(exc) from exc
    row = rpc_row(result)
    refunded = row or order
    try:
        record_escrow_refund(refunded["id"], refunded["client_id"], int(refunded.get("amount") or 0))
    except Exception:
        pass
    return refunded

