import json
from typing import Any, Literal

from fastapi import APIRouter, Header, HTTPException, Request, status
from pydantic import BaseModel, Field
from postgrest.exceptions import APIError

from app.config import settings
from app.database import get_supabase_admin
from app.db_utils import run_query
from app.deps import UserAuthDep
from app.payment_intent_service import (
    assign_prepare_id,
    create_payment_intent,
    get_intent_by_id,
    get_intent_by_prepare_id,
    get_latest_intent_for_order,
    update_intent,
)
from app.payment_service import hold_escrow
from app.payments.click import (
    build_pay_url,
    click_error_response,
    verify_complete_signature,
    verify_prepare_signature,
)
from app.payments.payme import (
    ERR_ACCESS_DENIED,
    ERR_INVALID_JSON,
    build_checkout_url,
    rpc_error,
    som_to_tiyin,
    verify_basic_auth,
)
from app.payments.payme_handler import PaymeMerchantHandler
from app.schemas import CheckoutResponse, OrderResponse, PaymentIntentResponse
from app.supabase_rpc import map_rpc_error, rpc_row

router = APIRouter(prefix="/payments", tags=["payments"])


class CheckoutBody(BaseModel):
    provider: Literal["sandbox", "click", "payme"] = "sandbox"


class WithdrawalCreate(BaseModel):
    amount: int = Field(gt=0)
    note: str | None = None


class ClickShopPayload(BaseModel):
    click_trans_id: int
    service_id: int
    click_paydoc_id: int | None = None
    merchant_trans_id: str
    amount: float
    action: int
    error: int = 0
    error_note: str | None = None
    sign_time: str
    sign_string: str
    merchant_prepare_id: int | None = None


def _order_response(order: dict) -> OrderResponse:
    return OrderResponse.model_validate(order)


def _intent_response(intent: dict, redirect_url: str | None = None) -> PaymentIntentResponse:
    meta = intent.get("metadata") or {}
    return PaymentIntentResponse(
        id=intent["id"],
        order_id=intent["order_id"],
        provider=intent["provider"],
        amount=intent["amount"],
        status=intent["status"],
        redirect_url=redirect_url or meta.get("redirect_url"),
    )


def _click_return_url(order_id: str) -> str:
    base = settings.click_return_url.strip() or settings.cors_origin_list[0]
    return f"{base.rstrip('/')}/{order_id}"


def _payme_return_url(order_id: str) -> str:
    base = settings.payme_return_url.strip() or settings.cors_origin_list[0]
    return f"{base.rstrip('/')}/{order_id}"


def _amount_matches(expected: int, received: float) -> bool:
    return abs(float(expected) - received) < 0.01


def _payments_providers() -> list[str]:
    providers: list[str] = []
    if not settings.is_production:
        providers.append("sandbox")
    if settings.click_enabled:
        providers.append("click")
    if settings.payme_enabled:
        providers.append("payme")
    return providers


@router.get("/config")
def payments_config() -> dict[str, Any]:
    providers = _payments_providers()
    return {
        "sandbox_allowed": not settings.is_production,
        "click_enabled": settings.click_enabled,
        "payme_enabled": settings.payme_enabled,
        "live_available": settings.click_enabled or settings.payme_enabled,
        "providers": providers,
    }


@router.post("/orders/{order_id}/checkout", response_model=CheckoutResponse)
def checkout_order(order_id: str, body: CheckoutBody, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    existing = run_query(
        lambda: supabase.table("orders").select("*").eq("id", order_id).single().execute()
    )
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buyurtma topilmadi")

    order = existing.data
    if user_id != order["client_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat mijoz to'lov qiladi")

    if body.provider not in _payments_providers():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="To'lov usuli hozircha mavjud emas",
        )

    if body.provider == "sandbox" and settings.is_production:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sandbox to'lovi production muhitida taqiqlangan",
        )

    if body.provider == "payme":
        if not settings.payme_enabled:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Payme to'lovi hozircha yoqilmagan. Administratorga murojaat qiling.",
            )
        if order.get("payment_status") == "held":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="To'lov allaqachon amalga oshirilgan")

        intent = create_payment_intent(
            supabase,
            order_id=order_id,
            client_id=user_id,
            provider="payme",
            amount=order["amount"],
        )
        account_field = settings.payme_account_field.strip() or "order_id"
        redirect_url = build_checkout_url(
            merchant_id=settings.payme_merchant_id,
            amount_tiyin=som_to_tiyin(order["amount"]),
            account={account_field: intent["id"]},
            return_url=_payme_return_url(order_id),
        )
        update_intent(supabase, intent["id"], metadata_patch={"redirect_url": redirect_url})
        return CheckoutResponse(
            order=_order_response(order),
            payment_intent=_intent_response(intent, redirect_url),
            redirect_url=redirect_url,
        )

    if body.provider == "click":
        if not settings.click_enabled:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Click to'lovi hozircha yoqilmagan. Administratorga murojaat qiling.",
            )
        if order.get("payment_status") == "held":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="To'lov allaqachon amalga oshirilgan")

        intent = create_payment_intent(
            supabase,
            order_id=order_id,
            client_id=user_id,
            provider="click",
            amount=order["amount"],
        )
        redirect_url = build_pay_url(
            merchant_id=settings.click_merchant_id,
            service_id=settings.click_service_id,
            amount=order["amount"],
            merchant_trans_id=intent["id"],
            return_url=_click_return_url(order_id),
        )
        update_intent(supabase, intent["id"], metadata_patch={"redirect_url": redirect_url})
        return CheckoutResponse(
            order=_order_response(order),
            payment_intent=_intent_response(intent, redirect_url),
            redirect_url=redirect_url,
        )

    held = hold_escrow(supabase, order, user_id, provider="sandbox", provider_ref=f"sandbox-{order_id}")
    return CheckoutResponse(order=_order_response(held))


@router.get("/orders/{order_id}/payment-intent", response_model=PaymentIntentResponse)
def get_order_payment_intent(order_id: str, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    order = run_query(
        lambda: supabase.table("orders").select("client_id").eq("id", order_id).single().execute()
    )
    if not order.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buyurtma topilmadi")
    if user_id != order.data["client_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat mijoz ko'rishi mumkin")

    intent = get_latest_intent_for_order(supabase, order_id)
    if not intent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="To'lov niyati topilmadi")

    meta = intent.get("metadata") or {}
    return _intent_response(intent, meta.get("redirect_url"))


@router.get("/orders/{order_id}/transactions")
def list_order_transactions(order_id: str, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    order = run_query(
        lambda: supabase.table("orders").select("client_id, freelancer_id").eq("id", order_id).single().execute()
    )
    if not order.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buyurtma topilmadi")
    if user_id not in (order.data["client_id"], order.data["freelancer_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")

    result = run_query(
        lambda: supabase.table("transactions")
        .select("*")
        .eq("order_id", order_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.post("/withdrawals", status_code=status.HTTP_201_CREATED)
def request_withdrawal(body: WithdrawalCreate, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    profile = run_query(
        lambda: supabase.table("profiles")
        .select("role, wallet_balance")
        .eq("id", user_id)
        .single()
        .execute()
    )
    if not profile.data or profile.data.get("role") != "freelancer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat freelancer pul yechishi mumkin")

    admin = get_supabase_admin()
    try:
        result = run_query(
            lambda: admin.rpc(
                "request_withdrawal_rpc",
                {
                    "p_freelancer_id": user_id,
                    "p_amount": body.amount,
                    "p_note": body.note,
                },
            ).execute()
        )
    except APIError as exc:
        raise map_rpc_error(exc) from exc
    row = rpc_row(result)
    if not row:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="So'rov yaratilmadi")
    return row


@router.get("/withdrawals")
def list_my_withdrawals(auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    profile = run_query(
        lambda: supabase.table("profiles").select("role").eq("id", user_id).single().execute()
    )
    if not profile.data or profile.data.get("role") != "freelancer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat freelancer ko'rishi mumkin")

    result = run_query(
        lambda: supabase.table("withdrawal_requests")
        .select("id, freelancer_id, amount, status, note, created_at")
        .eq("freelancer_id", user_id)
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )
    return result.data or []


@router.get("/transactions")
def list_my_transactions(auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    result = run_query(
        lambda: supabase.table("transactions")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    return result.data or []


def _verify_webhook_secret(x_webhook_secret: str | None) -> None:
    secret = settings.payment_webhook_secret.strip()
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Webhook secret sozlanmagan",
        )
    if not x_webhook_secret or x_webhook_secret != secret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Webhook ruxsati yo'q")


def _load_order_for_intent(supabase, intent: dict) -> dict | None:
    result = run_query(
        lambda: supabase.table("orders").select("*").eq("id", intent["order_id"]).single().execute()
    )
    return result.data


@router.post("/webhooks/click/prepare")
def click_prepare(payload: ClickShopPayload) -> dict[str, Any]:
    if not settings.click_enabled:
        return click_error_response(
            click_trans_id=payload.click_trans_id,
            merchant_trans_id=payload.merchant_trans_id,
            error=-8,
            error_note="Click sozlanmagan",
        )

    raw = payload.model_dump()
    if not verify_prepare_signature(raw, settings.click_secret_key):
        return click_error_response(
            click_trans_id=payload.click_trans_id,
            merchant_trans_id=payload.merchant_trans_id,
            error=-1,
            error_note="SIGN CHECK FAILED",
        )

    if payload.service_id != settings.click_service_id:
        return click_error_response(
            click_trans_id=payload.click_trans_id,
            merchant_trans_id=payload.merchant_trans_id,
            error=-2,
            error_note="Incorrect parameter service_id",
        )

    if payload.action != 0:
        return click_error_response(
            click_trans_id=payload.click_trans_id,
            merchant_trans_id=payload.merchant_trans_id,
            error=-3,
            error_note="Action not found",
        )

    supabase = get_supabase_admin()
    intent = get_intent_by_id(supabase, payload.merchant_trans_id)
    if not intent:
        return click_error_response(
            click_trans_id=payload.click_trans_id,
            merchant_trans_id=payload.merchant_trans_id,
            error=-6,
            error_note="Transaction does not exist",
        )

    if intent["status"] == "succeeded":
        return click_error_response(
            click_trans_id=payload.click_trans_id,
            merchant_trans_id=payload.merchant_trans_id,
            merchant_prepare_id=intent.get("merchant_prepare_id") or 0,
            error=-4,
            error_note="Already paid",
        )

    if not _amount_matches(intent["amount"], payload.amount):
        return click_error_response(
            click_trans_id=payload.click_trans_id,
            merchant_trans_id=payload.merchant_trans_id,
            error=-2,
            error_note="Incorrect parameter amount",
        )

    order = _load_order_for_intent(supabase, intent)
    if not order or order.get("status") != "pending" or order.get("payment_status") == "held":
        return click_error_response(
            click_trans_id=payload.click_trans_id,
            merchant_trans_id=payload.merchant_trans_id,
            error=-6,
            error_note="Order not available",
        )

    if intent.get("merchant_prepare_id"):
        return click_error_response(
            click_trans_id=payload.click_trans_id,
            merchant_trans_id=payload.merchant_trans_id,
            merchant_prepare_id=intent["merchant_prepare_id"],
            error=0,
            error_note="Success",
        )

    updated = assign_prepare_id(supabase, intent, payload.click_trans_id)
    return click_error_response(
        click_trans_id=payload.click_trans_id,
        merchant_trans_id=payload.merchant_trans_id,
        merchant_prepare_id=updated["merchant_prepare_id"],
        error=0,
        error_note="Success",
    )


@router.post("/webhooks/click/complete")
def click_complete(payload: ClickShopPayload) -> dict[str, Any]:
    if not settings.click_enabled:
        return click_error_response(
            click_trans_id=payload.click_trans_id,
            merchant_trans_id=payload.merchant_trans_id,
            error=-8,
            error_note="Click sozlanmagan",
        )

    raw = payload.model_dump()
    if not verify_complete_signature(raw, settings.click_secret_key):
        return click_error_response(
            click_trans_id=payload.click_trans_id,
            merchant_trans_id=payload.merchant_trans_id,
            error=-1,
            error_note="SIGN CHECK FAILED",
        )

    if payload.action != 1:
        return click_error_response(
            click_trans_id=payload.click_trans_id,
            merchant_trans_id=payload.merchant_trans_id,
            error=-3,
            error_note="Action not found",
        )

    supabase = get_supabase_admin()
    intent = get_intent_by_id(supabase, payload.merchant_trans_id)
    if not intent and payload.merchant_prepare_id:
        intent = get_intent_by_prepare_id(supabase, payload.merchant_prepare_id)

    if not intent:
        return click_error_response(
            click_trans_id=payload.click_trans_id,
            merchant_trans_id=payload.merchant_trans_id,
            error=-6,
            error_note="Transaction does not exist",
        )

    if payload.error != 0:
        update_intent(supabase, intent["id"], status_value="cancelled")
        return click_error_response(
            click_trans_id=payload.click_trans_id,
            merchant_trans_id=payload.merchant_trans_id,
            merchant_confirm_id=0,
            error=-9,
            error_note="Transaction cancelled",
        )

    if intent["status"] == "succeeded":
        return click_error_response(
            click_trans_id=payload.click_trans_id,
            merchant_trans_id=payload.merchant_trans_id,
            merchant_confirm_id=int(intent.get("merchant_prepare_id") or 0),
            error=-4,
            error_note="Already paid",
        )

    if payload.merchant_prepare_id and intent.get("merchant_prepare_id") != payload.merchant_prepare_id:
        return click_error_response(
            click_trans_id=payload.click_trans_id,
            merchant_trans_id=payload.merchant_trans_id,
            error=-6,
            error_note="Prepare ID mismatch",
        )

    if not _amount_matches(intent["amount"], payload.amount):
        return click_error_response(
            click_trans_id=payload.click_trans_id,
            merchant_trans_id=payload.merchant_trans_id,
            error=-2,
            error_note="Incorrect parameter amount",
        )

    order = _load_order_for_intent(supabase, intent)
    if not order:
        return click_error_response(
            click_trans_id=payload.click_trans_id,
            merchant_trans_id=payload.merchant_trans_id,
            error=-6,
            error_note="Order not found",
        )

    provider_ref = str(payload.click_trans_id)
    try:
        hold_escrow(
            supabase,
            order,
            order["client_id"],
            provider="click",
            provider_ref=provider_ref,
        )
    except HTTPException as exc:
        if exc.status_code != status.HTTP_400_BAD_REQUEST or "allaqachon" not in str(exc.detail).lower():
            return click_error_response(
                click_trans_id=payload.click_trans_id,
                merchant_trans_id=payload.merchant_trans_id,
                error=-7,
                error_note=str(exc.detail),
            )

    update_intent(
        supabase,
        intent["id"],
        status_value="succeeded",
        provider_ref=provider_ref,
    )
    confirm_id = int(intent.get("merchant_prepare_id") or payload.merchant_prepare_id or 0)
    return click_error_response(
        click_trans_id=payload.click_trans_id,
        merchant_trans_id=payload.merchant_trans_id,
        merchant_confirm_id=confirm_id,
        error=0,
        error_note="Success",
    )


@router.post("/webhooks/click")
def click_webhook_legacy(x_webhook_secret: str | None = Header(default=None, alias="X-Webhook-Secret")):
    _verify_webhook_secret(x_webhook_secret)
    return {
        "status": "use_shop_api",
        "prepare": "/api/v1/payments/webhooks/click/prepare",
        "complete": "/api/v1/payments/webhooks/click/complete",
    }


_payme_handler = PaymeMerchantHandler()


@router.post("/webhooks/payme")
async def payme_webhook(
    request: Request,
    authorization: str | None = Header(default=None, alias="Authorization"),
):
    if not settings.payme_enabled:
        return rpc_error(None, code=ERR_ACCESS_DENIED, message="Payme not configured")

    if not verify_basic_auth(authorization, settings.payme_login, settings.payme_secret_key):
        return rpc_error(None, code=ERR_ACCESS_DENIED, message="Access denied")

    try:
        body = await request.json()
    except json.JSONDecodeError:
        return rpc_error(None, code=ERR_INVALID_JSON, message="Parse error")

    request_id = body.get("id")
    method = body.get("method")
    params = body.get("params") or {}
    if not method:
        return rpc_error(request_id, code=ERR_INVALID_JSON, message="Invalid request")

    return _payme_handler.dispatch(request_id, method, params)
