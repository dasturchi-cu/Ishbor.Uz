from datetime import datetime, timezone



from fastapi import APIRouter, HTTPException, Query, status



from app.database import get_supabase_admin
from app.db_utils import run_query

from app.deps import UserAuthDep

from app.notification_service import create_notification
from app.platform_services import track_analytics_event

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


def _enrich_conversations_batch(supabase, user_id: str, conversations: list[dict]) -> list[dict]:
    """N+1 oldini olish: profil, shartnoma, xabar statistikasi batch."""
    if not conversations:
        return []

    conv_ids = [c["id"] for c in conversations]
    other_ids: list[str] = []
    contract_ids: list[str] = []
    order_ids: list[str] = []

    for conv in conversations:
        participants = conv.get("participant_ids") or []
        other_id = next((p for p in participants if p != user_id), None)
        if other_id:
            other_ids.append(other_id)
        if conv.get("contract_id"):
            contract_ids.append(conv["contract_id"])
        if conv.get("order_id"):
            order_ids.append(conv["order_id"])

    profiles_map: dict[str, str] = {}
    if other_ids:
        prof_res = run_query(
            lambda: get_supabase_admin()
            .table("participant_profiles")
            .select("id, full_name")
            .in_("id", list(set(other_ids)))
            .execute()
        )
        profiles_map = {
            p["id"]: p.get("full_name") or "Foydalanuvchi" for p in (prof_res.data or [])
        }

    contracts_map: dict[str, str] = {}
    if contract_ids:
        con_res = run_query(
            lambda: supabase.table("contracts")
            .select("id, title")
            .in_("id", list(set(contract_ids)))
            .execute()
        )
        contracts_map = {c["id"]: c.get("title") or "Shartnoma" for c in (con_res.data or [])}

    orders_map: dict[str, str] = {}
    if order_ids:
        ord_res = run_query(
            lambda: supabase.table("orders")
            .select("id, services(title)")
            .in_("id", list(set(order_ids)))
            .execute()
        )
        for row in ord_res.data or []:
            svc = row.get("services") or {}
            orders_map[row["id"]] = svc.get("title") or "Buyurtma"

    last_by_conv: dict[str, dict] = {}
    if conv_ids:
        msg_res = run_query(
            lambda: supabase.table("messages")
            .select("conversation_id, content, created_at")
            .in_("conversation_id", conv_ids)
            .order("created_at", desc=True)
            .execute()
        )
        for msg in msg_res.data or []:
            cid = msg.get("conversation_id")
            if cid and cid not in last_by_conv:
                last_by_conv[cid] = msg

    unread_by_conv: dict[str, int] = {}
    if conv_ids:
        unread_res = run_query(
            lambda: supabase.table("messages")
            .select("conversation_id")
            .in_("conversation_id", conv_ids)
            .eq("receiver_id", user_id)
            .is_("read_at", "null")
            .execute()
        )
        for row in unread_res.data or []:
            cid = row.get("conversation_id")
            if cid:
                unread_by_conv[cid] = unread_by_conv.get(cid, 0) + 1

    enriched: list[dict] = []
    for conv in conversations:
        other_id = next((p for p in (conv.get("participant_ids") or []) if p != user_id), None)
        title = ""
        if conv.get("contract_id"):
            title = contracts_map.get(conv["contract_id"], "Shartnoma")
        elif conv.get("order_id"):
            title = orders_map.get(conv["order_id"], "Buyurtma")

        msg = last_by_conv.get(conv["id"])
        enriched.append(
            {
                **conv,
                "other_user_id": other_id,
                "other_user_name": profiles_map.get(other_id, "Foydalanuvchi")
                if other_id
                else "Foydalanuvchi",
                "title": title,
                "last_message": msg.get("content") if msg else None,
                "last_message_at": msg.get("created_at") if msg else None,
                "unread_count": unread_by_conv.get(conv["id"], 0),
            }
        )
    return enriched


def _dedupe_order_contract_threads(supabase, conversations: list[dict]) -> list[dict]:
    """Mavjud DB: contract+order juftligi uchun order threadni yashirish."""
    contract_ids = [c["contract_id"] for c in conversations if c.get("contract_id")]
    linked_order_ids: set[str] = set()
    if contract_ids:
        con_res = run_query(
            lambda: supabase.table("contracts")
            .select("order_id")
            .in_("id", list(set(contract_ids)))
            .execute()
        )
        for row in con_res.data or []:
            oid = row.get("order_id")
            if oid:
                linked_order_ids.add(oid)

    order_ids = [c["order_id"] for c in conversations if c.get("order_id")]
    if order_ids:
        ord_res = run_query(
            lambda: supabase.table("orders")
            .select("id, contract_id")
            .in_("id", list(set(order_ids)))
            .execute()
        )
        for row in ord_res.data or []:
            if row.get("contract_id"):
                linked_order_ids.add(row["id"])

    if not linked_order_ids:
        return conversations

    return [c for c in conversations if c.get("order_id") not in linked_order_ids]


@router.get("", response_model=list[ConversationThreadResponse])

def list_conversations(

    auth: UserAuthDep,

    limit: int = Query(default=50, le=100),

    offset: int = Query(default=0, ge=0),

):

    user_id = auth.user_id

    supabase = auth.supabase



    result = run_query(

        lambda: supabase.table("conversations")

        .select("*")

        .contains("participant_ids", [user_id])

        .order("updated_at", desc=True)

        .range(offset, offset + limit - 1)

        .execute()

    )

    raw = result.data or []
    deduped = _dedupe_order_contract_threads(supabase, raw)
    return _enrich_conversations_batch(supabase, user_id, deduped)





@router.get("/{conversation_id}/messages", response_model=list[ConversationMessageResponse])

def list_messages(

    conversation_id: str,

    auth: UserAuthDep,

    limit: int = Query(default=100, le=200),

    offset: int = Query(default=0, ge=0),

):

    supabase = auth.supabase

    conv = run_query(

        lambda: supabase.table("conversations")

        .select("*")

        .eq("id", conversation_id)

        .single()

        .execute()

    )

    if not conv.data:

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Suhbat topilmadi")

    _assert_participant(conv.data, auth.user_id)



    result = run_query(

        lambda: supabase.table("messages")

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

    conv = run_query(

        lambda: supabase.table("conversations")

        .select("*")

        .eq("id", conversation_id)

        .single()

        .execute()

    )

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

    prior_messages = run_query(
        lambda: supabase.table("messages")
        .select("id", count="exact")
        .eq("conversation_id", conversation_id)
        .limit(1)
        .execute()
    )
    is_first_message = (prior_messages.count or 0) == 0

    result = run_query(lambda: supabase.table("messages").insert(insert_data).execute())

    if not result.data:

        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Xabar yuborilmadi")



    run_query(

        lambda: supabase.table("conversations")

        .update({"updated_at": datetime.now(timezone.utc).isoformat()})

        .eq("id", conversation_id)

        .execute()

    )



    create_notification(

        supabase,

        user_id=receiver_id,

        type="message",

        title="Yangi xabar",

        body=payload.content[:120],

        href=f"/dashboard/messages?conversation={conversation_id}",

    )

    if is_first_message:
        track_analytics_event(
            "message_started",
            user_id=user_id,
            properties={
                "conversation_id": conversation_id,
                "order_id": conversation.get("order_id"),
            },
        )

    return result.data[0]





@router.post("/{conversation_id}/read")

def mark_conversation_read(conversation_id: str, auth: UserAuthDep):

    user_id = auth.user_id

    supabase = auth.supabase

    conv = run_query(

        lambda: supabase.table("conversations")

        .select("*")

        .eq("id", conversation_id)

        .single()

        .execute()

    )

    if not conv.data:

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Suhbat topilmadi")

    _assert_participant(conv.data, user_id)



    now = datetime.now(timezone.utc).isoformat()

    run_query(

        lambda: supabase.table("messages")

        .update({"read_at": now})

        .eq("conversation_id", conversation_id)

        .eq("receiver_id", user_id)

        .is_("read_at", "null")

        .execute()

    )

    return {"ok": True}





@router.get("/presence/me", response_model=PresenceResponse)

def get_my_presence(auth: UserAuthDep):

    supabase = auth.supabase

    result = run_query(

        lambda: supabase.table("user_presence")

        .select("*")

        .eq("user_id", auth.user_id)

        .single()

        .execute()

    )

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



    existing = run_query(

        lambda: supabase.table("user_presence").select("user_id").eq("user_id", user_id).execute()

    )

    if existing.data:

        result = run_query(

            lambda: supabase.table("user_presence")

            .update(update_data)

            .eq("user_id", user_id)

            .execute()

        )

    else:

        result = run_query(

            lambda: supabase.table("user_presence")

            .insert({"user_id": user_id, **update_data})

            .execute()

        )

    if not result.data:

        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Presence yangilanmadi")

    return result.data[0]





@router.get("/presence/{user_id}", response_model=PresenceResponse)
def get_user_presence(user_id: str, auth: UserAuthDep):
    supabase = auth.supabase
    if user_id != auth.user_id:
        conv = run_query(
            lambda: supabase.table("conversations")
            .select("participant_ids")
            .contains("participant_ids", [auth.user_id])
            .execute()
        )
        has_shared = any(
            user_id in (row.get("participant_ids") or [])
            for row in (conv.data or [])
        )
        if not has_shared:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Faqat suhbat ishtirokchilari mavjudlikni ko'ra oladi",
            )

    result = run_query(
        lambda: supabase.table("user_presence")
        .select("*")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        return {"user_id": user_id, "is_online": False, "last_seen_at": None, "typing_in": None}
    return result.data


