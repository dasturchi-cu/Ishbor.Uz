from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status

from app.contract_escrow_service import refund_contract_escrow, release_contract_escrow
from app.database import get_supabase_admin
from app.db_utils import run_query
from app.deps import UserAuthDep
from app.notification_service import create_notification
from app.schemas_marketplace import (
    DisputeCreate,
    DisputeMessageCreate,
    DisputeMessageResponse,
    DisputeResponse,
)

router = APIRouter(prefix="/disputes", tags=["disputes"])

_DISPUTE_TRANSITIONS: dict[str, set[str]] = {
    "open": {"responded", "under_review"},
    "responded": {"under_review"},
    "under_review": {"resolved_client", "resolved_freelancer", "closed"},
}


def _get_contract(supabase, contract_id: str) -> dict:
    result = run_query(
        lambda: supabase.table("contracts").select("*").eq("id", contract_id).single().execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shartnoma topilmadi")
    return result.data


def _get_order(supabase, order_id: str) -> dict:
    result = run_query(
        lambda: supabase.table("orders").select("*").eq("id", order_id).single().execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buyurtma topilmadi")
    return result.data


def _assert_contract_participant(contract: dict, user_id: str) -> None:
    if user_id not in (contract["client_id"], contract["freelancer_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")


def _assert_order_participant(order: dict, user_id: str) -> None:
    if user_id not in (order["client_id"], order["freelancer_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")


def _get_dispute_row(supabase, dispute_id: str) -> dict:
    result = run_query(
        lambda: supabase.table("disputes").select("*").eq("id", dispute_id).single().execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nizo topilmadi")
    return result.data


def _assert_dispute_participant(supabase, dispute: dict, user_id: str) -> None:
    if dispute.get("contract_id"):
        contract = _get_contract(supabase, dispute["contract_id"])
        _assert_contract_participant(contract, user_id)
        return
    if dispute.get("order_id"):
        order = _get_order(supabase, dispute["order_id"])
        _assert_order_participant(order, user_id)
        return
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nizo ma'lumoti noto'g'ri")


def _enrich_dispute(supabase, dispute: dict) -> dict:
    payload = {**dispute}
    if dispute.get("contract_id"):
        payload["contract"] = _get_contract(supabase, dispute["contract_id"])
    if dispute.get("order_id"):
        payload["order"] = _get_order(supabase, dispute["order_id"])
    return payload


@router.post("/contract/{contract_id}", response_model=DisputeResponse, status_code=status.HTTP_201_CREATED)
def open_dispute(contract_id: str, payload: DisputeCreate, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    contract = _get_contract(supabase, contract_id)

    if user_id != contract["client_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat mijoz nizo ochadi")
    if contract.get("status") not in ("active", "submitted", "revision_requested"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bu holatda nizo ochib bo'lmaydi")

    existing = run_query(
        lambda: supabase.table("disputes")
        .select("id")
        .eq("contract_id", contract_id)
        .in_("status", ["open", "responded", "under_review"])
        .limit(1)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Faol nizo mavjud")

    result = run_query(
        lambda: supabase.table("disputes")
        .insert(
            {
                "contract_id": contract_id,
                "opened_by": user_id,
                "reason": payload.reason.strip(),
            }
        )
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Nizo yaratilmadi")

    row = result.data[0]
    admin = get_supabase_admin()
    run_query(lambda: admin.table("contracts").update({"status": "disputed"}).eq("id", contract_id).execute())
    run_query(
        lambda: admin.table("projects")
        .update({"status": "disputed"})
        .eq("id", contract["project_id"])
        .execute()
    )

    create_notification(
        supabase,
        user_id=contract["freelancer_id"],
        type="order",
        title="Nizo ochildi",
        body=payload.reason[:120],
        href=f"/dashboard/disputes/{row['id']}",
    )
    return {**row, "contract": contract}


@router.get("/order/{order_id}", response_model=DisputeResponse)
def get_dispute_by_order(order_id: str, auth: UserAuthDep):
    supabase = auth.supabase
    order = _get_order(supabase, order_id)
    _assert_order_participant(order, auth.user_id)

    result = run_query(
        lambda: supabase.table("disputes")
        .select("*")
        .eq("order_id", order_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nizo topilmadi")
    return _enrich_dispute(supabase, result.data[0])


@router.get("/{dispute_id}", response_model=DisputeResponse)
def get_dispute(dispute_id: str, auth: UserAuthDep):
    supabase = auth.supabase
    dispute = _get_dispute_row(supabase, dispute_id)
    _assert_dispute_participant(supabase, dispute, auth.user_id)
    return _enrich_dispute(supabase, dispute)


@router.get("/{dispute_id}/messages", response_model=list[DisputeMessageResponse])
def list_dispute_messages(dispute_id: str, auth: UserAuthDep):
    supabase = auth.supabase
    dispute = _get_dispute_row(supabase, dispute_id)
    _assert_dispute_participant(supabase, dispute, auth.user_id)
    result = run_query(
        lambda: supabase.table("dispute_messages")
        .select("*")
        .eq("dispute_id", dispute_id)
        .order("created_at")
        .execute()
    )
    return result.data or []


@router.post("/{dispute_id}/messages", response_model=DisputeMessageResponse, status_code=status.HTTP_201_CREATED)
def post_dispute_message(dispute_id: str, payload: DisputeMessageCreate, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    dispute = _get_dispute_row(supabase, dispute_id)
    _assert_dispute_participant(supabase, dispute, user_id)

    result = run_query(
        lambda: supabase.table("dispute_messages")
        .insert(
            {
                "dispute_id": dispute_id,
                "sender_id": user_id,
                "content": payload.content.strip(),
                "attachments": payload.attachments,
            }
        )
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Xabar yuborilmadi")

    current_status = dispute.get("status") or "open"
    counterparty_id: str | None = None
    if dispute.get("contract_id"):
        contract = _get_contract(supabase, dispute["contract_id"])
        if current_status == "open" and user_id == contract["freelancer_id"]:
            run_query(
                lambda: supabase.table("disputes").update({"status": "responded"}).eq("id", dispute_id).execute()
            )
        counterparty_id = (
            contract["client_id"] if user_id == contract["freelancer_id"] else contract["freelancer_id"]
        )
    elif dispute.get("order_id"):
        order = _get_order(supabase, dispute["order_id"])
        if current_status == "open" and user_id == order["freelancer_id"]:
            run_query(
                lambda: supabase.table("disputes").update({"status": "responded"}).eq("id", dispute_id).execute()
            )
        counterparty_id = order["client_id"] if user_id == order["freelancer_id"] else order["freelancer_id"]

    if counterparty_id:
        create_notification(
            supabase,
            user_id=counterparty_id,
            type="order",
            title="Nizo javobi",
            body=payload.content[:120],
            href=f"/dashboard/disputes/{dispute_id}",
        )
    return result.data[0]
