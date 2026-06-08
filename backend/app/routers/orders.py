from fastapi import APIRouter, HTTPException, Query, status

from app.database import get_supabase
from app.db_utils import run_query
from app.deps import CurrentUserId
from app.order_transitions import validate_order_transition
from app.notification_service import notify_order_status
from app.payment_service import release_escrow
from app.schemas import OrderCreate, OrderResponse, OrderStatusUpdate
from app.service_packages import resolve_package_amount

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=list[OrderResponse])
def list_my_orders(
    user_id: CurrentUserId,
    limit: int = Query(default=100, le=200),
    offset: int = Query(default=0, ge=0),
):
    result = run_query(
        lambda: get_supabase()
        .table("orders")
        .select("*, services(title, category)")
        .or_(f"client_id.eq.{user_id},freelancer_id.eq.{user_id}")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    orders = result.data or []

    profile_ids = set()
    for order in orders:
        profile_ids.add(order["client_id"])
        profile_ids.add(order["freelancer_id"])

    profiles_map: dict[str, dict] = {}
    if profile_ids:
        profiles = run_query(
            lambda: get_supabase()
            .table("profiles")
            .select("id, full_name, region")
            .in_("id", list(profile_ids))
            .execute()
        )
        for p in profiles.data or []:
            profiles_map[p["id"]] = p

    enriched = []
    for order in orders:
        enriched.append(
            {
                **order,
                "client_profile": profiles_map.get(order["client_id"]),
                "freelancer_profile": profiles_map.get(order["freelancer_id"]),
            }
        )
    return enriched


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, user_id: CurrentUserId):
    supabase = get_supabase()

    profile = supabase.table("profiles").select("role").eq("id", user_id).single().execute()
    if not profile.data or profile.data.get("role") != "client":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faqat mijoz buyurtma yaratishi mumkin",
        )

    service = (
        supabase.table("services")
        .select("id, price, freelancer_id, packages")
        .eq("id", payload.service_id)
        .single()
        .execute()
    )
    if not service.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Xizmat topilmadi")

    if service.data["freelancer_id"] == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O'z xizmatingizga buyurtma bera olmaysiz",
        )

    active = (
        supabase.table("orders")
        .select("id")
        .eq("client_id", user_id)
        .eq("service_id", payload.service_id)
        .in_("status", ["pending", "active", "delivered", "disputed"])
        .limit(1)
        .execute()
    )
    if active.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu xizmat uchun faol buyurtma mavjud",
        )

    amount = resolve_package_amount(service.data, payload.package_id)

    order_data = {
        "service_id": payload.service_id,
        "client_id": user_id,
        "freelancer_id": service.data["freelancer_id"],
        "amount": amount,
        "package_id": payload.package_id,
        "notes": payload.notes,
        "status": "pending",
    }

    result = supabase.table("orders").insert(order_data).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Buyurtma yaratilmadi")
    return result.data[0]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: str, user_id: CurrentUserId):
    result = run_query(
        lambda: get_supabase()
        .table("orders")
        .select("*, services(title, category)")
        .eq("id", order_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buyurtma topilmadi")

    order = result.data
    if user_id not in (order["client_id"], order["freelancer_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")

    profile_ids = {order["client_id"], order["freelancer_id"]}
    profiles = run_query(
        lambda: get_supabase()
        .table("profiles")
        .select("id, full_name, region")
        .in_("id", list(profile_ids))
        .execute()
    )
    profiles_map = {p["id"]: p for p in (profiles.data or [])}
    return {
        **order,
        "client_profile": profiles_map.get(order["client_id"]),
        "freelancer_profile": profiles_map.get(order["freelancer_id"]),
    }


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(order_id: str, payload: OrderStatusUpdate, user_id: CurrentUserId):
    supabase = get_supabase()

    existing = supabase.table("orders").select("*").eq("id", order_id).single().execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buyurtma topilmadi")

    order = existing.data
    if user_id not in (order["client_id"], order["freelancer_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")

    validate_order_transition(
        order["status"],
        payload.status,
        user_id,
        order["client_id"],
        order["freelancer_id"],
        order.get("payment_status"),
    )

    update_payload: dict = {"status": payload.status}
    if payload.delivery_notes is not None:
        update_payload["delivery_notes"] = payload.delivery_notes.strip() or None
    if payload.status == "disputed" and payload.dispute_reason:
        update_payload["dispute_reason"] = payload.dispute_reason.strip()
    result = (
        supabase.table("orders")
        .update(update_payload)
        .eq("id", order_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buyurtma topilmadi")

    updated_order = result.data[0]
    if payload.status == "completed":
        updated_order = release_escrow(supabase, {**order, **updated_order})

    service_title = None
    if order.get("service_id"):
        service_row = (
            supabase.table("services")
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
        new_status=payload.status,
        service_title=service_title,
    )

    return updated_order
