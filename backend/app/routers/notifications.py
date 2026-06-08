from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, status

from app.deps import UserAuthDep
from app.schemas import NotificationResponse
from app.schemas_notifications import NotificationMarkRead

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _read_ids_for_user(supabase, user_id: str) -> set[str]:
    try:
        result = (
            supabase.table("notification_reads")
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


def _db_notifications(supabase, user_id: str) -> list[dict]:
    try:
        result = (
            supabase.table("notifications")
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
    items: list[dict] = []

    orders_result = (
        supabase.table("orders")
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

    orders_for_msgs = (
        supabase.table("orders")
        .select("id")
        .or_(f"client_id.eq.{user_id},freelancer_id.eq.{user_id}")
        .execute()
    )
    order_ids = [o["id"] for o in (orders_for_msgs.data or [])]

    if order_ids:
        messages_result = (
            supabase.table("messages")
            .select("id, order_id, content, created_at, sender_id, read_at")
            .in_("order_id", order_ids)
            .eq("receiver_id", user_id)
            .order("created_at", desc=True)
            .limit(15)
            .execute()
        )
        for msg in messages_result.data or []:
            items.append(
                {
                    "id": f"message-{msg['id']}",
                    "type": "message",
                    "title": "notif_new_message",
                    "body": msg["content"][:120],
                    "created_at": msg["created_at"],
                    "href": f"/dashboard/messages?order={msg['order_id']}",
                    "unread": msg.get("read_at") is None,
                }
            )

    since = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    reviews_result = (
        supabase.table("reviews")
        .select("id, rating, comment, created_at, reviewer_id, profiles(full_name)")
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


@router.get("", response_model=list[NotificationResponse])
def list_notifications(auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    db_items = _db_notifications(supabase, user_id)
    synthetic = _synthetic_notifications(supabase, user_id)
    db_ids = {item["id"] for item in db_items}
    merged = db_items + [item for item in synthetic if item["id"] not in db_ids]
    merged.sort(key=lambda x: x["created_at"], reverse=True)
    read_ids = _read_ids_for_user(supabase, user_id)
    return _apply_read_state(merged[:30], read_ids)


@router.post("/mark-read", status_code=status.HTTP_204_NO_CONTENT)
def mark_notifications_read(payload: NotificationMarkRead, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    now = datetime.now(timezone.utc).isoformat()
    for nid in payload.ids:
        try:
            supabase.table("notifications").update({"read_at": now}).eq("id", nid).eq(
                "user_id", user_id
            ).execute()
        except Exception:
            pass
    rows = [{"user_id": user_id, "notification_id": nid} for nid in payload.ids]
    try:
        supabase.table("notification_reads").upsert(rows, on_conflict="user_id,notification_id").execute()
    except Exception:
        for row in rows:
            supabase.table("notification_reads").insert(row).execute()
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
        supabase.table("notification_reads").upsert(rows, on_conflict="user_id,notification_id").execute()
    except Exception:
        for row in rows:
            try:
                supabase.table("notification_reads").insert(row).execute()
            except Exception:
                pass
    return None
