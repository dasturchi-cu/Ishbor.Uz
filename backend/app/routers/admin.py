from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException, Query, status
from postgrest.exceptions import APIError
from pydantic import BaseModel, Field

from app.schemas import AdminBulkUserAction, AdminBulkUserNotify, AdminUserUpdate
from app.schemas_pagination import PaginatedResponse

from app.database import get_supabase_admin
from app.db_utils import run_query
from app.admin_enrichment import enrich_admin_users, user_ids_for_preset
from app.deps import CurrentUserId
from app.supabase_rpc import map_rpc_error, rpc_row
from app.notification_service import notify_order_status
from app.contract_escrow_service import refund_contract_escrow, release_contract_escrow
from app.payment_service import refund_escrow, release_escrow
from app.schemas_marketplace import DisputeResolve
from app.supabase_errors import map_supabase_error
from app.platform_services import broadcast_notification, build_admin_analytics, log_audit, log_moderation
from app.postgrest_embed import (
    BANK_ACCOUNT_USER_PROFILE,
    SERVICE_FREELANCER_PROFILE,
    WITHDRAWAL_FREELANCER_PROFILE,
)

router = APIRouter(prefix="/admin", tags=["admin"])

def _require_admin(user_id: str, minimum: str = "moderator"):
    from app.admin_rbac import require_admin_role

    require_admin_role(user_id, minimum)  # type: ignore[arg-type]


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


def _count_fraud_unresolved() -> int:
    supabase = get_supabase_admin()
    try:
        result = run_query(
            lambda: supabase.table("fraud_detection_logs")
            .select("id", count="exact")
            .eq("resolved", False)
            .limit(1)
            .execute()
        )
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


def _count_profiles_since(iso_since: str) -> int:
    supabase = get_supabase_admin()
    try:
        result = run_query(
            lambda: supabase.table("profiles")
            .select("id", count="exact")
            .gte("created_at", iso_since)
            .limit(1)
            .execute()
        )
        return int(result.count or 0)
    except APIError:
        return 0


def _count_profiles_role(role: str) -> int:
    supabase = get_supabase_admin()
    try:
        result = run_query(
            lambda: supabase.table("profiles")
            .select("id", count="exact")
            .eq("role", role)
            .limit(1)
            .execute()
        )
        return int(result.count or 0)
    except APIError:
        return 0


def _count_active_users(days: int = 7) -> int:
    supabase = get_supabase_admin()
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    try:
        result = run_query(
            lambda: supabase.table("user_activities")
            .select("user_id")
            .gte("created_at", since)
            .execute()
        )
        return len({row.get("user_id") for row in (result.data or []) if row.get("user_id")})
    except APIError:
        return 0


def _sum_escrow_held() -> int:
    supabase = get_supabase_admin()
    try:
        result = run_query(
            lambda: supabase.table("contracts")
            .select("amount")
            .eq("payment_status", "held")
            .execute()
        )
        return sum(int(row.get("amount") or 0) for row in (result.data or []))
    except APIError:
        return 0


def _compose_admin_stats(analytics: dict) -> dict:
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    disputed_orders = _count_table_where("orders", status="disputed")
    open_disputes = _count_table_where("disputes", status="open")
    disputed_contracts = _count_table_where("contracts", status="disputed")
    return {
        "users": _count_table("profiles"),
        "orders": _count_table("orders"),
        "services": _count_table("services"),
        "projects": _count_table("projects"),
        "vacancies": _count_table("vacancies"),
        "disputed_orders": disputed_orders,
        "contracts": _count_table("contracts"),
        "disputed_contracts": disputed_contracts,
        "open_disputes": open_disputes,
        "pending_disputes": disputed_orders + open_disputes + disputed_contracts,
        "escrow_held": _count_table_where("contracts", payment_status="held"),
        "escrow_balance": _sum_escrow_held(),
        "pending_withdrawals": _count_table_where("withdrawal_requests", status="pending"),
        "banned_users": _count_banned_users(),
        "new_users_today": _count_profiles_since(today_start),
        "employers": _count_profiles_role("client"),
        "freelancers": _count_profiles_role("freelancer"),
        "active_users_7d": _count_active_users(7),
        "revenue_30d": analytics.get("revenue_completed", 0),
        "conversion_rate": analytics.get("conversion_rate", 0),
        "new_users_30d": analytics.get("new_users", 0),
        "active_orders": _count_table_where("orders", status="active"),
        "fraud_alerts": _count_fraud_unresolved(),
    }


def _list_audit_logs(limit: int = 50, offset: int = 0, action: str | None = None) -> list:
    supabase = get_supabase_admin()

    def _run():
        query = supabase.table("audit_logs").select("*").order("created_at", desc=True)
        if action:
            query = query.eq("action", action)
        return query.range(offset, offset + limit - 1).execute()

    result = run_query(_run)
    return result.data or []


@router.get("/stats")
def admin_stats(user_id: CurrentUserId):
    _require_admin(user_id)
    analytics = build_admin_analytics(30)
    return _compose_admin_stats(analytics)


@router.get("/users", response_model=PaginatedResponse[dict])
def admin_list_users(
    user_id: CurrentUserId,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    search: str | None = Query(default=None, max_length=120),
    role: Literal["freelancer", "client"] | None = None,
    is_banned: bool | None = None,
    is_verified: bool | None = None,
    is_suspended: bool | None = None,
    preset: Literal["top_rated", "new_users", "active"] | None = None,
    sort_by: Literal["created_at", "trust_score", "revenue", "orders_count"] = "created_at",
    sort_dir: Literal["asc", "desc"] = "desc",
):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    select_cols = (
        "id, full_name, email, role, region, created_at, is_admin, is_banned, is_verified, "
        "username, phone, avatar_url, wallet_balance, is_suspended, suspended_until, suspension_reason"
    )

    preset_ids = user_ids_for_preset(preset) if preset else None
    if preset_ids is not None and len(preset_ids) == 0:
        return PaginatedResponse(items=[], total=0, limit=limit, offset=offset)

    def _build_query():
        query = supabase.table("profiles").select(select_cols, count="exact")
        if search and search.strip():
            from app.search_utils import sanitize_search_term

            safe_search = sanitize_search_term(search)
            if safe_search:
                pattern = f"%{safe_search}%"
                query = query.or_(
                    f"full_name.ilike.{pattern},email.ilike.{pattern},username.ilike.{pattern},phone.ilike.{pattern}"
                )
        if role:
            query = query.eq("role", role)
        if is_banned is not None:
            query = query.eq("is_banned", is_banned)
        if is_verified is not None:
            query = query.eq("is_verified", is_verified)
        if is_suspended is not None:
            query = query.eq("is_suspended", is_suspended)
        if preset_ids is not None:
            query = query.in_("id", preset_ids[:500])
        descending = sort_dir == "desc"
        if sort_by == "created_at":
            query = query.order("created_at", desc=descending)
        else:
            query = query.order("created_at", desc=True)
        return query.range(offset, offset + limit - 1)

    try:
        result = run_query(lambda: _build_query().execute())
    except APIError as exc:
        if "is_admin" in str(exc).lower() or "is_suspended" in str(exc).lower():
            result = run_query(
                lambda: supabase.table("profiles")
                .select("id, full_name, email, role, region, created_at, username, phone, avatar_url", count="exact")
                .order("created_at", desc=True)
                .range(offset, offset + limit - 1)
                .execute()
            )
        else:
            raise HTTPException(status_code=400, detail=map_supabase_error(exc)) from exc

    items = enrich_admin_users(result.data or [])
    if sort_by in ("trust_score", "revenue", "orders_count"):
        reverse = sort_dir == "desc"
        key_map = {
            "trust_score": lambda u: u.get("trust_score") or 0,
            "revenue": lambda u: u.get("revenue") or 0,
            "orders_count": lambda u: u.get("orders_count") or 0,
        }
        items.sort(key=key_map[sort_by], reverse=reverse)

    return PaginatedResponse(
        items=items,
        total=int(result.count or 0),
        limit=limit,
        offset=offset,
    )


@router.get("/users/{target_id}")
def admin_user_detail(target_id: str, user_id: CurrentUserId):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    profile_result = run_query(
        lambda: supabase.table("profiles").select("*").eq("id", target_id).single().execute()
    )
    if not profile_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foydalanuvchi topilmadi")

    profile = profile_result.data
    enriched = enrich_admin_users([profile])[0]

    rep_result = run_query(
        lambda: supabase.table("user_reputation")
        .select("*")
        .eq("user_id", target_id)
        .limit(1)
        .execute()
    )
    reputation = rep_result.data[0] if rep_result.data else None

    orders_result = run_query(
        lambda: supabase.table("orders")
        .select("*, services(title)")
        .or_(f"client_id.eq.{target_id},freelancer_id.eq.{target_id}")
        .order("created_at", desc=True)
        .limit(25)
        .execute()
    )

    reviews_result = run_query(
        lambda: supabase.table("reviews")
        .select("*")
        .or_(f"reviewer_id.eq.{target_id},freelancer_id.eq.{target_id}")
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )

    activities_result = run_query(
        lambda: supabase.table("user_activities")
        .select("*")
        .eq("user_id", target_id)
        .order("created_at", desc=True)
        .limit(30)
        .execute()
    )

    fraud_result = run_query(
        lambda: supabase.table("fraud_detection_logs")
        .select("*")
        .eq("user_id", target_id)
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )

    reports_result = run_query(
        lambda: supabase.table("reports")
        .select("*")
        .eq("reported_user_id", target_id)
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )

    mod_result = run_query(
        lambda: supabase.table("moderation_actions")
        .select("*")
        .eq("target_user_id", target_id)
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )

    audit_result = run_query(
        lambda: supabase.table("audit_logs")
        .select("*")
        .or_(f"entity_id.eq.{target_id},actor_id.eq.{target_id}")
        .order("created_at", desc=True)
        .limit(25)
        .execute()
    )

    verifications_result = run_query(
        lambda: supabase.table("user_verifications")
        .select("*")
        .eq("user_id", target_id)
        .order("created_at", desc=True)
        .execute()
    )

    escrow_held = 0
    contract_held = run_query(
        lambda: supabase.table("contracts")
        .select("amount")
        .eq("payment_status", "held")
        .or_(f"client_id.eq.{target_id},freelancer_id.eq.{target_id}")
        .execute()
    )
    escrow_held += sum(int(r.get("amount") or 0) for r in (contract_held.data or []))

    return {
        "profile": enriched,
        "reputation": reputation,
        "orders": orders_result.data or [],
        "reviews": reviews_result.data or [],
        "wallet_balance": profile.get("wallet_balance") or 0,
        "escrow_held": escrow_held,
        "activities": activities_result.data or [],
        "fraud_logs": fraud_result.data or [],
        "reports": reports_result.data or [],
        "moderation_actions": mod_result.data or [],
        "audit_logs": audit_result.data or [],
        "verifications": verifications_result.data or [],
    }


@router.get("/disputes", response_model=PaginatedResponse[dict])
def admin_list_disputes(
    user_id: CurrentUserId,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    scope: Literal["open", "resolved", "all"] = "open",
):
    _require_admin(user_id)
    supabase = get_supabase_admin()

    def _apply_scope(query):
        if scope == "open":
            return query.eq("status", "disputed")
        if scope == "resolved":
            return query.not_.is_("dispute_reason", "null").in_("status", ["completed", "cancelled", "active"])
        return query.not_.is_("dispute_reason", "null")

    try:
        result = run_query(
            lambda: _apply_scope(
                supabase.table("orders").select(
                    "id, service_id, client_id, freelancer_id, amount, status, notes, created_at, package_id, payment_status, dispute_reason, services(title)",
                    count="exact",
                )
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
            lambda: _apply_scope(
                supabase.table("orders").select(
                    "id, service_id, client_id, freelancer_id, amount, status, notes, created_at, package_id, payment_status, dispute_reason",
                    count="exact",
                )
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
        .select(f"*, {WITHDRAWAL_FREELANCER_PROFILE}(full_name, email)", count="exact")
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
    if "is_banned" in updates:
        log_moderation(
            admin_id=user_id,
            target_user_id=target_id,
            action="ban" if updates["is_banned"] else "unban",
        )
        log_audit(
            actor_id=user_id,
            action="ban" if updates["is_banned"] else "unban",
            entity_type="user",
            entity_id=target_id,
        )
    if "is_verified" in updates:
        log_moderation(
            admin_id=user_id,
            target_user_id=target_id,
            action="verify" if updates["is_verified"] else "unverify",
        )
        log_audit(
            actor_id=user_id,
            action="verify" if updates["is_verified"] else "unverify",
            entity_type="user",
            entity_id=target_id,
        )
    return result.data[0]


@router.post("/users/bulk")
def admin_bulk_users(body: AdminBulkUserAction, user_id: CurrentUserId):
    _require_admin(user_id)
    target_ids = [uid for uid in body.user_ids if uid != user_id]
    if not target_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Yaroqli foydalanuvchi tanlanmadi")

    updates: dict[str, bool] = {}
    if body.action == "ban":
        updates["is_banned"] = True
    elif body.action == "unban":
        updates["is_banned"] = False
    elif body.action == "verify":
        updates["is_verified"] = True
    elif body.action == "unverify":
        updates["is_verified"] = False
    elif body.action == "suspend":
        updates["is_suspended"] = True
    elif body.action == "unsuspend":
        updates["is_suspended"] = False
        updates["suspended_until"] = None
        updates["suspension_reason"] = None

    supabase = get_supabase_admin()
    result = run_query(
        lambda: supabase.table("profiles").update(updates).in_("id", target_ids).execute()
    )
    updated = result.data or []
    for row in updated:
        if "is_banned" in updates:
            log_moderation(
                admin_id=user_id,
                target_user_id=row["id"],
                action="ban" if updates["is_banned"] else "unban",
            )
            log_audit(
                actor_id=user_id,
                action="ban" if updates["is_banned"] else "unban",
                entity_type="user",
                entity_id=row["id"],
            )
        if "is_verified" in updates:
            log_moderation(
                admin_id=user_id,
                target_user_id=row["id"],
                action="verify" if updates["is_verified"] else "unverify",
            )
            log_audit(
                actor_id=user_id,
                action="verify" if updates["is_verified"] else "unverify",
                entity_type="user",
                entity_id=row["id"],
            )
    return {"updated": len(updated), "user_ids": [row["id"] for row in updated]}


@router.post("/users/bulk-notify")
def admin_bulk_notify_users(body: AdminBulkUserNotify, user_id: CurrentUserId):
    _require_admin(user_id)
    from app.notification_service import create_notification

    supabase = get_supabase_admin()
    sent = 0
    for uid in body.user_ids[:50]:
        if uid == user_id:
            continue
        create_notification(
            supabase,
            user_id=uid,
            type="order",
            title=body.title,
            body=body.body,
            href="/dashboard/notifications",
        )
        sent += 1
    log_audit(
        actor_id=user_id,
        action="bulk_notify",
        entity_type="user",
        metadata={"count": sent, "title": body.title},
    )
    return {"sent": sent}


@router.get("/services")
def admin_list_services(user_id: CurrentUserId, limit: int = 50, offset: int = 0):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    result = run_query(
        lambda: supabase.table("services")
        .select(f"*, {SERVICE_FREELANCER_PROFILE}(full_name)")
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


@router.get("/escrow", response_model=PaginatedResponse[dict])
def admin_list_escrow(
    user_id: CurrentUserId,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    action: str | None = None,
    source_type: str | None = None,
    status: str | None = None,
):
    _require_admin(user_id)
    supabase = get_supabase_admin()

    def _query():
        query = supabase.table("escrow_transactions").select("*", count="exact")
        if action:
            query = query.eq("action", action)
        if source_type:
            query = query.eq("source_type", source_type)
        if status:
            query = query.eq("status", status)
        return (
            query.order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

    result = run_query(_query)
    return PaginatedResponse(
        items=result.data or [],
        total=int(result.count or 0),
        limit=limit,
        offset=offset,
    )


@router.get("/escrow/summary")
def admin_escrow_summary(user_id: CurrentUserId):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    held_contracts = run_query(
        lambda: supabase.table("contracts")
        .select("amount")
        .eq("payment_status", "held")
        .execute()
    )
    held_milestones = run_query(
        lambda: supabase.table("milestones")
        .select("amount")
        .eq("payment_status", "held")
        .execute()
    )
    contract_held = sum(int(r.get("amount") or 0) for r in (held_contracts.data or []))
    milestone_held = sum(int(r.get("amount") or 0) for r in (held_milestones.data or []))
    return {
        "contract_held": contract_held,
        "milestone_held": milestone_held,
        "total_held": contract_held + milestone_held,
        "contracts_count": len(held_contracts.data or []),
        "milestones_count": len(held_milestones.data or []),
    }


@router.get("/escrow/auto-releases")
def admin_list_escrow_auto_releases(
    user_id: CurrentUserId,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    result = run_query(
        lambda: supabase.table("orders")
        .select(
            "id, amount, status, payment_status, auto_released, auto_release_at, updated_at, "
            "service_id, project_id, client_id, freelancer_id, services(title), projects(title)",
            count="exact",
        )
        .eq("auto_released", True)
        .order("updated_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return PaginatedResponse(
        items=result.data or [],
        total=result.count or 0,
        limit=limit,
        offset=offset,
    )


@router.get("/milestones", response_model=PaginatedResponse[dict])
def admin_list_milestones(
    user_id: CurrentUserId,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    status: str | None = None,
    payment_status: str | None = None,
):
    _require_admin(user_id)
    supabase = get_supabase_admin()

    def _query():
        query = supabase.table("milestones").select(
            "*, contracts(id, title, client_id, freelancer_id, project_id)",
            count="exact",
        )
        if status:
            query = query.eq("status", status)
        if payment_status:
            query = query.eq("payment_status", payment_status)
        return (
            query.order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

    result = run_query(_query)
    return PaginatedResponse(
        items=result.data or [],
        total=int(result.count or 0),
        limit=limit,
        offset=offset,
    )


_OPEN_DISPUTE_STATUSES = ["open", "responded", "under_review"]
_RESOLVED_DISPUTE_STATUSES = ["resolved_client", "resolved_freelancer", "closed"]


@router.get("/contract-disputes", response_model=PaginatedResponse[dict])
def admin_list_contract_disputes(
    user_id: CurrentUserId,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    scope: Literal["open", "resolved", "all"] = "open",
):
    _require_admin(user_id)
    supabase = get_supabase_admin()

    def _query():
        query = supabase.table("disputes").select(
            "*, contracts(id, title, amount, client_id, freelancer_id, project_id)",
            count="exact",
        )
        if scope == "open":
            query = query.in_("status", _OPEN_DISPUTE_STATUSES)
        elif scope == "resolved":
            query = query.in_("status", _RESOLVED_DISPUTE_STATUSES)
        return (
            query.order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

    try:
        result = run_query(_query)
    except APIError:
        return PaginatedResponse(items=[], total=0, limit=limit, offset=offset)
    return PaginatedResponse(
        items=result.data or [],
        total=int(result.count or 0),
        limit=limit,
        offset=offset,
    )


@router.get("/disputes-overview")
def admin_disputes_overview(
    user_id: CurrentUserId,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    scope: Literal["open", "resolved", "all"] = "open",
):
    _require_admin(user_id)
    orders_page = admin_list_disputes(user_id=user_id, limit=limit, offset=offset, scope=scope)
    contracts_page = admin_list_contract_disputes(user_id=user_id, limit=limit, offset=offset, scope=scope)
    return {
        "order_disputes": orders_page.items,
        "order_total": orders_page.total,
        "contract_disputes": contracts_page.items,
        "contract_total": contracts_page.total,
    }


@router.patch("/disputes/{dispute_id}/resolve")
def admin_resolve_dispute(dispute_id: str, body: DisputeResolve, user_id: CurrentUserId):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    existing = run_query(
        lambda: supabase.table("disputes").select("*, contracts(*)").eq("id", dispute_id).single().execute()
    )
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nizo topilmadi")

    dispute = existing.data
    contract = dispute.get("contracts") or {}
    if not contract:
        contract_row = run_query(
            lambda: supabase.table("contracts").select("*").eq("id", dispute["contract_id"]).single().execute()
        )
        contract = contract_row.data or {}

    from datetime import datetime, timezone

    result = run_query(
        lambda: supabase.table("disputes")
        .update(
            {
                "status": body.resolution,
                "admin_id": user_id,
                "admin_notes": body.admin_notes,
                "resolution": body.resolution,
                "resolved_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        .eq("id", dispute_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nizo topilmadi")

    if body.resolution == "resolved_freelancer" and contract:
        release_contract_escrow(contract)
        run_query(
            lambda: supabase.table("contracts")
            .update({"status": "completed"})
            .eq("id", contract["id"])
            .execute()
        )
    elif body.resolution == "resolved_client" and contract:
        refund_contract_escrow(contract)
    elif body.resolution == "closed" and contract:
        run_query(
            lambda: supabase.table("contracts")
            .update({"status": "active"})
            .eq("id", contract["id"])
            .execute()
        )
        run_query(
            lambda: supabase.table("projects")
            .update({"status": "active"})
            .eq("id", contract.get("project_id"))
            .execute()
        )

    return result.data[0]


# ─── SaaS platform admin ─────────────────────────────────────────────────────
from app.schemas_platform import (
    AdminAnalyticsResponse,
    AdminOverviewResponse,
    AdminBroadcastNotification,
    AdminSuspendUser,
    FeatureFlagUpdate,
    AuditLogResponse,
    BackupMetadataResponse,
    CompanyCreate,
    CompanyResponse,
    CompanyUpdate,
    FraudLogResponse,
    ModerationActionResponse,
    ReportMessageCreate,
    ReportMessageResponse,
    ReportResponse,
    VerificationResponse,
    VerificationReview,
)


@router.get("/overview", response_model=AdminOverviewResponse)
def admin_overview(user_id: CurrentUserId):
    _require_admin(user_id)
    analytics = build_admin_analytics(30)
    return {
        "stats": _compose_admin_stats(analytics),
        "analytics": analytics,
        "audit_logs": _list_audit_logs(limit=15),
        "activity_feed": _build_activity_feed(limit=20),
    }


def _build_activity_feed(limit: int = 20) -> list[dict]:
    supabase = get_supabase_admin()
    events: list[dict] = []

    profiles = run_query(
        lambda: supabase.table("profiles")
        .select("id, full_name, email, created_at")
        .order("created_at", desc=True)
        .limit(8)
        .execute()
    )
    for row in profiles.data or []:
        events.append(
            {
                "id": f"reg-{row['id']}",
                "type": "registration",
                "title": row.get("full_name") or row.get("email") or "Yangi foydalanuvchi",
                "created_at": row.get("created_at"),
                "href": f"/admin/users/{row['id']}",
            }
        )

    orders = run_query(
        lambda: supabase.table("orders")
        .select("id, amount, status, created_at, services(title)")
        .order("created_at", desc=True)
        .limit(8)
        .execute()
    )
    for row in orders.data or []:
        title = (row.get("services") or {}).get("title") or "Buyurtma"
        events.append(
            {
                "id": f"order-{row['id']}",
                "type": "order",
                "title": title,
                "body": f"{row.get('status')} · {row.get('amount')}",
                "created_at": row.get("created_at"),
                "href": f"/admin/orders",
            }
        )

    disputes = run_query(
        lambda: supabase.table("disputes")
        .select("id, status, created_at")
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )
    for row in disputes.data or []:
        events.append(
            {
                "id": f"dispute-{row['id']}",
                "type": "dispute",
                "title": f"Nizo · {row.get('status')}",
                "created_at": row.get("created_at"),
                "href": "/admin/disputes",
            }
        )

    fraud = run_query(
        lambda: supabase.table("fraud_detection_logs")
        .select("id, fraud_type, severity, created_at")
        .eq("resolved", False)
        .order("created_at", desc=True)
        .limit(5)
        .execute()
    )
    for row in fraud.data or []:
        events.append(
            {
                "id": f"fraud-{row['id']}",
                "type": "fraud",
                "title": row.get("fraud_type") or "Fraud",
                "body": row.get("severity"),
                "created_at": row.get("created_at"),
                "href": "/admin/fraud",
            }
        )

    events.sort(key=lambda e: e.get("created_at") or "", reverse=True)
    return events[:limit]


@router.get("/fraud-center")
def admin_fraud_center(user_id: CurrentUserId):
    _require_admin(user_id)
    supabase = get_supabase_admin()

    unresolved = run_query(
        lambda: supabase.table("fraud_detection_logs")
        .select("*")
        .eq("resolved", False)
        .order("created_at", desc=True)
        .limit(100)
        .execute()
    )
    logs = unresolved.data or []

    compliance = run_query(
        lambda: supabase.table("message_compliance_flags")
        .select("*")
        .eq("resolved", False)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )

    by_type: dict[str, list] = {}
    for log in logs:
        ftype = log.get("fraud_type") or "unknown"
        by_type.setdefault(ftype, []).append(log)

    high_severity = sum(1 for log in logs if log.get("severity") == "high")

    return {
        "summary": {
            "unresolved": len(logs),
            "high_severity": high_severity,
            "compliance_flags": len(compliance.data or []),
        },
        "by_type": by_type,
        "recent": logs[:30],
        "compliance_flags": compliance.data or [],
    }


@router.get("/activity-feed")
def admin_activity_feed(user_id: CurrentUserId, limit: int = Query(default=30, le=100)):
    _require_admin(user_id)
    return _build_activity_feed(limit=limit)


@router.get("/audit-logs", response_model=list[AuditLogResponse])
def admin_audit_logs(
    user_id: CurrentUserId,
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
    action: str | None = None,
):
    _require_admin(user_id)
    return _list_audit_logs(limit=limit, offset=offset, action=action)


@router.get("/analytics", response_model=AdminAnalyticsResponse)
def admin_analytics(user_id: CurrentUserId, days: int = Query(default=30, le=365)):
    _require_admin(user_id)
    return build_admin_analytics(days)


@router.get("/reports", response_model=PaginatedResponse[ReportResponse])
def admin_list_reports(
    user_id: CurrentUserId,
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    query = supabase.table("reports").select("*", count="exact").order("created_at", desc=True)
    if status_filter:
        query = query.eq("status", status_filter)
    result = run_query(lambda: query.range(offset, offset + limit - 1).execute())
    return PaginatedResponse(
        items=result.data or [],
        total=int(result.count or 0),
        limit=limit,
        offset=offset,
    )


@router.patch("/reports/{report_id}/status")
def admin_update_report_status(
    report_id: str,
    user_id: CurrentUserId,
    status_value: str = Query(..., alias="status"),
):
    _require_admin(user_id)
    if status_value not in ("open", "reviewing", "resolved", "dismissed"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Noto'g'ri status")
    supabase = get_supabase_admin()
    result = run_query(
        lambda: supabase.table("reports")
        .update({"status": status_value, "assigned_admin_id": user_id})
        .eq("id", report_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shikoyat topilmadi")
    log_moderation(
        admin_id=user_id,
        target_user_id=None,
        action=f"report_{status_value}",
        metadata={"report_id": report_id},
    )
    return result.data[0]


@router.post("/reports/{report_id}/messages", response_model=ReportMessageResponse)
def admin_report_message(report_id: str, body: ReportMessageCreate, user_id: CurrentUserId):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    result = run_query(
        lambda: supabase.table("report_messages")
        .insert(
            {
                "report_id": report_id,
                "sender_id": user_id,
                "message": body.message.strip(),
                "is_admin": True,
            }
        )
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Xabar yuborilmadi")
    run_query(
        lambda: supabase.table("reports")
        .update({"status": "reviewing", "assigned_admin_id": user_id})
        .eq("id", report_id)
        .execute()
    )
    return result.data[0]


@router.get("/verifications", response_model=list[VerificationResponse])
def admin_list_verifications(
    user_id: CurrentUserId,
    status_filter: str | None = Query(default="pending", alias="status"),
    limit: int = Query(default=50, le=200),
):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    query = supabase.table("user_verifications").select("*").order("created_at", desc=True)
    if status_filter:
        query = query.eq("status", status_filter)
    result = run_query(lambda: query.limit(limit).execute())
    return result.data or []


@router.patch("/verifications/{verification_id}", response_model=VerificationResponse)
def admin_review_verification(verification_id: str, body: VerificationReview, user_id: CurrentUserId):
    _require_admin(user_id)
    from datetime import datetime, timezone

    supabase = get_supabase_admin()
    existing = run_query(
        lambda: supabase.table("user_verifications").select("*").eq("id", verification_id).single().execute()
    )
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="So'rov topilmadi")

    result = run_query(
        lambda: supabase.table("user_verifications")
        .update(
            {
                "status": body.status,
                "admin_notes": body.admin_notes,
                "reviewed_by": user_id,
                "reviewed_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        .eq("id", verification_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Yangilanmadi")

    row = result.data[0]
    vtype = row["verification_type"]
    uid = row["user_id"]
    if body.status == "approved" and vtype in ("freelancer", "identity", "employer"):
        run_query(
            lambda: supabase.table("profiles").update({"is_verified": True}).eq("id", uid).execute()
        )
    elif body.status == "rejected" and vtype in ("freelancer", "identity", "employer"):
        other_approved = run_query(
            lambda: supabase.table("user_verifications")
            .select("id")
            .eq("user_id", uid)
            .eq("status", "approved")
            .neq("id", verification_id)
            .in_("verification_type", ["freelancer", "identity", "employer"])
            .limit(1)
            .execute()
        )
        if not other_approved.data:
            run_query(
                lambda: supabase.table("profiles").update({"is_verified": False}).eq("id", uid).execute()
            )
    if body.status == "approved" and vtype == "company":
        stir = (row.get("notes") or "").replace("STIR:", "").strip()
        updates: dict = {
            "stir_verified": True,
            "stir_verified_at": datetime.now(timezone.utc).isoformat(),
            "stir_verified_by": user_id,
            "is_verified": True,
        }
        if stir:
            updates["stir"] = stir
        company_row = run_query(
            lambda: supabase.table("companies")
            .select("id")
            .eq("owner_id", uid)
            .order("created_at")
            .limit(1)
            .execute()
        )
        if company_row.data:
            run_query(
                lambda: supabase.table("companies")
                .update(updates)
                .eq("id", company_row.data[0]["id"])
                .execute()
            )

    log_moderation(
        admin_id=user_id,
        target_user_id=row["user_id"],
        action=f"verification_{body.status}",
        reason=body.admin_notes,
    )
    log_audit(
        actor_id=user_id,
        action="verify" if body.status == "approved" else "verify_reject",
        entity_type="user",
        entity_id=row["user_id"],
        metadata={"verification_id": verification_id},
    )
    return row


@router.patch("/users/{target_user_id}/suspend")
def admin_suspend_user(target_user_id: str, body: AdminSuspendUser, user_id: CurrentUserId):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    updates: dict = {
        "is_suspended": body.suspended,
        "suspended_until": body.until.isoformat() if body.until else None,
        "suspension_reason": body.reason,
    }
    result = run_query(
        lambda: supabase.table("profiles").update(updates).eq("id", target_user_id).execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foydalanuvchi topilmadi")
    log_moderation(
        admin_id=user_id,
        target_user_id=target_user_id,
        action="suspend" if body.suspended else "unsuspend",
        reason=body.reason,
    )
    log_audit(
        actor_id=user_id,
        action="suspend" if body.suspended else "unsuspend",
        entity_type="user",
        entity_id=target_user_id,
    )
    return result.data[0]


@router.get("/fraud-logs", response_model=list[FraudLogResponse])
def admin_fraud_logs(
    user_id: CurrentUserId,
    resolved: bool | None = None,
    limit: int = Query(default=50, le=200),
):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    query = supabase.table("fraud_detection_logs").select("*").order("created_at", desc=True)
    if resolved is not None:
        query = query.eq("resolved", resolved)
    result = run_query(lambda: query.limit(limit).execute())
    return result.data or []


@router.patch("/fraud-logs/{log_id}/resolve")
def admin_resolve_fraud(log_id: str, user_id: CurrentUserId):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    result = run_query(
        lambda: supabase.table("fraud_detection_logs")
        .update({"resolved": True})
        .eq("id", log_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log topilmadi")
    return result.data[0]


@router.get("/moderation-actions", response_model=list[ModerationActionResponse])
def admin_moderation_actions(user_id: CurrentUserId, limit: int = Query(default=50, le=200)):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    result = run_query(
        lambda: supabase.table("moderation_actions")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []


@router.get("/backups", response_model=list[BackupMetadataResponse])
def admin_backups(user_id: CurrentUserId, limit: int = Query(default=20, le=100)):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    result = run_query(
        lambda: supabase.table("backups_metadata")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []


@router.post("/backups/record", response_model=BackupMetadataResponse, status_code=status.HTTP_201_CREATED)
def admin_record_backup(
    user_id: CurrentUserId,
    backup_type: str = Query(default="manual"),
    notes: str | None = None,
):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    result = run_query(
        lambda: supabase.table("backups_metadata")
        .insert(
            {
                "backup_type": backup_type,
                "status": "completed",
                "notes": notes or "Manual backup checkpoint recorded by admin",
            }
        )
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Yozilmadi")
    return result.data[0]


@router.get("/feature-flags", response_model=list[dict])
def admin_list_feature_flags(user_id: CurrentUserId):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    result = run_query(lambda: supabase.table("feature_flags").select("*").order("key").execute())
    return result.data or []


@router.patch("/feature-flags/{flag_key}")
def admin_update_feature_flag(flag_key: str, body: FeatureFlagUpdate, user_id: CurrentUserId):
    _require_admin(user_id)
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Yangilash ma'lumoti yo'q")
    supabase = get_supabase_admin()
    result = run_query(
        lambda: supabase.table("feature_flags").update(updates).eq("key", flag_key).execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flag topilmadi")
    log_audit(actor_id=user_id, action="feature_flag_update", entity_type="feature_flag", entity_id=flag_key, metadata=updates)
    return result.data[0]


class AdminBulkOrderAction(BaseModel):
    order_ids: list[str] = Field(min_length=1, max_length=50)
    status: Literal["completed", "cancelled", "active"]


@router.post("/orders/bulk")
def admin_bulk_orders(body: AdminBulkOrderAction, user_id: CurrentUserId):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    existing = run_query(
        lambda: supabase.table("orders").select("*").in_("id", body.order_ids).execute()
    )
    orders = existing.data or []
    if not orders:
        return {"updated": 0, "order_ids": []}

    updated_rows: list[dict] = []
    for order in orders:
        result = run_query(
            lambda o=order: supabase.table("orders")
            .update({"status": body.status})
            .eq("id", o["id"])
            .execute()
        )
        row = (result.data or [order])[0]
        if body.status == "completed":
            row = release_escrow(supabase, {**order, **row})
        elif body.status == "cancelled":
            row = refund_escrow(supabase, {**order, **row})
        updated_rows.append(row)
        log_audit(
            actor_id=user_id,
            action="order_bulk_update",
            entity_type="order",
            entity_id=row["id"],
            metadata={"status": body.status},
        )
    return {"updated": len(updated_rows), "order_ids": [row["id"] for row in updated_rows]}


@router.post("/notifications/broadcast")
def admin_broadcast_notification(body: AdminBroadcastNotification, user_id: CurrentUserId):
    _require_admin(user_id)
    sent = broadcast_notification(
        title=body.title.strip(),
        body=body.body.strip(),
        href=body.href,
        target=body.target,
    )
    log_audit(
        actor_id=user_id,
        action="broadcast_notification",
        entity_type="notification",
        metadata={"target": body.target, "sent": sent, "title": body.title[:80]},
    )
    return {"sent": sent}


@router.get("/companies", response_model=PaginatedResponse[dict])
def admin_list_companies(
    user_id: CurrentUserId,
    search: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    _require_admin(user_id)
    supabase = get_supabase_admin()

    def _query():
        query = supabase.table("companies").select("*", count="exact")
        if search and search.strip():
            from app.search_utils import sanitize_search_term

            safe_search = sanitize_search_term(search)
            if safe_search:
                pattern = f"%{safe_search}%"
                query = query.or_(f"name.ilike.{pattern},slug.ilike.{pattern},region.ilike.{pattern}")
        return query.order("created_at", desc=True).range(offset, offset + limit - 1)

    result = run_query(lambda: _query().execute())
    return PaginatedResponse(
        items=result.data or [],
        total=int(result.count or 0),
        limit=limit,
        offset=offset,
    )


@router.post("/companies", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def admin_create_company(body: CompanyCreate, user_id: CurrentUserId):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    payload = body.model_dump(exclude_none=True)
    result = run_query(lambda: supabase.table("companies").insert(payload).execute())
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Kompaniya yaratilmadi")
    log_audit(actor_id=user_id, action="company_create", entity_type="company", entity_id=result.data[0]["id"])
    return result.data[0]


@router.patch("/companies/{company_id}", response_model=CompanyResponse)
def admin_update_company(company_id: str, body: CompanyUpdate, user_id: CurrentUserId):
    _require_admin(user_id)
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Yangilash ma'lumoti yo'q")
    supabase = get_supabase_admin()
    result = run_query(
        lambda: supabase.table("companies").update(updates).eq("id", company_id).execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kompaniya topilmadi")
    log_audit(actor_id=user_id, action="company_update", entity_type="company", entity_id=company_id)
    return result.data[0]


@router.delete("/companies/{company_id}")
def admin_delete_company(company_id: str, user_id: CurrentUserId):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    run_query(lambda: supabase.table("companies").delete().eq("id", company_id).execute())
    log_audit(actor_id=user_id, action="company_delete", entity_type="company", entity_id=company_id)
    return {"ok": True}


class ServiceModerationUpdate(BaseModel):
    status: Literal["approved", "rejected"]
    notes: str | None = Field(default=None, max_length=500)


@router.get("/services/moderation-queue")
def admin_service_moderation_queue(
    user_id: CurrentUserId,
    limit: int = Query(default=50, le=200),
):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    result = run_query(
        lambda: supabase.table("services")
        .select(f"*, {SERVICE_FREELANCER_PROFILE}(full_name, email)")
        .eq("moderation_status", "pending")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []


@router.patch("/services/{service_id}/moderation")
def admin_moderate_service(service_id: str, body: ServiceModerationUpdate, user_id: CurrentUserId):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    updates = {
        "moderation_status": body.status,
        "moderation_notes": body.notes,
        "moderated_by": user_id,
        "moderated_at": datetime.now(timezone.utc).isoformat(),
        "is_hidden": body.status != "approved",
    }
    result = run_query(
        lambda: supabase.table("services").update(updates).eq("id", service_id).execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Xizmat topilmadi")
    log_moderation(
        admin_id=user_id,
        target_user_id=result.data[0].get("freelancer_id"),
        action=f"service_{body.status}",
        reason=body.notes,
        metadata={"service_id": service_id},
    )
    return result.data[0]


@router.get("/compliance-flags")
def admin_compliance_flags(user_id: CurrentUserId, resolved: bool = False, limit: int = Query(default=50, le=200)):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    result = run_query(
        lambda: supabase.table("message_compliance_flags")
        .select("*")
        .eq("resolved", resolved)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []


@router.patch("/compliance-flags/{flag_id}/resolve")
def admin_resolve_compliance_flag(flag_id: str, user_id: CurrentUserId):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    result = run_query(
        lambda: supabase.table("message_compliance_flags")
        .update({"resolved": True})
        .eq("id", flag_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Flag topilmadi")
    return result.data[0]


@router.get("/bank-accounts")
def admin_list_bank_accounts(
    user_id: CurrentUserId,
    verified: bool | None = Query(default=False),
    limit: int = Query(default=50, le=200),
):
    _require_admin(user_id)
    supabase = get_supabase_admin()

    def _query():
        q = supabase.table("bank_accounts").select(f"*, {BANK_ACCOUNT_USER_PROFILE}(full_name, email)", count="exact")
        if verified is not None:
            q = q.eq("is_verified", verified)
        return q.order("created_at", desc=True).limit(limit).execute()

    result = run_query(_query)
    return {"items": result.data or [], "total": int(result.count or 0)}


@router.patch("/bank-accounts/{account_id}/verify")
def admin_verify_bank_account(account_id: str, user_id: CurrentUserId):
    _require_admin(user_id)
    supabase = get_supabase_admin()
    result = run_query(
        lambda: supabase.table("bank_accounts")
        .update(
            {
                "is_verified": True,
                "verified_by": user_id,
                "verified_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        .eq("id", account_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Bank hisobi topilmadi")
    log_audit(actor_id=user_id, action="bank_verify", entity_type="bank_account", entity_id=account_id)
    return result.data[0]


@router.post("/trust-jobs/run")
def admin_run_trust_jobs(user_id: CurrentUserId):
    _require_admin(user_id)
    from app.trust_jobs import run_all_trust_jobs

    return run_all_trust_jobs()
