"""Bildirishnomalarni DB ga yozish (service role — boshqa user uchun insert)."""

import logging
from typing import Literal

import httpx

from app.config import settings
from app.database import get_supabase_admin
from app.sms_service import send_sms
from app.telegram_service import send_telegram

logger = logging.getLogger("ishbor.notifications")

DEFAULT_PREFS = {
    "emailNewOrders": True,
    "emailPromotions": False,
    "smsUrgent": False,
    "telegramConnect": False,
    "chatMuted": False,
}


def _load_user_contact(user_id: str) -> tuple[str | None, str | None, str | None, dict]:
    admin = get_supabase_admin()
    row = (
        admin.table("profiles")
        .select("email, phone, telegram_chat_id, notification_preferences")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    if not row.data:
        return None, None, None, DEFAULT_PREFS
    data = row.data[0]
    prefs = {**DEFAULT_PREFS, **(data.get("notification_preferences") or {})}
    return data.get("email"), data.get("phone"), data.get("telegram_chat_id"), prefs


def _send_email(user_id: str, subject: str, body: str, *, promotions: bool = False) -> None:
    try:
        email, _, _, prefs = _load_user_contact(user_id)
        if promotions:
            if not prefs.get("emailPromotions", False):
                return
        elif not prefs.get("emailNewOrders", True):
            return
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


def _send_sms(user_id: str, body: str) -> None:
    try:
        _, phone, _, prefs = _load_user_contact(user_id)
        if not prefs.get("smsUrgent", False):
            return
        if not phone:
            logger.debug("SMS skipped no phone user=%s", user_id)
            return
        send_sms(phone, body)
    except Exception as exc:
        logger.warning("SMS send error to=%s: %s", user_id, exc)


def deliver_notification_channels(
    user_id: str,
    title: str,
    body: str,
    *,
    ntype: Literal["order", "message", "review", "broadcast"],
    urgent: bool = False,
) -> None:
    """Email / SMS / Telegram — in-app row must already exist (or be synthetic)."""
    if ntype in ("order", "message", "review", "broadcast"):
        _send_email(user_id, title, body, promotions=ntype == "broadcast")
    if urgent and ntype in ("order", "message"):
        _send_sms(user_id, f"{title}: {body}")
    if ntype in ("order", "message", "review", "broadcast"):
        _send_telegram(user_id, f"{title}\n{body}")


def _send_telegram(user_id: str, body: str) -> None:
    try:
        _, _, chat_id, prefs = _load_user_contact(user_id)
        if not prefs.get("telegramConnect", False):
            return
        if not chat_id:
            logger.debug("Telegram skipped no chat_id user=%s", user_id)
            return
        send_telegram(str(chat_id), body)
    except Exception as exc:
        logger.warning("Telegram send error to=%s: %s", user_id, exc)


def create_notification(
    _supabase,
    *,
    user_id: str,
    type: Literal["order", "message", "review", "broadcast"],
    title: str,
    body: str,
    href: str | None = None,
    urgent: bool = False,
) -> None:
    if type == "message":
        _, _, _, prefs = _load_user_contact(user_id)
        if prefs.get("chatMuted"):
            return

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
        deliver_notification_channels(user_id, title, body, ntype=type, urgent=urgent)
    except Exception as exc:
        logger.warning("create_notification failed user=%s type=%s: %s", user_id, type, exc)


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
    urgent = new_status in ("pending", "delivered", "disputed")

    if new_status == "pending":
        create_notification(
            supabase,
            user_id=freelancer_id,
            type="order",
            title=title,
            body="Yangi buyurtma keldi",
            href=href,
            urgent=True,
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
            urgent=True,
        )
    elif new_status == "disputed":
        create_notification(
            supabase,
            user_id=freelancer_id,
            type="order",
            title=title,
            body="Buyurtmada nizo ochildi",
            href=href,
            urgent=True,
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
                urgent=urgent,
            )
