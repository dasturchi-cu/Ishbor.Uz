"""Fraud detection: off-platform payments, contact leaks."""

from __future__ import annotations

import re
from typing import Any

from app.database import get_supabase_admin
from app.platform_services import log_fraud

_OFF_PLATFORM_PATTERNS: list[tuple[str, str]] = [
    (r"(?i)\b(click|payme|paym|uzcard|humo)\b.*\b(tashqar|tashqarida|off.?platform|naqd|naqd pul)\b", "off_platform_payment"),
    (r"(?i)\btelegram\b.*\b(to['']?la|to'lov|pul)\b", "off_platform_payment"),
    (r"(?i)\b(bank|karta|card)\s*(raqam|number|#)\b", "off_platform_payment"),
    (r"(?i)\b(\+998|998)[\s\-]?\d{2}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}\b", "contact_leak"),
    (r"(?i)\b@[\w]{4,}\b.*\b(telegram|tg|instagram|insta)\b", "contact_leak"),
    (r"(?i)https?://(t\.me|telegram\.me|wa\.me|instagram\.com)/", "contact_leak"),
]


def scan_message_content(content: str) -> list[tuple[str, str]]:
    hits: list[tuple[str, str]] = []
    text = (content or "").strip()
    if not text:
        return hits
    for pattern, flag_type in _OFF_PLATFORM_PATTERNS:
        m = re.search(pattern, text)
        if m:
            hits.append((flag_type, m.group(0)[:120]))
    return hits


def flag_message_if_risky(
    *,
    message_id: str,
    order_id: str | None,
    sender_id: str,
    content: str,
) -> list[dict[str, Any]]:
    admin = get_supabase_admin()
    created: list[dict[str, Any]] = []
    for flag_type, matched in scan_message_content(content):
        row = {
            "message_id": message_id,
            "order_id": order_id,
            "sender_id": sender_id,
            "flag_type": flag_type,
            "matched_pattern": matched,
            "content_snippet": content[:200],
        }
        try:
            ins = admin.table("message_compliance_flags").insert(row).execute()
            if ins.data:
                created.append(ins.data[0])
        except Exception:
            continue
        log_fraud(
            user_id=sender_id,
            fraud_type=flag_type,
            severity="medium" if flag_type == "contact_leak" else "high",
            details={"message_id": message_id, "order_id": order_id, "matched": matched},
        )
    return created
