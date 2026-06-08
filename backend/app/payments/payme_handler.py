"""Payme Merchant API biznes logikasi (payment_intents + escrow)."""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status

from app.config import settings
from app.database import get_supabase_admin
from app.db_utils import run_query
from app.payment_intent_service import (
    get_intent_by_id,
    get_intent_by_provider_ref,
    update_intent,
)
from app.payment_service import hold_escrow, refund_escrow
from app.payments.payme import (
    ERR_CANT_CANCEL,
    ERR_IN_PROGRESS,
    ERR_ORDER_NOT_FOUND,
    ERR_SYSTEM,
    ERR_TERMINAL_STATE,
    ERR_TRANSACTION_NOT_FOUND,
    ERR_UNABLE_TO_COMPLETE,
    ERR_WRONG_AMOUNT,
    STATE_CANCELLED,
    STATE_CANCELLED_AFTER_COMPLETE,
    STATE_COMPLETED,
    STATE_CREATED,
    now_ms,
    rpc_error,
    rpc_result,
    som_to_tiyin,
)

TX_TIMEOUT_MS = 12 * 60 * 60 * 1000


def _payme_meta(intent: dict) -> dict:
    return (intent.get("metadata") or {}).get("payme") or {}


def _merge_payme_meta(intent: dict, patch: dict) -> dict:
    current = _payme_meta(intent)
    return {**current, **patch}


def _load_order(supabase, order_id: str) -> dict | None:
    result = run_query(
        lambda: supabase.table("orders").select("*").eq("id", order_id).limit(1).execute()
    )
    rows = result.data or []
    return rows[0] if rows else None


def _resolve_intent_from_account(supabase, account: dict[str, Any]) -> dict | None:
    field = settings.payme_account_field.strip() or "order_id"
    intent_id = account.get(field)
    if not intent_id:
        return None
    return get_intent_by_id(supabase, str(intent_id))


class PaymeMerchantHandler:
    def dispatch(self, request_id: int | str | None, method: str, params: dict[str, Any]) -> dict[str, Any]:
        handlers = {
            "CheckPerformTransaction": self.check_perform_transaction,
            "CreateTransaction": self.create_transaction,
            "PerformTransaction": self.perform_transaction,
            "CancelTransaction": self.cancel_transaction,
            "CheckTransaction": self.check_transaction,
            "GetStatement": self.get_statement,
        }
        handler = handlers.get(method)
        if not handler:
            return rpc_error(request_id, code=-32601, message="Method not found")
        try:
            return handler(request_id, params)
        except Exception:
            return rpc_error(request_id, code=ERR_SYSTEM, message="Internal error")

    def check_perform_transaction(self, request_id, params: dict[str, Any]) -> dict[str, Any]:
        supabase = get_supabase_admin()
        account = params.get("account") or {}
        amount = int(params.get("amount") or 0)

        intent = _resolve_intent_from_account(supabase, account)
        if not intent or intent.get("provider") != "payme":
            return rpc_error(
                request_id,
                code=ERR_ORDER_NOT_FOUND,
                message="Order not found",
                data=settings.payme_account_field,
            )

        if som_to_tiyin(intent["amount"]) != amount:
            return rpc_error(request_id, code=ERR_WRONG_AMOUNT, message="Incorrect amount")

        order = _load_order(supabase, intent["order_id"])
        if not order or order.get("status") != "pending":
            return rpc_error(
                request_id,
                code=ERR_ORDER_NOT_FOUND,
                message="Order not available",
                data=settings.payme_account_field,
            )

        if order.get("payment_status") == "held" or intent.get("status") == "succeeded":
            return rpc_error(
                request_id,
                code=ERR_TERMINAL_STATE,
                message="Order already paid",
                data=settings.payme_account_field,
            )

        return rpc_result(request_id, {"allow": True})

    def create_transaction(self, request_id, params: dict[str, Any]) -> dict[str, Any]:
        supabase = get_supabase_admin()
        payme_id = str(params.get("id") or "")
        create_time = int(params.get("time") or now_ms())
        amount = int(params.get("amount") or 0)
        account = params.get("account") or {}

        if not payme_id:
            return rpc_error(request_id, code=ERR_SYSTEM, message="Missing transaction id")

        existing = get_intent_by_provider_ref(supabase, "payme", payme_id)
        if existing:
            meta = _payme_meta(existing)
            return rpc_result(
                request_id,
                {
                    "create_time": meta.get("create_time", create_time),
                    "transaction": meta.get("transaction", existing["id"]),
                    "state": meta.get("state", STATE_CREATED),
                },
            )

        intent = _resolve_intent_from_account(supabase, account)
        if not intent or intent.get("provider") != "payme":
            return rpc_error(
                request_id,
                code=ERR_ORDER_NOT_FOUND,
                message="Order not found",
                data=settings.payme_account_field,
            )

        if som_to_tiyin(intent["amount"]) != amount:
            return rpc_error(request_id, code=ERR_WRONG_AMOUNT, message="Incorrect amount")

        order = _load_order(supabase, intent["order_id"])
        if not order or order.get("payment_status") == "held" or intent.get("status") == "succeeded":
            return rpc_error(
                request_id,
                code=ERR_TERMINAL_STATE,
                message="Order already paid",
                data=settings.payme_account_field,
            )

        active_ref = intent.get("provider_ref")
        if active_ref and active_ref != payme_id:
            active_meta = _payme_meta(intent)
            active_state = active_meta.get("state")
            if active_state in (STATE_CREATED, STATE_COMPLETED):
                return rpc_error(request_id, code=ERR_IN_PROGRESS, message="Another transaction in progress")

        seq_result = run_query(lambda: supabase.rpc("next_payment_prepare_id").execute())
        prepare_id = int(seq_result.data) if seq_result.data is not None else None
        merchant_tx = str(prepare_id) if prepare_id is not None else intent["id"]

        payme_meta = {
            "id": payme_id,
            "state": STATE_CREATED,
            "create_time": create_time,
            "perform_time": 0,
            "cancel_time": 0,
            "reason": None,
            "transaction": merchant_tx,
            "amount_tiyin": amount,
        }
        update_intent(
            supabase,
            intent["id"],
            status_value="processing",
            provider_ref=payme_id,
            merchant_prepare_id=prepare_id,
            metadata_patch={"payme": payme_meta},
        )

        return rpc_result(
            request_id,
            {
                "create_time": create_time,
                "transaction": merchant_tx,
                "state": STATE_CREATED,
            },
        )

    def perform_transaction(self, request_id, params: dict[str, Any]) -> dict[str, Any]:
        supabase = get_supabase_admin()
        payme_id = str(params.get("id") or "")
        intent = get_intent_by_provider_ref(supabase, "payme", payme_id)
        if not intent:
            return rpc_error(request_id, code=ERR_TRANSACTION_NOT_FOUND, message="Transaction not found")

        meta = _payme_meta(intent)
        state = meta.get("state")

        if state == STATE_COMPLETED or intent.get("status") == "succeeded":
            return rpc_result(
                request_id,
                {
                    "transaction": meta.get("transaction", intent["id"]),
                    "perform_time": meta.get("perform_time", now_ms()),
                    "state": STATE_COMPLETED,
                },
            )

        if state == STATE_CANCELLED:
            return rpc_error(request_id, code=ERR_UNABLE_TO_COMPLETE, message="Transaction cancelled")

        if state != STATE_CREATED:
            return rpc_error(request_id, code=ERR_TRANSACTION_NOT_FOUND, message="Invalid transaction state")

        create_time = int(meta.get("create_time") or 0)
        if create_time and now_ms() - create_time > TX_TIMEOUT_MS:
            update_intent(
                supabase,
                intent["id"],
                status_value="cancelled",
                metadata_patch={"payme": _merge_payme_meta(intent, {"state": STATE_CANCELLED, "cancel_time": now_ms(), "reason": 4})},
            )
            return rpc_error(request_id, code=ERR_UNABLE_TO_COMPLETE, message="Transaction timeout")

        order = _load_order(supabase, intent["order_id"])
        if not order:
            return rpc_error(request_id, code=ERR_ORDER_NOT_FOUND, message="Order not found")

        try:
            hold_escrow(supabase, order, order["client_id"], provider="payme", provider_ref=payme_id)
        except HTTPException as exc:
            if exc.status_code != status.HTTP_400_BAD_REQUEST or "allaqachon" not in str(exc.detail).lower():
                return rpc_error(request_id, code=ERR_SYSTEM, message=str(exc.detail))

        perform_time = now_ms()
        update_intent(
            supabase,
            intent["id"],
            status_value="succeeded",
            metadata_patch={
                "payme": _merge_payme_meta(
                    intent,
                    {"state": STATE_COMPLETED, "perform_time": perform_time},
                )
            },
        )

        return rpc_result(
            request_id,
            {
                "transaction": meta.get("transaction", intent["id"]),
                "perform_time": perform_time,
                "state": STATE_COMPLETED,
            },
        )

    def cancel_transaction(self, request_id, params: dict[str, Any]) -> dict[str, Any]:
        supabase = get_supabase_admin()
        payme_id = str(params.get("id") or "")
        reason = int(params.get("reason") or 0)
        intent = get_intent_by_provider_ref(supabase, "payme", payme_id)
        if not intent:
            return rpc_error(request_id, code=ERR_TRANSACTION_NOT_FOUND, message="Transaction not found")

        meta = _payme_meta(intent)
        state = meta.get("state")
        cancel_time = now_ms()

        if state in (STATE_CANCELLED, STATE_CANCELLED_AFTER_COMPLETE):
            return rpc_result(
                request_id,
                {
                    "transaction": meta.get("transaction", intent["id"]),
                    "cancel_time": meta.get("cancel_time", cancel_time),
                    "state": state,
                },
            )

        if state == STATE_COMPLETED or intent.get("status") == "succeeded":
            order = _load_order(supabase, intent["order_id"])
            if order and order.get("payment_status") == "held":
                refund_escrow(supabase, order)
            update_intent(
                supabase,
                intent["id"],
                status_value="cancelled",
                metadata_patch={
                    "payme": _merge_payme_meta(
                        intent,
                        {
                            "state": STATE_CANCELLED_AFTER_COMPLETE,
                            "cancel_time": cancel_time,
                            "reason": reason,
                        },
                    )
                },
            )
            return rpc_result(
                request_id,
                {
                    "transaction": meta.get("transaction", intent["id"]),
                    "cancel_time": cancel_time,
                    "state": STATE_CANCELLED_AFTER_COMPLETE,
                },
            )

        if state != STATE_CREATED:
            return rpc_error(request_id, code=ERR_CANT_CANCEL, message="Cannot cancel")

        update_intent(
            supabase,
            intent["id"],
            status_value="cancelled",
            metadata_patch={
                "payme": _merge_payme_meta(
                    intent,
                    {"state": STATE_CANCELLED, "cancel_time": cancel_time, "reason": reason},
                )
            },
        )
        return rpc_result(
            request_id,
            {
                "transaction": meta.get("transaction", intent["id"]),
                "cancel_time": cancel_time,
                "state": STATE_CANCELLED,
            },
        )

    def check_transaction(self, request_id, params: dict[str, Any]) -> dict[str, Any]:
        supabase = get_supabase_admin()
        payme_id = str(params.get("id") or "")
        intent = get_intent_by_provider_ref(supabase, "payme", payme_id)
        if not intent:
            return rpc_error(request_id, code=ERR_TRANSACTION_NOT_FOUND, message="Transaction not found")

        meta = _payme_meta(intent)
        return rpc_result(
            request_id,
            {
                "create_time": meta.get("create_time", 0),
                "perform_time": meta.get("perform_time", 0),
                "cancel_time": meta.get("cancel_time", 0),
                "transaction": meta.get("transaction", intent["id"]),
                "state": meta.get("state", STATE_CREATED),
                "reason": meta.get("reason"),
            },
        )

    def get_statement(self, request_id, params: dict[str, Any]) -> dict[str, Any]:
        _ = params
        return rpc_result(request_id, {"transactions": []})
