from typing import Literal

from fastapi import APIRouter, HTTPException, status
from postgrest.exceptions import APIError
from pydantic import BaseModel

from app.schemas import AdminUserUpdate

from app.database import get_supabase
from app.db_utils import run_query
from app.deps import CurrentUserId
from app.notification_service import notify_order_status
from app.payment_service import refund_escrow, release_escrow
from app.supabase_errors import map_supabase_error

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_admin(user_id: str):
    supabase = get_supabase()
    profile = run_query(
        lambda: supabase.table("profiles").select("is_admin").eq("id", user_id).single().execute()
    )
    if not profile.data or not profile.data.get("is_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin ruxsati kerak")


def _count_table(table: str) -> int:
    supabase = get_supabase()
    try:
        result = run_query(
            lambda: supabase.table(table).select("id", count="exact").limit(1).execute()
        )
        return int(result.count or 0)
    except APIError:
        return 0


@router.get("/stats")
def admin_stats(user_id: CurrentUserId):
    _require_admin(user_id)
    return {
        "users": _count_table("profiles"),
        "orders": _count_table("orders"),
        "services": _count_table("services"),
        "projects": _count_table("projects"),
    }


@router.get("/users")
def admin_list_users(user_id: CurrentUserId):
    _require_admin(user_id)
    supabase = get_supabase()
    try:
        result = run_query(
            lambda: supabase.table("profiles")
            .select("id, full_name, email, role, region, created_at, is_admin, is_banned")
            .order("created_at", desc=True)
            .limit(100)
            .execute()
        )
    except APIError as exc:
        # is_admin ustuni bo'lmasa — qolgan maydonlarni qaytaramiz
        if "is_admin" in str(exc).lower():
            result = run_query(
                lambda: supabase.table("profiles")
                .select("id, full_name, email, role, region, created_at")
                .order("created_at", desc=True)
                .limit(100)
                .execute()
            )
        else:
            raise HTTPException(status_code=400, detail=map_supabase_error(exc)) from exc
    return result.data or []


@router.get("/orders")
def admin_list_orders(user_id: CurrentUserId):
    _require_admin(user_id)
    supabase = get_supabase()

    try:
        result = run_query(
            lambda: supabase.table("orders")
            .select(
                "id, service_id, client_id, freelancer_id, amount, status, notes, created_at, package_id, services(title)"
            )
            .order("created_at", desc=True)
            .limit(100)
            .execute()
        )
        return result.data or []
    except APIError:
        result = run_query(
            lambda: supabase.table("orders")
            .select("id, service_id, client_id, freelancer_id, amount, status, notes, created_at, package_id")
            .order("created_at", desc=True)
            .limit(100)
            .execute()
        )
        orders = result.data or []
        service_ids = list({o["service_id"] for o in orders if o.get("service_id")})
        titles: dict[str, str] = {}
        if service_ids:
            services = run_query(
                lambda: supabase.table("services")
                .select("id, title")
                .in_("id", service_ids)
                .execute()
            )
            for row in services.data or []:
                titles[row["id"]] = row.get("title") or ""
        for order in orders:
            sid = order.get("service_id")
            if sid and sid in titles:
                order["services"] = {"title": titles[sid]}
        return orders


@router.get("/withdrawals")
def admin_list_withdrawals(user_id: CurrentUserId):
    _require_admin(user_id)
    supabase = get_supabase()
    result = run_query(
        lambda: supabase.table("withdrawal_requests")
        .select("*, profiles(full_name, email)")
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    return result.data or []


class WithdrawalStatusUpdate(BaseModel):
    status: Literal["approved", "rejected"]


class AdminOrderStatusUpdate(BaseModel):
    status: Literal["completed", "cancelled", "active"]


@router.patch("/withdrawals/{request_id}")
def admin_update_withdrawal(request_id: str, body: WithdrawalStatusUpdate, user_id: CurrentUserId):
    _require_admin(user_id)
    status_value = body.status

    supabase = get_supabase()
    existing = run_query(
        lambda: supabase.table("withdrawal_requests")
        .select("*")
        .eq("id", request_id)
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="So'rov topilmadi")
    if existing.data["status"] != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="So'rov allaqachon ko'rib chiqilgan")

    req = existing.data
    if status_value == "approved":
        supabase.table("transactions").insert(
            {
                "user_id": req["freelancer_id"],
                "type": "withdrawal",
                "amount": req["amount"],
                "provider": "manual",
                "status": "completed",
            }
        ).execute()
    elif status_value == "rejected":
        freelancer = run_query(
            lambda: supabase.table("profiles")
            .select("wallet_balance")
            .eq("id", req["freelancer_id"])
            .single()
            .execute()
        )
        balance = int((freelancer.data or {}).get("wallet_balance") or 0)
        supabase.table("profiles").update({"wallet_balance": balance + req["amount"]}).eq(
            "id", req["freelancer_id"]
        ).execute()

    updated = run_query(
        lambda: supabase.table("withdrawal_requests")
        .update({"status": status_value})
        .eq("id", request_id)
        .execute()
    )
    return (updated.data or [req])[0]


@router.patch("/users/{target_id}")
def admin_update_user(target_id: str, body: AdminUserUpdate, user_id: CurrentUserId):
    _require_admin(user_id)
    if target_id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="O'zingizni o'zgartira olmaysiz")
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Yangilash ma'lumoti yo'q")
    supabase = get_supabase()
    result = run_query(
        lambda: supabase.table("profiles").update(updates).eq("id", target_id).execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foydalanuvchi topilmadi")
    return result.data[0]


@router.get("/services")
def admin_list_services(user_id: CurrentUserId, limit: int = 50, offset: int = 0):
    _require_admin(user_id)
    supabase = get_supabase()
    result = (
        supabase.table("services")
        .select("*, profiles(full_name)")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data or []


class AdminServiceUpdate(BaseModel):
    is_hidden: bool | None = None


@router.patch("/services/{service_id}")
def admin_update_service(service_id: str, body: AdminServiceUpdate, user_id: CurrentUserId):
    _require_admin(user_id)
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Yangilash ma'lumoti yo'q")
    supabase = get_supabase()
    result = run_query(
        lambda: supabase.table("services").update(updates).eq("id", service_id).execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Xizmat topilmadi")
    return result.data[0]


@router.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_service(service_id: str, user_id: CurrentUserId):
    _require_admin(user_id)
    supabase = get_supabase()
    run_query(lambda: supabase.table("services").delete().eq("id", service_id).execute())
    return None


@router.patch("/orders/{order_id}/status")
def admin_resolve_order(order_id: str, body: AdminOrderStatusUpdate, user_id: CurrentUserId):
    _require_admin(user_id)
    supabase = get_supabase()
    existing = run_query(
        lambda: supabase.table("orders").select("*").eq("id", order_id).single().execute()
    )
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buyurtma topilmadi")

    order = existing.data
    if order["status"] != "disputed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Faqat nizo holatidagi buyurtmalar hal qilinadi",
        )

    allowed = {"completed", "cancelled", "active"}
    if body.status not in allowed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Noto'g'ri status")

    result = run_query(
        lambda: supabase.table("orders")
        .update({"status": body.status})
        .eq("id", order_id)
        .execute()
    )
    updated = (result.data or [order])[0]
    if body.status == "completed":
        updated = release_escrow(supabase, {**order, **updated})
    elif body.status == "cancelled":
        updated = refund_escrow(supabase, {**order, **updated})

    service_title = None
    if order.get("service_id"):
        service_row = run_query(
            lambda: supabase.table("services")
            .select("title")
            .eq("id", order["service_id"])
            .limit(1)
            .execute()
        )
        if service_row.data:
            service_title = service_row.data[0].get("title")
    notify_order_status(
        supabase,
        order=order,
        new_status=body.status,
        service_title=service_title,
    )
    return updated
