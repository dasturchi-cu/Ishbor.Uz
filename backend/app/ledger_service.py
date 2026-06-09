"""Double-entry ledger helpers (escrow, wallet, commission)."""

from __future__ import annotations

import uuid
from typing import Any

from app.database import get_supabase_admin


def post_ledger_pair(
    *,
    debit_account: str,
    credit_account: str,
    amount: int,
    user_id: str | None = None,
    order_id: str | None = None,
    description: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> uuid.UUID:
    group_id = uuid.uuid4()
    admin = get_supabase_admin()
    admin.rpc(
        "post_ledger_pair",
        {
            "p_group_id": str(group_id),
            "p_debit_account": debit_account,
            "p_credit_account": credit_account,
            "p_amount": amount,
            "p_user_id": user_id,
            "p_order_id": order_id,
            "p_description": description,
            "p_metadata": metadata or {},
        },
    ).execute()
    return group_id


def record_escrow_hold(order_id: str, client_id: str, amount: int, provider: str) -> None:
    post_ledger_pair(
        debit_account="payment_clearing",
        credit_account="escrow_hold",
        amount=amount,
        user_id=client_id,
        order_id=order_id,
        description=f"Escrow hold via {provider}",
        metadata={"provider": provider},
    )


def record_escrow_release(
    order_id: str,
    freelancer_id: str,
    amount: int,
    commission: int,
) -> None:
    payout = amount - commission
    if payout > 0:
        post_ledger_pair(
            debit_account="escrow_hold",
            credit_account="wallet_freelancer",
            amount=payout,
            user_id=freelancer_id,
            order_id=order_id,
            description="Escrow release to freelancer",
        )
    if commission > 0:
        post_ledger_pair(
            debit_account="escrow_hold",
            credit_account="platform_revenue",
            amount=commission,
            user_id=freelancer_id,
            order_id=order_id,
            description="Platform commission",
        )


def record_escrow_refund(order_id: str, client_id: str, amount: int) -> None:
    post_ledger_pair(
        debit_account="escrow_hold",
        credit_account="wallet_client",
        amount=amount,
        user_id=client_id,
        order_id=order_id,
        description="Escrow refund to client",
    )


def list_user_ledger(user_id: str, *, limit: int = 50, offset: int = 0) -> list[dict[str, Any]]:
    admin = get_supabase_admin()
    result = (
        admin.table("ledger_entries")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data or []
