"""Contract yaratish (hire flow)."""

from datetime import date, timedelta

from app.conversation_service import ensure_contract_conversation, ensure_order_conversation
from app.database import get_supabase_admin
from app.db_utils import run_query


def create_contract_from_proposal(proposal: dict, project: dict) -> dict:
    admin = get_supabase_admin()
    amount = int(proposal.get("proposed_budget") or project.get("budget") or 0)
    deadline_days = int(proposal.get("proposed_days") or 14)
    deadline: date | None = None
    if project.get("deadline"):
        deadline = project["deadline"]
    else:
        deadline = (date.today() + timedelta(days=deadline_days)).isoformat()

    order_result = run_query(
        lambda: admin.table("orders")
        .insert(
            {
                "client_id": project["client_id"],
                "freelancer_id": proposal["freelancer_id"],
                "amount": amount,
                "notes": (proposal.get("cover_letter") or "")[:500],
                "status": "pending",
                "project_id": project["id"],
                "application_id": proposal["id"],
            }
        )
        .execute()
    )
    order = (order_result.data or [None])[0]

    contract_result = run_query(
        lambda: admin.table("contracts")
        .insert(
            {
                "project_id": project["id"],
                "proposal_id": proposal["id"],
                "order_id": order["id"] if order else None,
                "client_id": project["client_id"],
                "freelancer_id": proposal["freelancer_id"],
                "title": project.get("title") or "Shartnoma",
                "amount": amount,
                "deadline": deadline,
                "status": "pending_payment",
                "payment_status": "unpaid",
            }
        )
        .execute()
    )
    contract = (contract_result.data or [None])[0]
    if not contract:
        raise RuntimeError("Contract yaratilmadi")

    if order:
        admin.table("orders").update({"contract_id": contract["id"]}).eq("id", order["id"]).execute()

    admin.table("projects").update({"status": "accepted"}).eq("id", project["id"]).execute()

    other_apps = (
        admin.table("project_applications")
        .select("id")
        .eq("project_id", project["id"])
        .neq("id", proposal["id"])
        .neq("status", "rejected")
        .execute()
    )
    for app in other_apps.data or []:
        admin.table("project_applications").update({"status": "rejected"}).eq("id", app["id"]).execute()

    ensure_contract_conversation(contract)
    if order:
        ensure_order_conversation(order)
    return contract
