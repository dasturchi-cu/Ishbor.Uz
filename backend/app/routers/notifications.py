from datetime import datetime, timedelta, timezone
import re

from fastapi import APIRouter, Header, HTTPException, Request, status

from app.config import settings
from app.database import get_supabase_admin
from app.db_utils import run_query
from app.deps import UserAuthDep
from app.schemas_notifications import NotificationMarkRead, NotificationResponse
from app.postgrest_embed import REVIEW_REVIEWER_PROFILE
from app.telegram_link_service import create_telegram_link_token, verify_telegram_link_token

router = APIRouter(prefix="/notifications", tags=["notifications"])

_VALID_NOTIFICATION_TYPES = frozenset({"order", "message", "review", "broadcast"})

_UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
    re.I,
)


@router.get("/channels")
def notification_channels():
    username = settings.telegram_bot_username.strip().lstrip("@") or None
    return {
        "email": bool(settings.resend_api_key.strip()),
        "sms": settings.sms_enabled,
        "telegram": settings.telegram_enabled,
        "telegram_bot_username": username,
        "redis": settings.redis_enabled,
    }


@router.get("/telegram/link-token")
def telegram_link_token(auth: UserAuthDep):
    if not settings.telegram_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Telegram sozlanmagan",
        )
    return {"token": create_telegram_link_token(auth.user_id)}


@router.post("/telegram/webhook")
async def telegram_webhook(
    request: Request,
    x_telegram_bot_api_secret_token: str | None = Header(default=None),
):
    secret = settings.telegram_webhook_secret.strip()
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Telegram webhook sozlanmagan",
        )
    if x_telegram_bot_api_secret_token != secret:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    try:
        payload = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON") from exc

    message = payload.get("message") or payload.get("edited_message") or {}
    text = (message.get("text") or "").strip()
    chat = message.get("chat") or {}
    chat_id = chat.get("id")
    if not text.startswith("/start") or chat_id is None:
        return {"ok": True}

    parts = text.split(maxsplit=1)
    if len(parts) < 2:
        return {"ok": True}

    user_id = verify_telegram_link_token(parts[1].strip())
    if not user_id:
        return {"ok": True}

    admin = get_supabase_admin()
    existing = run_query(
        lambda: admin.table("profiles")
        .select("telegram_chat_id")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    rows = existing.data or []
    if not rows:
        return {"ok": True}
    linked = rows[0].get("telegram_chat_id")
    if linked and str(linked) != str(chat_id):
        return {"ok": True}

    run_query(
        lambda: admin.table("profiles")
        .update({"telegram_chat_id": str(chat_id)})
        .eq("id", user_id)
        .execute()
    )
    return {"ok": True}


def _read_ids_for_user(supabase, user_id: str) -> set[str]:
    try:
        result = run_query(
            lambda: supabase.table("notification_reads")
            .select("notification_id")
            .eq("user_id", user_id)
            .execute()
        )
        return {row["notification_id"] for row in (result.data or [])}
    except Exception:
        return set()


def _dismissed_ids_for_user(supabase, user_id: str) -> set[str]:
    try:
        result = run_query(
            lambda: supabase.table("notification_dismissals")
            .select("notification_id")
            .eq("user_id", user_id)
            .execute()
        )
        return {row["notification_id"] for row in (result.data or [])}
    except Exception:
        return set()


def _apply_read_state(items: list[dict], read_ids: set[str]) -> list[dict]:
    for item in items:
        if item["id"] in read_ids:
            item["unread"] = False
    return items


def _sanitize_notification_item(item: dict) -> dict | None:
    ntype = item.get("type")
    if ntype not in _VALID_NOTIFICATION_TYPES:
        return None
    created_at = item.get("created_at")
    if created_at is None:
        return None
    return {
        "id": str(item["id"]),
        "type": ntype,
        "title": str(item.get("title") or ""),
        "body": str(item.get("body") or ""),
        "created_at": created_at,
        "href": item.get("href"),
        "unread": bool(item.get("unread", True)),
    }


def _db_notifications(supabase, user_id: str) -> list[dict]:
    try:
        result = run_query(
            lambda: supabase.table("notifications")
            .select("id, type, title, body, href, read_at, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(30)
            .execute()
        )
        items: list[dict] = []
        for row in result.data or []:
            items.append(
                {
                    "id": str(row["id"]),
                    "type": row["type"],
                    "title": row["title"],
                    "body": row["body"],
                    "created_at": row["created_at"],
                    "href": row.get("href"),
                    "unread": row.get("read_at") is None,
                }
            )
        return items
    except Exception:
        return []


def _synthetic_notifications(supabase, user_id: str) -> list[dict]:
    try:
        return _build_synthetic_notifications(supabase, user_id)
    except Exception:
        return []


def _build_synthetic_notifications(supabase, user_id: str) -> list[dict]:
    items: list[dict] = []

    orders_result = run_query(
        lambda: supabase.table("orders")
        .select("id, status, created_at, updated_at, client_id, freelancer_id, services(title)")
        .or_(f"client_id.eq.{user_id},freelancer_id.eq.{user_id}")
        .in_("status", ["pending", "delivered", "completed"])
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )

    for order in orders_result.data or []:
        title = (order.get("services") or {}).get("title") or "Buyurtma"
        status = order["status"]
        is_freelancer = order["freelancer_id"] == user_id

        if status == "pending" and is_freelancer:
            items.append(
                {
                    "id": f"order-{order['id']}-pending",
                    "type": "order",
                    "title": title,
                    "body": "notif_order_pending",
                    "created_at": order["created_at"],
                    "href": f"/dashboard/orders/{order['id']}",
                    "unread": True,
                }
            )
        elif status == "delivered" and not is_freelancer:
            items.append(
                {
                    "id": f"order-{order['id']}-delivered",
                    "type": "order",
                    "title": title,
                    "body": "notif_order_delivered",
                    "created_at": order.get("updated_at") or order["created_at"],
                    "href": f"/dashboard/orders/{order['id']}",
                    "unread": True,
                }
            )
        elif status == "completed":
            items.append(
                {
                    "id": f"order-{order['id']}-completed",
                    "type": "order",
                    "title": title,
                    "body": "notif_order_completed",
                    "created_at": order.get("updated_at") or order["created_at"],
                    "href": f"/dashboard/orders/{order['id']}",
                    "unread": False,
                }
            )

    orders_for_msgs = run_query(
        lambda: supabase.table("orders")
        .select("id")
        .or_(f"client_id.eq.{user_id},freelancer_id.eq.{user_id}")
        .execute()
    )
    order_ids = [o["id"] for o in (orders_for_msgs.data or [])]

    if order_ids:
        messages_result = run_query(
            lambda: supabase.table("messages")
            .select("id, order_id, content, created_at, sender_id, read_at")
            .in_("order_id", order_ids)
            .eq("receiver_id", user_id)
            .order("created_at", desc=True)
            .limit(15)
            .execute()
        )
        for msg in messages_result.data or []:
            content = str(msg.get("content") or "")
            items.append(
                {
                    "id": f"message-{msg['id']}",
                    "type": "message",
                    "title": "notif_new_message",
                    "body": content[:120],
                    "created_at": msg["created_at"],
                    "href": f"/dashboard/messages?order={msg['order_id']}",
                    "unread": msg.get("read_at") is None,
                }
            )

    since = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    reviews_result = run_query(
        lambda: supabase.table("reviews")
        .select(f"id, rating, comment, created_at, reviewer_id, {REVIEW_REVIEWER_PROFILE}(full_name)")
        .eq("freelancer_id", user_id)
        .gte("created_at", since)
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )
    for review in reviews_result.data or []:
        author = (review.get("profiles") or {}).get("full_name") or "Mijoz"
        items.append(
            {
                "id": f"review-{review['id']}",
                "type": "review",
                "title": f"{author} — {review['rating']}★",
                "body": (review.get("comment") or "Yangi sharh")[:120],
                "created_at": review["created_at"],
                "href": "/dashboard/reviews",
                "unread": True,
            }
        )

    items.sort(key=lambda x: x["created_at"], reverse=True)
    return items


def _notification_dedupe_key(item: dict) -> str:
    href = item.get("href")
    if href:
        return f"href:{href}"
    return f"id:{item['id']}"


def _merge_notification_items(db_items: list[dict], synthetic: list[dict]) -> list[dict]:
    seen_ids = {item["id"] for item in db_items}
    seen_keys = {_notification_dedupe_key(item) for item in db_items}
    merged = list(db_items)
    for item in synthetic:
        if item["id"] in seen_ids:
            continue
        key = _notification_dedupe_key(item)
        if key in seen_keys:
            continue
        merged.append(item)
        seen_ids.add(item["id"])
        seen_keys.add(key)
    merged.sort(key=lambda x: x["created_at"], reverse=True)
    return merged


@router.get("", response_model=list[NotificationResponse])
def list_notifications(auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    db_items = _db_notifications(supabase, user_id)
    synthetic = _synthetic_notifications(supabase, user_id)
    merged = _merge_notification_items(db_items, synthetic)
    dismissed_ids = _dismissed_ids_for_user(supabase, user_id)
    merged = [item for item in merged if item["id"] not in dismissed_ids]
    sanitized = [_sanitize_notification_item(item) for item in merged]
    merged = [item for item in sanitized if item is not None]
    read_ids = _read_ids_for_user(supabase, user_id)
    items = _apply_read_state(merged[:30], read_ids)
    return [NotificationResponse.model_validate(item) for item in items]


@router.post("/mark-read", status_code=status.HTTP_204_NO_CONTENT)
def mark_notifications_read(payload: NotificationMarkRead, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    now = datetime.now(timezone.utc).isoformat()
    for nid in payload.ids:
        try:
            run_query(
                lambda nid=nid: supabase.table("notifications")
                .update({"read_at": now})
                .eq("id", nid)
                .eq("user_id", user_id)
                .execute()
            )
        except Exception:
            pass
    rows = [{"user_id": user_id, "notification_id": nid} for nid in payload.ids]
    try:
        run_query(
            lambda: supabase.table("notification_reads")
            .upsert(rows, on_conflict="user_id,notification_id")
            .execute()
        )
    except Exception:
        for row in rows:
            run_query(lambda row=row: supabase.table("notification_reads").insert(row).execute())
    return None


@router.post("/dismiss", status_code=status.HTTP_204_NO_CONTENT)
def dismiss_notifications(payload: NotificationMarkRead, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    rows = [{"user_id": user_id, "notification_id": nid} for nid in payload.ids]
    if rows:
        try:
            run_query(
                lambda: supabase.table("notification_dismissals")
                .upsert(rows, on_conflict="user_id,notification_id")
                .execute()
            )
        except Exception:
            for row in rows:
                try:
                    run_query(
                        lambda row=row: supabase.table("notification_dismissals").insert(row).execute()
                    )
                except Exception:
                    pass
    for nid in payload.ids:
        if _UUID_RE.match(nid):
            try:
                run_query(
                    lambda nid=nid: supabase.table("notifications")
                    .delete()
                    .eq("id", nid)
                    .eq("user_id", user_id)
                    .execute()
                )
            except Exception:
                pass
    return None


@router.post("/mark-all-read", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_notifications_read(auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    items = list_notifications(auth)
    if not items:
        return None
    rows = [{"user_id": user_id, "notification_id": item["id"]} for item in items]
    try:
        run_query(
            lambda: supabase.table("notification_reads")
            .upsert(rows, on_conflict="user_id,notification_id")
            .execute()
        )
    except Exception:
        for row in rows:
            try:
                run_query(lambda row=row: supabase.table("notification_reads").insert(row).execute())
            except Exception:
                pass
    return None
