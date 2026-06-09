"""Conversation yaratish va boshqarish."""

from app.database import get_supabase_admin
from app.db_utils import run_query


def ensure_order_conversation(order: dict) -> dict | None:
    admin = get_supabase_admin()
    existing = (
        admin.table("conversations")
        .select("*")
        .eq("order_id", order["id"])
        .limit(1)
        .execute()
    )
    if existing.data:
        return existing.data[0]

    participants = [order["client_id"], order["freelancer_id"]]
    result = run_query(
        lambda: admin.table("conversations")
        .insert(
            {
                "type": "order",
                "order_id": order["id"],
                "participant_ids": participants,
            }
        )
        .execute()
    )
    return (result.data or [None])[0]


def ensure_contract_conversation(contract: dict) -> dict | None:
    admin = get_supabase_admin()
    existing = (
        admin.table("conversations")
        .select("*")
        .eq("contract_id", contract["id"])
        .limit(1)
        .execute()
    )
    if existing.data:
        return existing.data[0]

    participants = [contract["client_id"], contract["freelancer_id"]]
    result = run_query(
        lambda: admin.table("conversations")
        .insert(
            {
                "type": "contract",
                "contract_id": contract["id"],
                "project_id": contract.get("project_id"),
                "participant_ids": participants,
            }
        )
        .execute()
    )
    return (result.data or [None])[0]
