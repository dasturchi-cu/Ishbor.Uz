"""Contract escrow (sandbox / service role RPC)."""

from fastapi import HTTPException, status
from postgrest.exceptions import APIError

from app.database import get_supabase_admin
from app.supabase_rpc import map_rpc_error, rpc_row


def fund_contract_escrow(
    contract: dict,
    user_id: str,
    provider: str = "sandbox",
    provider_ref: str | None = None,
) -> dict:
    if user_id != contract["client_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat mijoz to'laydi")
    admin = get_supabase_admin()
    try:
        result = admin.rpc(
            "fund_contract_escrow_rpc",
            {
                "p_contract_id": contract["id"],
                "p_client_id": user_id,
                "p_provider": provider,
                "p_provider_ref": provider_ref,
            },
        ).execute()
    except APIError as exc:
        raise map_rpc_error(exc) from exc
    row = rpc_row(result)
    if not row:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Escrow saqlanmadi")
    return row


def release_contract_escrow(contract: dict) -> dict:
    if contract.get("payment_status") != "held":
        return contract
    admin = get_supabase_admin()
    try:
        result = admin.rpc("release_contract_escrow_rpc", {"p_contract_id": contract["id"]}).execute()
    except APIError as exc:
        raise map_rpc_error(exc) from exc
    row = rpc_row(result)
    return row or contract


def refund_contract_escrow(contract: dict) -> dict:
    if contract.get("payment_status") != "held":
        return contract
    admin = get_supabase_admin()
    try:
        result = admin.rpc("refund_contract_escrow_rpc", {"p_contract_id": contract["id"]}).execute()
    except APIError as exc:
        raise map_rpc_error(exc) from exc
    row = rpc_row(result)
    return row or contract
