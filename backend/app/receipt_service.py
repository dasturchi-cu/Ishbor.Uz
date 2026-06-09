"""Payment receipt PDF generation and email delivery."""

from __future__ import annotations

import io
import logging
from datetime import datetime, timezone
from typing import Any

import httpx

from app.config import settings
from app.database import get_supabase_admin
from app.db_utils import run_query

logger = logging.getLogger("ishbor.receipts")


def _generate_receipt_number(order_id: str) -> str:
    ts = datetime.now(timezone.utc).strftime("%Y%m%d")
    return f"ISH-{ts}-{order_id[:8].upper()}"


def _build_pdf_bytes(
    *,
    receipt_number: str,
    order_id: str,
    amount: int,
    provider: str,
    client_name: str,
    service_title: str,
) -> bytes:
    try:
        from fpdf import FPDF  # type: ignore[import-untyped]
    except ImportError:
        lines = [
            "IshBor.uz — To'lov kvitansiyasi",
            f"Kvitansiya: {receipt_number}",
            f"Buyurtma: {order_id}",
            f"Xizmat: {service_title}",
            f"Mijoz: {client_name}",
            f"Summa: {amount:,} so'm".replace(",", " "),
            f"Provayder: {provider}",
            f"Sana: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        ]
        return "\n".join(lines).encode("utf-8")

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", size=14)
    pdf.cell(0, 10, "IshBor.uz - To'lov kvitansiyasi", ln=True)
    pdf.set_font("Helvetica", size=11)
    for label, value in [
        ("Kvitansiya", receipt_number),
        ("Buyurtma ID", order_id),
        ("Xizmat", service_title[:80]),
        ("Mijoz", client_name[:60]),
        ("Summa", f"{amount:,} so'm".replace(",", " ")),
        ("Provayder", provider),
        ("Sana", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")),
    ]:
        pdf.cell(0, 8, f"{label}: {value}", ln=True)
    out = pdf.output()
    return out if isinstance(out, bytes) else out.encode("latin-1", errors="replace")


def _send_receipt_email(email: str, receipt_number: str, amount: int, service_title: str) -> bool:
    api_key = settings.resend_api_key.strip()
    if not api_key or not email:
        return False
    body = (
        f"To'lovingiz qabul qilindi.\n\n"
        f"Kvitansiya: {receipt_number}\n"
        f"Xizmat: {service_title}\n"
        f"Summa: {amount:,} so'm\n\n"
        f"Dashboard: {settings.cors_origin_list[0] if settings.cors_origin_list else ''}/dashboard/payments"
    ).replace(",", " ")
    try:
        resp = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "from": settings.resend_from_email,
                "to": [email],
                "subject": f"IshBor.uz kvitansiya {receipt_number}",
                "text": body,
            },
            timeout=12.0,
        )
        return resp.status_code < 400
    except Exception as exc:
        logger.warning("Receipt email failed: %s", exc)
        return False


def create_payment_receipt(
    order: dict[str, Any],
    *,
    provider: str,
    provider_ref: str | None = None,
    send_email: bool = True,
) -> dict[str, Any] | None:
    admin = get_supabase_admin()
    order_id = order["id"]
    existing = run_query(
        lambda: admin.table("payment_receipts")
        .select("id")
        .eq("order_id", order_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        return existing.data[0]

    client_id = order["client_id"]
    amount = int(order.get("amount") or 0)
    if amount <= 0:
        return None

    profile = run_query(
        lambda: admin.table("profiles")
        .select("full_name, email")
        .eq("id", client_id)
        .limit(1)
        .execute()
    )
    client_name = (profile.data or [{}])[0].get("full_name") or "Mijoz"
    client_email = (profile.data or [{}])[0].get("email")

    service_title = "Xizmat"
    if order.get("service_id"):
        svc = run_query(
            lambda: admin.table("services")
            .select("title")
            .eq("id", order["service_id"])
            .limit(1)
            .execute()
        )
        if svc.data:
            service_title = svc.data[0].get("title") or service_title

    receipt_number = _generate_receipt_number(order_id)
    pdf_bytes = _build_pdf_bytes(
        receipt_number=receipt_number,
        order_id=order_id,
        amount=amount,
        provider=provider,
        client_name=client_name,
        service_title=service_title,
    )
    storage_path = f"receipts/{order_id}/{receipt_number}.pdf"
    try:
        admin.storage.from_("project-attachments").upload(
            storage_path,
            pdf_bytes,
            {"content-type": "application/pdf", "upsert": "true"},
        )
    except Exception as exc:
        logger.warning("Receipt upload failed, storing metadata only: %s", exc)
        storage_path = None

    emailed_at = None
    if send_email and client_email and _send_receipt_email(client_email, receipt_number, amount, service_title):
        emailed_at = datetime.now(timezone.utc).isoformat()

    ins = run_query(
        lambda: admin.table("payment_receipts")
        .insert(
            {
                "order_id": order_id,
                "client_id": client_id,
                "receipt_number": receipt_number,
                "amount": amount,
                "provider": provider,
                "provider_ref": provider_ref,
                "pdf_storage_path": storage_path,
                "emailed_at": emailed_at,
            }
        )
        .execute()
    )
    return (ins.data or [None])[0]
