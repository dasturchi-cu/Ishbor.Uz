from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, status

from app.deps import UserAuthDep
from app.fraud_service import flag_message_if_risky
from app.notification_service import create_notification
from app.schemas import ConversationResponse, MessageCreate, MessageResponse

router = APIRouter(prefix="/messages", tags=["messages"])

_TERMINAL_ORDER_STATUSES = frozenset({"completed", "cancelled"})


def _order_title(supabase, order_row: dict) -> str:
    services = order_row.get("services")
    if isinstance(services, dict) and services.get("title"):
        return services["title"]
    service_id = order_row.get("service_id")
    if service_id:
        svc = (
            supabase.table("services")
            .select("title")
            .eq("id", service_id)
            .limit(1)
            .execute()
        )
        if svc.data:
            return svc.data[0].get("title") or "Buyurtma"
    project_id = order_row.get("project_id")
    if project_id:
        proj = (
            supabase.table("projects")
            .select("title")
            .eq("id", project_id)
            .limit(1)
            .execute()
        )
        if proj.data:
            return proj.data[0].get("title") or "Loyiha buyurtmasi"
    notes = (order_row.get("notes") or "").strip()
    if notes.startswith("Loyiha:"):
        line = notes.split("\n", 1)[0].replace("Loyiha:", "").strip()
        if line:
            return line
    return "Buyurtma"


@router.get("/conversations", response_model=list[ConversationResponse])
def list_conversations(
    auth: UserAuthDep,
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
):
    user_id = auth.user_id
    supabase = auth.supabase

    orders_result = (
        supabase.table("orders")
        .select("id, client_id, freelancer_id, status, service_id, project_id, notes, services(title), created_at")
        .or_(f"client_id.eq.{user_id},freelancer_id.eq.{user_id}")
        .not_.in_("status", ["cancelled"])
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

    stats_by_order: dict[str, dict] = {}
    try:
        stats_result = supabase.rpc(
            "get_conversation_message_stats",
            {"p_user_id": user_id, "p_order_ids": order_ids},
        ).execute()
        stats_by_order = {
            row["order_id"]: row for row in (stats_result.data or [])
        }
    except Exception:
        messages_result = (
            supabase.table("messages")
            .select("order_id, content, created_at, receiver_id, read_at")
            .in_("order_id", order_ids)
            .order("created_at", desc=True)
            .limit(min(len(order_ids) * 5, 200))
            .execute()
        )
        for msg in messages_result.data or []:
            oid = msg["order_id"]
            if oid not in stats_by_order:
                stats_by_order[oid] = {
                    "order_id": oid,
                    "last_content": msg["content"],
                    "last_created_at": msg["created_at"],
                    "unread_count": 0,
                }
            if msg["receiver_id"] == user_id and msg.get("read_at") is None:
                stats_by_order[oid]["unread_count"] = int(stats_by_order[oid].get("unread_count", 0)) + 1

    conversations: list[dict] = []
    for order in orders:
        oid = order["id"]
        other_id = order["freelancer_id"] if order["client_id"] == user_id else order["client_id"]
        stats = stats_by_order.get(oid, {})
        conversations.append(
            {
                "order_id": oid,
                "other_user_id": other_id,
                "other_user_name": profiles_map.get(other_id, "Foydalanuvchi"),
                "order_title": _order_title(supabase, order),
                "order_status": order["status"],
                "last_message": stats.get("last_content"),
                "last_message_at": stats.get("last_created_at") or order["created_at"],
                "unread_count": int(stats.get("unread_count") or 0),
            }
        )

    return conversations


@router.get("", response_model=list[MessageResponse])
def list_messages(
    auth: UserAuthDep,
    order_id: str = Query(...),
    limit: int = Query(default=200, le=500),
    offset: int = Query(default=0, ge=0),
):
    user_id = auth.user_id
    supabase = auth.supabase

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
        .range(offset, offset + limit - 1)
        .execute()
    )

    now = datetime.now(timezone.utc).isoformat()
    supabase.table("messages").update({"read_at": now}).eq("order_id", order_id).eq(
        "receiver_id", user_id
    ).is_("read_at", "null").execute()

    return result.data or []


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(payload: MessageCreate, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase

    order = supabase.table("orders").select("*").eq("id", payload.order_id).single().execute()
    if not order.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buyurtma topilmadi")

    order_row = order.data
    if user_id not in (order_row["client_id"], order_row["freelancer_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")
    if order_row.get("status") in _TERMINAL_ORDER_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tugallangan yoki bekor qilingan buyurtmada xabar yuborib bo'lmaydi",
        )

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

    msg = result.data[0]
    if user_id == order_row["freelancer_id"] and not order_row.get("freelancer_first_response_at"):
        from app.database import get_supabase_admin

        get_supabase_admin().table("orders").update(
            {"freelancer_first_response_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", payload.order_id).execute()

    flags = flag_message_if_risky(
        message_id=msg["id"],
        order_id=payload.order_id,
        sender_id=user_id,
        content=payload.content,
    )
    if flags:
        create_notification(
            supabase,
            user_id=receiver_id,
            type="order",
            title="Xavfsizlik ogohlantirishi",
            body="Chatda platformadan tashqari to'lov haqida xabar aniqlandi",
            href=f"/dashboard/messages?order={payload.order_id}",
        )

    create_notification(
        supabase,
        user_id=receiver_id,
        type="message",
        title=_order_title(supabase, order_row),
        body=payload.content[:120],
        href=f"/dashboard/messages?order={payload.order_id}",
        urgent=True,
    )

    return msg
