"""Notification delivery helpers."""

from unittest.mock import MagicMock, patch

from app.notification_service import create_notification, deliver_notification_channels


def test_create_notification_skips_when_chat_muted():
    admin = MagicMock()
    with (
        patch("app.notification_service.get_supabase_admin", return_value=admin),
        patch("app.notification_service._load_user_contact", return_value=(None, None, None, {"chatMuted": True})),
    ):
        create_notification(
            None,
            user_id="user-1",
            type="message",
            title="Test",
            body="Hello",
        )
    admin.table.assert_not_called()


def test_deliver_broadcast_uses_promotions_email_gate():
    with (
        patch("app.notification_service._send_email") as email,
        patch("app.notification_service._send_telegram"),
        patch("app.notification_service._send_sms"),
    ):
        deliver_notification_channels("user-1", "Title", "Body", ntype="broadcast")
    email.assert_called_once_with("user-1", "Title", "Body", promotions=True)
