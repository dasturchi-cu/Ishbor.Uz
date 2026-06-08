from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, status

from app.database import get_supabase
from app.deps import CurrentUserId
from app.notification_service import create_notification
from app.schemas import ConversationResponse, MessageCreate, MessageResponse

router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("/conversations", response_model=list[ConversationResponse])
def list_conversations(
    user_id: CurrentUserId,
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
):
    supabase = get_supabase()

    orders_result = (
        supabase.table("orders")
        .select("id, client_id, freelancer_id, status, services(title), created_at")
        .or_(f"client_id.eq.{user_id},freelancer_id.eq.{user_id}")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    orders = orders_result.data or []
    if not orders:
        return []

    order_ids = [o["id"] for o in orders]
    other_ids = list(
        {
            o["freelancer_id"] if o["client_id"] == user_id else o["client_id"]
            for o in orders
        }
    )

    profiles_result = (
        supabase.table("profiles").select("id, full_name").in_("id", other_ids).execute()
    )
    profiles_map = {
        p["id"]: p.get("full_name") or "Foydalanuvchi" for p in (profiles_result.data or [])
    }

    messages_result = (
        supabase.table("messages")
        .select("order_id, content, created_at, receiver_id, read_at")
        .in_("order_id", order_ids)
        .order("created_at", desc=True)
        .execute()
    )

    last_by_order: dict[str, dict] = {}
    unread_by_order: dict[str, int] = {}
    for msg in messages_result.data or []:
        oid = msg["order_id"]
        if oid not in last_by_order:
            last_by_order[oid] = msg
        if msg["receiver_id"] == user_id and msg.get("read_at") is None:
            unread_by_order[oid] = unread_by_order.get(oid, 0) + 1

    conversations: list[dict] = []
    for order in orders:
        oid = order["id"]
        other_id = order["freelancer_id"] if order["client_id"] == user_id else order["client_id"]
        last = last_by_order.get(oid)
        conversations.append(
            {
                "order_id": oid,
                "other_user_id": other_id,
                "other_user_name": profiles_map.get(other_id, "Foydalanuvchi"),
                "order_title": (order.get("services") or {}).get("title") or "Buyurtma",
                "order_status": order["status"],
                "last_message": last["content"] if last else None,
                "last_message_at": last["created_at"] if last else order["created_at"],
                "unread_count": unread_by_order.get(oid, 0),
            }
        )

    return conversations


@router.get("", response_model=list[MessageResponse])
def list_messages(user_id: CurrentUserId, order_id: str = Query(...)):
    supabase = get_supabase()

    order = supabase.table("orders").select("*").eq("id", order_id).single().execute()
    if not order.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buyurtma topilmadi")
    if user_id not in (order.data["client_id"], order.data["freelancer_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")

    result = (
        supabase.table("messages")
        .select("*")
        .eq("order_id", order_id)
        .order("created_at", desc=False)
        .execute()
    )

    now = datetime.now(timezone.utc).isoformat()
    supabase.table("messages").update({"read_at": now}).eq("order_id", order_id).eq(
        "receiver_id", user_id
    ).is_("read_at", "null").execute()

    return result.data or []


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(payload: MessageCreate, user_id: CurrentUserId):
    supabase = get_supabase()

    order = supabase.table("orders").select("*").eq("id", payload.order_id).single().execute()
    if not order.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buyurtma topilmadi")

    order_row = order.data
    if user_id not in (order_row["client_id"], order_row["freelancer_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")

    receiver_id = (
        order_row["freelancer_id"]
        if user_id == order_row["client_id"]
        else order_row["client_id"]
    )

    data = {
        "order_id": payload.order_id,
        "sender_id": user_id,
        "receiver_id": receiver_id,
        "content": payload.content,
    }
    result = supabase.table("messages").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Xabar yuborilmadi")

    service_title = (order_row.get("services") or {}).get("title") if isinstance(order_row.get("services"), dict) else None
    if not service_title and order_row.get("service_id"):
        svc = (
            supabase.table("services")
            .select("title")
            .eq("id", order_row["service_id"])
            .limit(1)
            .execute()
        )
        if svc.data:
            service_title = svc.data[0].get("title")

    create_notification(
        supabase,
        user_id=receiver_id,
        type="message",
        title=service_title or "Yangi xabar",
        body=payload.content[:120],
        href=f"/dashboard/messages?order={payload.order_id}",
    )

    return result.data[0]
