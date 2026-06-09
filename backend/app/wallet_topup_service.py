"""Wallet top-up intents and balance credit."""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import HTTPException, status

from app.database import get_supabase_admin
from app.db_utils import run_query
from app.supabase_rpc import map_rpc_error, rpc_row


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def create_topup_intent(user_id: str, amount: int, provider: str) -> dict:
    admin = get_supabase_admin()
    result = run_query(
        lambda: admin.table("wallet_topup_intents")
        .insert(
            {
                "user_id": user_id,
                "amount": amount,
                "provider": provider,
                "status": "pending",
            }
        )
        .select("*")
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Top-up yaratilmadi")
    return result.data


def credit_topup_intent(intent_id: str, provider_ref: str | None = None) -> dict:
    admin = get_supabase_admin()
    try:
        row = rpc_row(
            admin.rpc(
                "credit_wallet_topup_rpc",
                {"p_intent_id": intent_id, "p_provider_ref": provider_ref},
            )
        )
    except Exception as exc:
        raise map_rpc_error(exc) from exc
    return row


def get_topup_intent(intent_id: str, user_id: str) -> dict:
    admin = get_supabase_admin()
    result = run_query(
        lambda: admin.table("wallet_topup_intents")
        .select("*")
        .eq("id", intent_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Top-up topilmadi")
    return result.data
