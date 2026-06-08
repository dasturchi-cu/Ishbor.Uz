from typing import Literal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.database import get_supabase
from app.db_utils import run_query
from app.deps import CurrentUserId
from app.payment_service import hold_escrow

router = APIRouter(prefix="/payments", tags=["payments"])


class CheckoutBody(BaseModel):
    provider: Literal["sandbox", "click", "payme"] = "sandbox"


class WithdrawalCreate(BaseModel):
    amount: int = Field(gt=0)
    note: str | None = None


@router.post("/orders/{order_id}/checkout")
def checkout_order(order_id: str, body: CheckoutBody, user_id: CurrentUserId):
    supabase = get_supabase()
    existing = run_query(
        lambda: supabase.table("orders").select("*").eq("id", order_id).single().execute()
    )
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buyurtma topilmadi")

    order = existing.data
    if user_id not in (order["client_id"], order["freelancer_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")

    if body.provider in ("click", "payme"):
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Click/Payme integratsiyasi tez orada. Hozir sandbox rejimidan foydalaning.",
        )

    return hold_escrow(supabase, order, user_id, provider="sandbox", provider_ref=f"sandbox-{order_id}")


@router.get("/orders/{order_id}/transactions")
def list_order_transactions(order_id: str, user_id: CurrentUserId):
    supabase = get_supabase()
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
def request_withdrawal(body: WithdrawalCreate, user_id: CurrentUserId):
    supabase = get_supabase()
    profile = run_query(
        lambda: supabase.table("profiles")
        .select("role, wallet_balance")
        .eq("id", user_id)
        .single()
        .execute()
    )
    if not profile.data or profile.data.get("role") != "freelancer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat freelancer pul yechishi mumkin")

    balance = int(profile.data.get("wallet_balance") or 0)
    if body.amount > balance:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Balans yetarli emas")

    pending = run_query(
        lambda: supabase.table("withdrawal_requests")
        .select("amount")
        .eq("freelancer_id", user_id)
        .eq("status", "pending")
        .execute()
    )
    pending_sum = sum(int(r.get("amount") or 0) for r in (pending.data or []))
    available = balance - pending_sum
    if body.amount > available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kutilayotgan so'rovlar uchun balans yetarli emas",
        )

    new_balance = balance - body.amount
    run_query(
        lambda: supabase.table("profiles")
        .update({"wallet_balance": new_balance})
        .eq("id", user_id)
        .execute()
    )

    result = run_query(
        lambda: supabase.table("withdrawal_requests")
        .insert({"freelancer_id": user_id, "amount": body.amount, "note": body.note})
        .execute()
    )
    if not result.data:
        run_query(
            lambda: supabase.table("profiles")
            .update({"wallet_balance": balance})
            .eq("id", user_id)
            .execute()
        )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="So'rov yaratilmadi")
    return result.data[0]


@router.get("/withdrawals")
def list_my_withdrawals(user_id: CurrentUserId):
    supabase = get_supabase()
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
def list_my_transactions(user_id: CurrentUserId):
    supabase = get_supabase()
    result = run_query(
        lambda: supabase.table("transactions")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    return result.data or []


@router.post("/webhooks/click")
def click_webhook_stub():
    return {"status": "not_implemented", "detail": "Click webhook tez orada"}


@router.post("/webhooks/payme")
def payme_webhook_stub():
    return {"status": "not_implemented", "detail": "Payme webhook tez orada"}
