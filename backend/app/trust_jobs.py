"""Background trust & escrow maintenance jobs."""

from __future__ import annotations

import logging
from typing import Any

from app.database import get_supabase_admin
from app.db_utils import run_query
from app.notification_service import create_notification
from app.platform_services import log_fraud, refresh_reputation

logger = logging.getLogger("ishbor.trust_jobs")


def run_escrow_auto_release() -> dict[str, Any]:
    admin = get_supabase_admin()
    try:
        result = admin.rpc("auto_release_escrow_orders").execute()
        count = int(result.data) if result.data is not None else 0
    except Exception as exc:
        logger.exception("auto_release_escrow_orders failed: %s", exc)
        return {"released": 0, "error": str(exc)}

    if count > 0:
        completed = run_query(
            lambda: admin.table("orders")
            .select("id, client_id, freelancer_id, service_id")
            .eq("auto_released", True)
            .order("updated_at", desc=True)
            .limit(count)
            .execute()
        )
        for order in completed.data or []:
            refresh_reputation(order["freelancer_id"])
            create_notification(
                admin,
                user_id=order["client_id"],
                type="order",
                title="Buyurtma avtomatik yakunlandi",
                body="3 kun ichida javob berilmadi — to'lov freelancer ga o'tkazildi",
                href=f"/dashboard/orders/{order['id']}",
            )
            create_notification(
                admin,
                user_id=order["freelancer_id"],
                type="payment",
                title="Escrow avtomatik chiqarildi",
                body="Mijoz tasdiqlamagan buyurtma muddati tugadi",
                href=f"/dashboard/orders/{order['id']}",
            )

    return {"released": count}


def run_dispute_sla_check() -> dict[str, Any]:
    admin = get_supabase_admin()
    try:
        result = admin.rpc("process_dispute_sla_breaches").execute()
        breached = int(result.data) if result.data is not None else 0
    except Exception as exc:
        logger.exception("process_dispute_sla_breaches failed: %s", exc)
        return {"breached": 0, "error": str(exc)}

    if breached > 0:
        open_disputes = run_query(
            lambda: admin.table("disputes")
            .select("id, contract_id, opened_by")
            .eq("sla_breached", True)
            .in_("status", ["open", "responded", "under_review"])
            .order("updated_at", desc=True)
            .limit(breached)
            .execute()
        )
        for d in open_disputes.data or []:
            log_fraud(
                user_id=d.get("opened_by"),
                fraud_type="dispute_sla_breach",
                severity="high",
                details={"dispute_id": d["id"], "contract_id": d["contract_id"]},
            )

    return {"breached": breached}


def run_all_trust_jobs() -> dict[str, Any]:
    escrow = run_escrow_auto_release()
    sla = run_dispute_sla_check()
    return {"escrow_auto_release": escrow, "dispute_sla": sla}
