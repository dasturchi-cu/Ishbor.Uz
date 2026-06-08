"""Bildirishnomalarni DB ga yozish (service role — boshqa user uchun insert)."""

import logging
from typing import Literal

import httpx

from app.config import settings
from app.database import get_supabase_admin

logger = logging.getLogger("ishbor.notifications")


def _send_email(user_id: str, subject: str, body: str) -> None:
    admin = get_supabase_admin()
    try:
        row = (
            admin.table("profiles")
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
        if not email:
            return

        api_key = settings.resend_api_key.strip()
        if api_key:
            response = httpx.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "from": settings.resend_from_email,
                    "to": [email],
                    "subject": subject,
                    "text": body,
                },
                timeout=10.0,
            )
            if response.status_code >= 400:
                logger.warning(
                    "Resend email failed status=%s to=%s body=%s",
                    response.status_code,
                    email,
                    response.text[:200],
                )
        else:
            logger.debug("[email-stub] to=%s subject=%s", email, subject)
    except Exception as exc:
        logger.warning("Email send error to=%s: %s", user_id, exc)


def create_notification(
    _supabase,
    *,
    user_id: str,
    type: Literal["order", "message", "review"],
    title: str,
    body: str,
    href: str | None = None,
) -> None:
    admin = get_supabase_admin()
    try:
        admin.table("notifications").insert(
            {
                "user_id": user_id,
                "type": type,
                "title": title,
                "body": body,
                "href": href,
            }
        ).execute()
        if type in ("order", "message"):
            _send_email(user_id, title, body)
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
