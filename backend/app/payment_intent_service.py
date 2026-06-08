"""Payment intent CRUD (Click/Payme checkout holati)."""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import HTTPException, status

from app.database import get_supabase_admin
from app.db_utils import run_query

ACTIVE_STATUSES = ("requires_action", "processing")


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _db(supabase=None):
    return supabase or get_supabase_admin()


def get_latest_intent_for_order(supabase, order_id: str) -> dict | None:
    supabase = _db(supabase)
    result = run_query(
        lambda: supabase.table("payment_intents")
        .select("*")
        .eq("order_id", order_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    rows = result.data or []
    return rows[0] if rows else None


def get_active_intent(supabase, order_id: str, provider: str) -> dict | None:
    supabase = _db(supabase)
    result = run_query(
        lambda: supabase.table("payment_intents")
        .select("*")
        .eq("order_id", order_id)
        .eq("provider", provider)
        .in_("status", list(ACTIVE_STATUSES))
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    rows = result.data or []
    return rows[0] if rows else None


def create_payment_intent(
    supabase=None,
    *,
    order_id: str,
    client_id: str,
    provider: str,
    amount: int,
    metadata: dict | None = None,
) -> dict:
    supabase = _db(supabase)
    existing = get_active_intent(supabase, order_id, provider)
    if existing:
        return existing

    result = run_query(
        lambda: supabase.table("payment_intents")
        .insert(
            {
                "order_id": order_id,
                "client_id": client_id,
                "provider": provider,
                "amount": amount,
                "status": "requires_action",
                "metadata": metadata or {},
            }
        )
        .select("*")
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="To'lov niyati yaratilmadi",
        )
    return result.data


def get_intent_by_id(supabase=None, intent_id: str = "") -> dict | None:
    supabase = _db(supabase)
    result = run_query(
        lambda: supabase.table("payment_intents").select("*").eq("id", intent_id).limit(1).execute()
    )
    rows = result.data or []
    return rows[0] if rows else None


def get_intent_by_provider_ref(supabase=None, provider: str = "", provider_ref: str = "") -> dict | None:
    supabase = _db(supabase)
    result = run_query(
        lambda: supabase.table("payment_intents")
        .select("*")
        .eq("provider", provider)
        .eq("provider_ref", provider_ref)
        .limit(1)
        .execute()
    )
    rows = result.data or []
    return rows[0] if rows else None


def get_intent_by_prepare_id(supabase=None, prepare_id: int = 0) -> dict | None:
    supabase = _db(supabase)
    result = run_query(
        lambda: supabase.table("payment_intents")
        .select("*")
        .eq("merchant_prepare_id", prepare_id)
        .limit(1)
        .execute()
    )
    rows = result.data or []
    return rows[0] if rows else None


def assign_prepare_id(supabase=None, intent: dict | None = None, click_trans_id: int = 0) -> dict:
    supabase = _db(supabase)
    seq_result = run_query(lambda: supabase.rpc("next_payment_prepare_id").execute())
    prepare_id = int(seq_result.data) if seq_result.data is not None else None
    if prepare_id is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prepare ID yaratilmadi",
        )

    result = run_query(
        lambda: supabase.table("payment_intents")
        .update(
            {
                "merchant_prepare_id": prepare_id,
                "click_trans_id": click_trans_id,
                "status": "processing",
                "updated_at": _now_iso(),
            }
        )
        .eq("id", intent["id"])
        .select("*")
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="To'lov niyati yangilanmadi",
        )
    return result.data


def update_intent(
    supabase=None,
    intent_id: str = "",
    *,
    status_value: str | None = None,
    provider_ref: str | None = None,
    merchant_prepare_id: int | None = None,
    metadata_patch: dict | None = None,
) -> dict:
    supabase = _db(supabase)
    patch: dict = {"updated_at": _now_iso()}
    if status_value:
        patch["status"] = status_value
    if provider_ref is not None:
        patch["provider_ref"] = provider_ref
    if merchant_prepare_id is not None:
        patch["merchant_prepare_id"] = merchant_prepare_id

    if metadata_patch:
        current = get_intent_by_id(supabase, intent_id) or {}
        merged = {**(current.get("metadata") or {}), **metadata_patch}
        patch["metadata"] = merged

    result = run_query(
        lambda: supabase.table("payment_intents")
        .update(patch)
        .eq("id", intent_id)
        .select("*")
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="To'lov niyati yangilanmadi",
        )
    return result.data
