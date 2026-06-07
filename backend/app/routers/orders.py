from fastapi import APIRouter, HTTPException, status

from app.database import get_supabase
from app.deps import CurrentUserId
from app.schemas import OrderCreate, OrderResponse, OrderStatusUpdate

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=list[OrderResponse])
def list_my_orders(user_id: CurrentUserId):
    supabase = get_supabase()
    result = (
        supabase.table("orders")
        .select("*, services(title, category)")
        .or_(f"client_id.eq.{user_id},freelancer_id.eq.{user_id}")
        .order("created_at", desc=True)
        .execute()
    )
    orders = result.data or []

    profile_ids = set()
    for order in orders:
        profile_ids.add(order["client_id"])
        profile_ids.add(order["freelancer_id"])

    profiles_map: dict[str, dict] = {}
    if profile_ids:
        profiles = (
            supabase.table("profiles")
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
        .select("id, price, freelancer_id")
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

    order_data = {
        "service_id": payload.service_id,
        "client_id": user_id,
        "freelancer_id": service.data["freelancer_id"],
        "amount": service.data["price"],
        "notes": payload.notes,
        "status": "pending",
    }

    result = supabase.table("orders").insert(order_data).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Buyurtma yaratilmadi")
    return result.data[0]


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(order_id: str, payload: OrderStatusUpdate, user_id: CurrentUserId):
    supabase = get_supabase()

    existing = supabase.table("orders").select("*").eq("id", order_id).single().execute()
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buyurtma topilmadi")

    order = existing.data
    if user_id not in (order["client_id"], order["freelancer_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")

    result = (
        supabase.table("orders")
        .update({"status": payload.status})
        .eq("id", order_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buyurtma topilmadi")
    return result.data[0]
