from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, status

from app.deps import UserAuthDep
from app.notification_service import create_notification
from app.schemas_marketplace import (
    ConversationMessageCreate,
    ConversationMessageResponse,
    ConversationThreadResponse,
    PresenceResponse,
    PresenceUpdate,
)

router = APIRouter(prefix="/conversations", tags=["conversations"])


def _assert_participant(conversation: dict, user_id: str) -> None:
    participants = conversation.get("participant_ids") or []
    if user_id not in participants:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")


@router.get("", response_model=list[ConversationThreadResponse])
def list_conversations(
    auth: UserAuthDep,
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
):
    user_id = auth.user_id
    supabase = auth.supabase

    result = (
        supabase.table("conversations")
        .select("*")
        .contains("participant_ids", [user_id])
        .order("updated_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    conversations = result.data or []
    if not conversations:
        return []

    enriched: list[dict] = []
    for conv in conversations:
        other_id = next((p for p in conv["participant_ids"] if p != user_id), None)
        other_name = "Foydalanuvchi"
        title = ""
        if other_id:
            profile = (
                supabase.table("profiles").select("full_name").eq("id", other_id).single().execute()
            )
            other_name = (profile.data or {}).get("full_name") or other_name
        if conv.get("contract_id"):
            contract = (
                supabase.table("contracts").select("title").eq("id", conv["contract_id"]).single().execute()
            )
            title = (contract.data or {}).get("title") or "Shartnoma"
        elif conv.get("order_id"):
            order = (
                supabase.table("orders")
                .select("services(title)")
                .eq("id", conv["order_id"])
                .single()
                .execute()
            )
            svc = (order.data or {}).get("services") or {}
            title = svc.get("title") or "Buyurtma"

        last_msg = (
            supabase.table("messages")
            .select("content, created_at, receiver_id, read_at")
            .eq("conversation_id", conv["id"])
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        unread = (
            supabase.table("messages")
            .select("id", count="exact")
            .eq("conversation_id", conv["id"])
            .eq("receiver_id", user_id)
            .is_("read_at", "null")
            .execute()
        )
        msg = (last_msg.data or [None])[0]
        enriched.append(
            {
                **conv,
                "other_user_id": other_id,
                "other_user_name": other_name,
                "title": title,
                "last_message": msg.get("content") if msg else None,
                "last_message_at": msg.get("created_at") if msg else None,
                "unread_count": int(unread.count or 0),
            }
        )
    return enriched


@router.get("/{conversation_id}/messages", response_model=list[ConversationMessageResponse])
def list_messages(
    conversation_id: str,
    auth: UserAuthDep,
    limit: int = Query(default=100, le=200),
    offset: int = Query(default=0, ge=0),
):
    supabase = auth.supabase
    conv = supabase.table("conversations").select("*").eq("id", conversation_id).single().execute()
    if not conv.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Suhbat topilmadi")
    _assert_participant(conv.data, auth.user_id)

    result = (
        supabase.table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data or []


@router.post("/{conversation_id}/messages", response_model=ConversationMessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(conversation_id: str, payload: ConversationMessageCreate, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    conv = supabase.table("conversations").select("*").eq("id", conversation_id).single().execute()
    if not conv.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Suhbat topilmadi")
    conversation = conv.data
    _assert_participant(conversation, user_id)

    receiver_id = next((p for p in conversation["participant_ids"] if p != user_id), None)
    if not receiver_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Qabul qiluvchi topilmadi")

    insert_data: dict = {
        "conversation_id": conversation_id,
        "sender_id": user_id,
        "receiver_id": receiver_id,
        "content": payload.content.strip(),
        "message_type": payload.message_type,
        "attachments": payload.attachments,
    }
    if conversation.get("order_id"):
        insert_data["order_id"] = conversation["order_id"]

    result = supabase.table("messages").insert(insert_data).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Xabar yuborilmadi")

    supabase.table("conversations").update({"updated_at": datetime.now(timezone.utc).isoformat()}).eq(
        "id", conversation_id
    ).execute()

    create_notification(
        supabase,
        user_id=receiver_id,
        type="message",
        title="Yangi xabar",
        body=payload.content[:120],
        href=f"/dashboard/messages?conversation={conversation_id}",
    )
    return result.data[0]


@router.post("/{conversation_id}/read")
def mark_conversation_read(conversation_id: str, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    conv = supabase.table("conversations").select("*").eq("id", conversation_id).single().execute()
    if not conv.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Suhbat topilmadi")
    _assert_participant(conv.data, user_id)

    now = datetime.now(timezone.utc).isoformat()
    supabase.table("messages").update({"read_at": now}).eq("conversation_id", conversation_id).eq(
        "receiver_id", user_id
    ).is_("read_at", "null").execute()
    return {"ok": True}


@router.get("/presence/me", response_model=PresenceResponse)
def get_my_presence(auth: UserAuthDep):
    supabase = auth.supabase
    result = supabase.table("user_presence").select("*").eq("user_id", auth.user_id).single().execute()
    if not result.data:
        return {"user_id": auth.user_id, "is_online": False, "last_seen_at": None, "typing_in": None}
    return result.data


@router.patch("/presence/me", response_model=PresenceResponse)
def update_my_presence(payload: PresenceUpdate, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    update_data: dict = {"last_seen_at": datetime.now(timezone.utc).isoformat()}
    if payload.is_online is not None:
        update_data["is_online"] = payload.is_online
    if payload.typing_in is not None:
        update_data["typing_in"] = payload.typing_in

    existing = supabase.table("user_presence").select("user_id").eq("user_id", user_id).execute()
    if existing.data:
        result = supabase.table("user_presence").update(update_data).eq("user_id", user_id).execute()
    else:
        result = supabase.table("user_presence").insert({"user_id": user_id, **update_data}).execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Presence yangilanmadi")
    return result.data[0]


@router.get("/presence/{user_id}", response_model=PresenceResponse)
def get_user_presence(user_id: str, auth: UserAuthDep):
    supabase = auth.supabase
    result = supabase.table("user_presence").select("*").eq("user_id", user_id).single().execute()
    if not result.data:
        return {"user_id": user_id, "is_online": False, "last_seen_at": None, "typing_in": None}
    return result.data
