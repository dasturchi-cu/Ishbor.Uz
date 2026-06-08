"""Escrow va balans yordamchilari (atomik Postgres RPC — service role)."""

from fastapi import HTTPException, status
from postgrest.exceptions import APIError

from app.database import get_supabase_admin
from app.supabase_rpc import map_rpc_error, rpc_row


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
    return row or order


def refund_escrow(_supabase, order: dict) -> dict:
    if order.get("payment_status") != "held":
        return order
    admin = get_supabase_admin()
    try:
        result = admin.rpc("refund_escrow_rpc", {"p_order_id": order["id"]}).execute()
    except APIError as exc:
        raise map_rpc_error(exc) from exc
    row = rpc_row(result)
    return row or order
