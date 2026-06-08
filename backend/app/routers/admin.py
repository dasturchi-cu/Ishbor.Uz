from typing import Literal

from fastapi import APIRouter, HTTPException, Query, status
from postgrest.exceptions import APIError
from pydantic import BaseModel

from app.schemas import AdminUserUpdate
from app.schemas_pagination import PaginatedResponse

from app.database import get_supabase_admin
from app.db_utils import run_query
from app.deps import CurrentUserId
from app.supabase_rpc import map_rpc_error, rpc_row
from app.notification_service import notify_order_status
from app.payment_service import refund_escrow, release_escrow
from app.supabase_errors import map_supabase_error

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_admin(user_id: str):
    supabase = get_supabase_admin()
    profile = run_query(
        lambda: supabase.table("profiles").select("is_admin").eq("id", user_id).single().execute()
    )
    if not profile.data or not profile.data.get("is_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin ruxsati kerak")


def _count_table(table: str) -> int:
    supabase = get_supabase_admin()
    try:
        result = run_query(
            lambda: supabase.table(table).select("id", count="exact").limit(1).execute()
        )
        return int(result.count or 0)
    except APIError:
        return 0


def _count_table_where(table: str, **filters: str) -> int:
    supabase = get_supabase_admin()
    try:
        query = supabase.table(table).select("id", count="exact")
        for key, value in filters.items():
            query = query.eq(key, value)
        result = run_query(lambda: query.limit(1).execute())
        return int(result.count or 0)
    except APIError:
        return 0


def _count_banned_users() -> int:
    supabase = get_supabase_admin()
    try:
        result = run_query(
            lambda: supabase.table("profiles")
            .select("id", count="exact")
            .eq("is_banned", True)
            .limit(1)
            .execute()
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
        "disputed_orders": _count_table_where("orders", status="disputed"),
        "pending_withdrawals": _count_table_where("withdrawal_requests", status="pending"),
        "banned_users": _count_banned_users(),
    }


@router.get("/users", response_model=PaginatedResponse[dict])
def admin_list_users(
    user_id: CurrentUserId,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    select_cols = "id, full_name, email, role, region, created_at, is_admin, is_banned"
    try:
        result = run_query(
            lambda: supabase.table("profiles")
            .select(select_cols, count="exact")
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
    except APIError as exc:
        if "is_admin" in str(exc).lower():
            result = run_query(
                lambda: supabase.table("profiles")
                .select("id, full_name, email, role, region, created_at", count="exact")
                .order("created_at", desc=True)
                .range(offset, offset + limit - 1)
                .execute()
            )
        else:
            raise HTTPException(status_code=400, detail=map_supabase_error(exc)) from exc
    return PaginatedResponse(
        items=result.data or [],
        total=int(result.count or 0),
        limit=limit,
        offset=offset,
    )


@router.get("/disputes", response_model=PaginatedResponse[dict])
def admin_list_disputes(
    user_id: CurrentUserId,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    try:
        result = run_query(
            lambda: supabase.table("orders")
            .select(
                "id, service_id, client_id, freelancer_id, amount, status, notes, created_at, package_id, payment_status, dispute_reason, services(title)",
                count="exact",
            )
            .eq("status", "disputed")
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return PaginatedResponse(
            items=result.data or [],
            total=int(result.count or 0),
            limit=limit,
            offset=offset,
        )
    except APIError:
        result = run_query(
            lambda: supabase.table("orders")
            .select(
                "id, service_id, client_id, freelancer_id, amount, status, notes, created_at, package_id, payment_status, dispute_reason",
                count="exact",
            )
            .eq("status", "disputed")
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
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
        return PaginatedResponse(
            items=orders,
            total=int(result.count or 0),
            limit=limit,
            offset=offset,
        )


@router.get("/orders", response_model=PaginatedResponse[dict])
def admin_list_orders(
    user_id: CurrentUserId,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    _require_admin(user_id)
    supabase = get_supabase_admin()

    try:
        result = run_query(
            lambda: supabase.table("orders")
            .select(
                "id, service_id, client_id, freelancer_id, amount, status, notes, created_at, package_id, payment_status, dispute_reason, services(title)",
                count="exact",
            )
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        return PaginatedResponse(
            items=result.data or [],
            total=int(result.count or 0),
            limit=limit,
            offset=offset,
        )
    except APIError:
        result = run_query(
            lambda: supabase.table("orders")
            .select(
                "id, service_id, client_id, freelancer_id, amount, status, notes, created_at, package_id, payment_status, dispute_reason",
                count="exact",
            )
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
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
        return PaginatedResponse(
            items=orders,
            total=int(result.count or 0),
            limit=limit,
            offset=offset,
        )


@router.get("/withdrawals", response_model=PaginatedResponse[dict])
def admin_list_withdrawals(
    user_id: CurrentUserId,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    result = run_query(
        lambda: supabase.table("withdrawal_requests")
        .select("*, profiles(full_name, email)", count="exact")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return PaginatedResponse(
        items=result.data or [],
        total=int(result.count or 0),
        limit=limit,
        offset=offset,
    )


@router.get("/waitlist", response_model=PaginatedResponse[dict])
def admin_list_waitlist(
    user_id: CurrentUserId,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    source: str | None = Query(default=None, max_length=64),
):
    _require_admin(user_id)
    supabase = get_supabase_admin()

    def _query():
        q = supabase.table("waitlist_emails").select("id, email, source, created_at", count="exact")
        if source:
            q = q.eq("source", source)
        return q.order("created_at", desc=True).range(offset, offset + limit - 1).execute()

    result = run_query(_query)
    return PaginatedResponse(
        items=result.data or [],
        total=int(result.count or 0),
        limit=limit,
        offset=offset,
    )


class WithdrawalStatusUpdate(BaseModel):
    status: Literal["approved", "rejected"]


class AdminOrderStatusUpdate(BaseModel):
    status: Literal["completed", "cancelled", "active"]


@router.patch("/withdrawals/{request_id}")
def admin_update_withdrawal(request_id: str, body: WithdrawalStatusUpdate, user_id: CurrentUserId):
    _require_admin(user_id)
    status_value = body.status

    supabase = get_supabase_admin()
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
        try:
            result = run_query(
                lambda: supabase.rpc(
                    "approve_withdrawal_rpc", {"p_request_id": request_id}
                ).execute()
            )
        except APIError as exc:
            raise map_rpc_error(exc) from exc
        row = rpc_row(result)
        return row or req
    elif status_value == "rejected":
        try:
            result = run_query(
                lambda: supabase.rpc(
                    "reject_withdrawal_rpc", {"p_request_id": request_id}
                ).execute()
            )
        except APIError as exc:
            raise map_rpc_error(exc) from exc
        row = rpc_row(result)
        return row or req

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
    supabase = get_supabase_admin()
    result = run_query(
        lambda: supabase.table("profiles").update(updates).eq("id", target_id).execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foydalanuvchi topilmadi")
    return result.data[0]


@router.get("/services")
def admin_list_services(user_id: CurrentUserId, limit: int = 50, offset: int = 0):
    _require_admin(user_id)
    supabase = get_supabase_admin()
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
    supabase = get_supabase_admin()
    result = run_query(
        lambda: supabase.table("services").update(updates).eq("id", service_id).execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Xizmat topilmadi")
    return result.data[0]


@router.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_service(service_id: str, user_id: CurrentUserId):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    run_query(lambda: supabase.table("services").delete().eq("id", service_id).execute())
    return None


@router.patch("/orders/{order_id}/status")
def admin_resolve_order(order_id: str, body: AdminOrderStatusUpdate, user_id: CurrentUserId):
    _require_admin(user_id)
    supabase = get_supabase_admin()
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
