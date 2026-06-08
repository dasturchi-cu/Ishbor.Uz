"""Bildirishnomalarni DB ga yozish."""

from typing import Literal


def _maybe_send_email(supabase, user_id: str, subject: str, body: str) -> None:
    """Transactional email stub — prefs yoqilgan bo'lsa log (audit batch 4)."""
    try:
        row = (
            supabase.table("profiles")
            .select("email, notification_preferences")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
        if not row.data:
            return
        prefs = row.data[0].get("notification_preferences") or {}
        if not prefs.get("emailNewOrders", True):
            return
        email = row.data[0].get("email")
        if email:
            print(f"[email-stub] to={email} subject={subject} body={body[:80]}")
    except Exception:
        pass


def create_notification(
    supabase,
    *,
    user_id: str,
    type: Literal["order", "message", "review"],
    title: str,
    body: str,
    href: str | None = None,
) -> None:
    try:
        supabase.table("notifications").insert(
            {
                "user_id": user_id,
                "type": type,
                "title": title,
                "body": body,
                "href": href,
            }
        ).execute()
        if type in ("order", "message"):
            _maybe_send_email(supabase, user_id, title, body)
    except Exception:
        pass


def notify_order_status(
    supabase,
    *,
    order: dict,
    new_status: str,
    service_title: str | None = None,
) -> None:
    title = service_title or "Buyurtma"
    order_id = order["id"]
    href = f"/dashboard/orders/{order_id}"
    client_id = order["client_id"]
    freelancer_id = order["freelancer_id"]

    if new_status == "pending":
        create_notification(
            supabase,
            user_id=freelancer_id,
            type="order",
            title=title,
            body="Yangi buyurtma keldi",
            href=href,
        )
    elif new_status == "active":
        create_notification(
            supabase,
            user_id=client_id,
            type="order",
            title=title,
            body="Buyurtma qabul qilindi",
            href=href,
        )
    elif new_status == "delivered":
        create_notification(
            supabase,
            user_id=client_id,
            type="order",
            title=title,
            body="Buyurtma yetkazildi — tasdiqlang",
            href=href,
        )
    elif new_status == "disputed":
        create_notification(
            supabase,
            user_id=freelancer_id,
            type="order",
            title=title,
            body="Buyurtmada nizo ochildi",
            href=href,
        )
    elif new_status == "completed":
        for uid in (client_id, freelancer_id):
            create_notification(
                supabase,
                user_id=uid,
                type="order",
                title=title,
                body="Buyurtma yakunlandi",
                href=href,
            )
    elif new_status == "cancelled":
        for uid in (client_id, freelancer_id):
            create_notification(
                supabase,
                user_id=uid,
                type="order",
                title=title,
                body="Buyurtma bekor qilindi",
                href=href,
            )
