from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status

from app.contract_escrow_service import refund_contract_escrow, release_contract_escrow
from app.database import get_supabase_admin
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
    result = supabase.table("contracts").select("*").eq("id", contract_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shartnoma topilmadi")
    return result.data


def _assert_participant(contract: dict, user_id: str) -> None:
    if user_id not in (contract["client_id"], contract["freelancer_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")


@router.post("/contract/{contract_id}", response_model=DisputeResponse, status_code=status.HTTP_201_CREATED)
def open_dispute(contract_id: str, payload: DisputeCreate, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    contract = _get_contract(supabase, contract_id)

    if user_id != contract["client_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat mijoz nizo ochadi")
    if contract.get("status") not in ("active", "submitted", "revision_requested"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bu holatda nizo ochib bo'lmaydi")

    existing = (
        supabase.table("disputes")
        .select("id")
        .eq("contract_id", contract_id)
        .in_("status", ["open", "responded", "under_review"])
        .limit(1)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Faol nizo mavjud")

    result = (
        supabase.table("disputes")
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
    admin.table("contracts").update({"status": "disputed"}).eq("id", contract_id).execute()
    admin.table("projects").update({"status": "disputed"}).eq("id", contract["project_id"]).execute()

    create_notification(
        supabase,
        user_id=contract["freelancer_id"],
        type="order",
        title="Nizo ochildi",
        body=payload.reason[:120],
        href=f"/dashboard/disputes/{row['id']}",
    )
    return {**row, "contract": contract}


@router.get("/{dispute_id}", response_model=DisputeResponse)
def get_dispute(dispute_id: str, auth: UserAuthDep):
    supabase = auth.supabase
    result = supabase.table("disputes").select("*").eq("id", dispute_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nizo topilmadi")
    dispute = result.data
    contract = _get_contract(supabase, dispute["contract_id"])
    _assert_participant(contract, auth.user_id)
    return {**dispute, "contract": contract}


@router.get("/{dispute_id}/messages", response_model=list[DisputeMessageResponse])
def list_dispute_messages(dispute_id: str, auth: UserAuthDep):
    supabase = auth.supabase
    dispute = supabase.table("disputes").select("*").eq("id", dispute_id).single().execute()
    if not dispute.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nizo topilmadi")
    contract = _get_contract(supabase, dispute.data["contract_id"])
    _assert_participant(contract, auth.user_id)
    result = (
        supabase.table("dispute_messages")
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
    dispute = supabase.table("disputes").select("*").eq("id", dispute_id).single().execute()
    if not dispute.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nizo topilmadi")
    contract = _get_contract(supabase, dispute.data["contract_id"])
    _assert_participant(contract, user_id)

    result = (
        supabase.table("dispute_messages")
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

    current_status = dispute.data.get("status") or "open"
    if current_status == "open" and user_id == contract["freelancer_id"]:
        supabase.table("disputes").update({"status": "responded"}).eq("id", dispute_id).execute()

    other_id = contract["client_id"] if user_id == contract["freelancer_id"] else contract["freelancer_id"]
    create_notification(
        supabase,
        user_id=other_id,
        type="order",
        title="Nizo javobi",
        body=payload.content[:120],
        href=f"/dashboard/disputes/{dispute_id}",
    )
    return result.data[0]
