from fastapi import APIRouter, HTTPException, status

from app.db_utils import run_query
from app.deps import UserAuthDep
from app.milestone_escrow_service import fund_milestone_escrow, release_milestone_escrow
from app.schemas_marketplace import MilestoneCreate, MilestoneResponse, MilestoneStatusUpdate

router = APIRouter(prefix="/milestones", tags=["milestones"])

_MILESTONE_TRANSITIONS: dict[str, set[str]] = {
    "pending": {"funded", "cancelled"},
    "funded": {"submitted", "cancelled"},
    "submitted": {"approved", "cancelled"},
    "approved": {"released"},
    "released": set(),
    "cancelled": set(),
}


def _get_contract(supabase, contract_id: str) -> dict:
    result = run_query(
        lambda: supabase.table("contracts").select("*").eq("id", contract_id).single().execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shartnoma topilmadi")
    return result.data


@router.post("/contract/{contract_id}", response_model=MilestoneResponse, status_code=status.HTTP_201_CREATED)
def create_milestone(contract_id: str, payload: MilestoneCreate, auth: UserAuthDep):
    supabase = auth.supabase
    contract = _get_contract(supabase, contract_id)
    if auth.user_id != contract["client_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat mijoz bosqich yaratadi")

    result = run_query(
        lambda: supabase.table("milestones")
        .insert(
            {
                "contract_id": contract_id,
                "title": payload.title.strip(),
                "description": payload.description,
                "amount": payload.amount,
                "due_date": payload.due_date.isoformat() if payload.due_date else None,
                "sort_order": payload.sort_order,
            }
        )
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Bosqich yaratilmadi")
    return result.data[0]


@router.get("/contract/{contract_id}", response_model=list[MilestoneResponse])
def list_milestones(contract_id: str, auth: UserAuthDep):
    supabase = auth.supabase
    contract = _get_contract(supabase, contract_id)
    if auth.user_id not in (contract["client_id"], contract["freelancer_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")
    result = run_query(
        lambda: supabase.table("milestones")
        .select("*")
        .eq("contract_id", contract_id)
        .order("sort_order")
        .execute()
    )
    return result.data or []


@router.patch("/{milestone_id}/status", response_model=MilestoneResponse)
def update_milestone_status(milestone_id: str, payload: MilestoneStatusUpdate, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    existing = run_query(
        lambda: supabase.table("milestones").select("*").eq("id", milestone_id).single().execute()
    )
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bosqich topilmadi")

    milestone = existing.data
    contract = _get_contract(supabase, milestone["contract_id"])
    is_client = user_id == contract["client_id"]
    is_freelancer = user_id == contract["freelancer_id"]

    current = milestone.get("status") or "pending"
    allowed = _MILESTONE_TRANSITIONS.get(current, set())
    if payload.status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{current}' dan '{payload.status}' ga o'tish mumkin emas",
        )

    if payload.status == "submitted" and not is_freelancer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat freelancer topshiradi")
    if payload.status == "approved" and not is_client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat mijoz tasdiqlaydi")

    if payload.status == "funded":
        if not is_client:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat mijoz moliyalashtiradi")
        return fund_milestone_escrow(milestone, contract, user_id)

    if payload.status == "released":
        return release_milestone_escrow(milestone)

    result = run_query(
        lambda: supabase.table("milestones")
        .update({"status": payload.status})
        .eq("id", milestone_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bosqich topilmadi")
    return result.data[0]
