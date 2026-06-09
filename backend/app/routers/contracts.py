from fastapi import APIRouter, HTTPException, Query, status

from app.config import settings
from app.contract_escrow_service import fund_contract_escrow, release_contract_escrow
from app.contract_transitions import validate_contract_transition
from app.database import get_supabase_admin
from app.db_utils import run_query
from app.deps import UserAuthDep
from app.notification_service import create_notification
from app.schemas_marketplace import (
    ContractFundRequest,
    ContractResponse,
    ContractStatusUpdate,
    EscrowTransactionResponse,
    ProjectFileCreate,
    ProjectFileResponse,
    ProjectReviewCreate,
    ProjectReviewResponse,
)

router = APIRouter(prefix="/contracts", tags=["contracts"])


def _enrich_contract(row: dict, supabase) -> dict:
    project = run_query(
        lambda: supabase.table("projects")
        .select("id, title, status")
        .eq("id", row["project_id"])
        .single()
        .execute()
    )
    client = run_query(
        lambda: supabase.table("profiles")
        .select("id, full_name, avatar_url, region")
        .eq("id", row["client_id"])
        .single()
        .execute()
    )
    freelancer = run_query(
        lambda: supabase.table("profiles")
        .select("id, full_name, avatar_url, specialty, region")
        .eq("id", row["freelancer_id"])
        .single()
        .execute()
    )
    return {
        **row,
        "project": project.data,
        "client_profile": client.data,
        "freelancer_profile": freelancer.data,
    }


def _get_contract_or_404(supabase, contract_id: str) -> dict:
    result = run_query(
        lambda: supabase.table("contracts").select("*").eq("id", contract_id).single().execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shartnoma topilmadi")
    return result.data


def _assert_participant(contract: dict, user_id: str) -> None:
    if user_id not in (contract["client_id"], contract["freelancer_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")


@router.get("", response_model=list[ContractResponse])
def list_contracts(
    auth: UserAuthDep,
    role: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
):
    user_id = auth.user_id
    supabase = auth.supabase
    query = supabase.table("contracts").select("*")
    if role == "client":
        query = query.eq("client_id", user_id)
    elif role == "freelancer":
        query = query.eq("freelancer_id", user_id)
    else:
        query = query.or_(f"client_id.eq.{user_id},freelancer_id.eq.{user_id}")
    if status_filter:
        query = query.eq("status", status_filter)
    result = run_query(
        lambda: query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    )
    return [_enrich_contract(row, supabase) for row in (result.data or [])]


@router.get("/{contract_id}", response_model=ContractResponse)
def get_contract(contract_id: str, auth: UserAuthDep):
    supabase = auth.supabase
    contract = _get_contract_or_404(supabase, contract_id)
    _assert_participant(contract, auth.user_id)
    return _enrich_contract(contract, supabase)


@router.patch("/{contract_id}/status", response_model=ContractResponse)
def update_contract_status(contract_id: str, payload: ContractStatusUpdate, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    contract = _get_contract_or_404(supabase, contract_id)
    _assert_participant(contract, user_id)

    current = contract.get("status") or "pending_payment"
    validate_contract_transition(
        current,
        payload.status,
        user_id,
        contract["client_id"],
        contract["freelancer_id"],
        contract.get("payment_status"),
    )

    update_data: dict = {"status": payload.status}
    if payload.delivery_notes:
        update_data["delivery_notes"] = payload.delivery_notes.strip()
    if payload.status == "revision_requested":
        update_data["revision_count"] = int(contract.get("revision_count") or 0) + 1

    result = run_query(
        lambda: supabase.table("contracts").update(update_data).eq("id", contract_id).execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shartnoma topilmadi")

    row = result.data[0]
    admin = get_supabase_admin()

    if payload.status == "submitted":
        run_query(
            lambda: admin.table("projects")
            .update({"status": "submitted"})
            .eq("id", contract["project_id"])
            .execute()
        )
        create_notification(
            supabase,
            user_id=contract["client_id"],
            type="order",
            title=contract.get("title") or "Shartnoma",
            body="Ish topshirildi — tekshiring",
            href=f"/dashboard/contracts/{contract_id}",
        )
    elif payload.status == "revision_requested":
        run_query(
            lambda: admin.table("projects")
            .update({"status": "revision_requested"})
            .eq("id", contract["project_id"])
            .execute()
        )
        create_notification(
            supabase,
            user_id=contract["freelancer_id"],
            type="order",
            title=contract.get("title") or "Shartnoma",
            body="Qayta ishlash so'raldi",
            href=f"/dashboard/contracts/{contract_id}",
        )
    elif payload.status == "completed":
        release_contract_escrow(row)
        refreshed = _get_contract_or_404(supabase, contract_id)
        create_notification(
            supabase,
            user_id=contract["freelancer_id"],
            type="order",
            title=contract.get("title") or "Shartnoma",
            body="Loyiha tasdiqlandi, escrow chiqarildi",
            href=f"/dashboard/contracts/{contract_id}",
        )
        return _enrich_contract(refreshed, supabase)
    elif payload.status == "disputed":
        run_query(
            lambda: admin.table("projects")
            .update({"status": "disputed"})
            .eq("id", contract["project_id"])
            .execute()
        )

    return _enrich_contract(row, supabase)


@router.post("/{contract_id}/fund", response_model=ContractResponse)
def fund_contract(contract_id: str, payload: ContractFundRequest, auth: UserAuthDep):
    supabase = auth.supabase
    contract = _get_contract_or_404(supabase, contract_id)
    _assert_participant(contract, auth.user_id)

    if payload.provider not in ("sandbox",):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hozircha faqat sandbox rejimi qo'llab-quvvatlanadi",
        )

    if settings.is_production:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sandbox to'lovi production muhitida taqiqlangan",
        )

    updated = fund_contract_escrow(contract, auth.user_id, payload.provider, payload.provider_ref)
    create_notification(
        supabase,
        user_id=contract["freelancer_id"],
        type="order",
        title=contract.get("title") or "Shartnoma",
        body="Escrow to'ldirildi — ishni boshlashingiz mumkin",
        href=f"/dashboard/contracts/{contract_id}",
    )
    return _enrich_contract(updated, supabase)


@router.get("/{contract_id}/escrow", response_model=list[EscrowTransactionResponse])
def list_contract_escrow(contract_id: str, auth: UserAuthDep):
    supabase = auth.supabase
    contract = _get_contract_or_404(supabase, contract_id)
    _assert_participant(contract, auth.user_id)
    result = run_query(
        lambda: supabase.table("escrow_transactions")
        .select("*")
        .eq("source_type", "contract")
        .eq("source_id", contract_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.post("/{contract_id}/files", response_model=ProjectFileResponse, status_code=status.HTTP_201_CREATED)
def upload_contract_file(contract_id: str, payload: ProjectFileCreate, auth: UserAuthDep):
    supabase = auth.supabase
    contract = _get_contract_or_404(supabase, contract_id)
    _assert_participant(contract, auth.user_id)
    result = run_query(
        lambda: supabase.table("project_files")
        .insert(
            {
                "contract_id": contract_id,
                "project_id": contract["project_id"],
                "uploaded_by": auth.user_id,
                "file_name": payload.file_name,
                "file_url": payload.file_url,
                "file_type": payload.file_type,
                "file_size": payload.file_size,
                "purpose": payload.purpose,
            }
        )
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Fayl saqlanmadi")
    return result.data[0]


@router.get("/{contract_id}/files", response_model=list[ProjectFileResponse])
def list_contract_files(contract_id: str, auth: UserAuthDep):
    supabase = auth.supabase
    contract = _get_contract_or_404(supabase, contract_id)
    _assert_participant(contract, auth.user_id)
    result = run_query(
        lambda: supabase.table("project_files")
        .select("*")
        .eq("contract_id", contract_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.post("/{contract_id}/reviews", response_model=ProjectReviewResponse, status_code=status.HTTP_201_CREATED)
def create_project_review(contract_id: str, payload: ProjectReviewCreate, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    contract = _get_contract_or_404(supabase, contract_id)
    _assert_participant(contract, user_id)
    if contract.get("status") != "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Faqat yakunlangan shartnomaga sharh")

    if user_id == contract["client_id"]:
        direction = "client_to_freelancer"
        reviewee_id = contract["freelancer_id"]
    else:
        direction = "freelancer_to_client"
        reviewee_id = contract["client_id"]

    existing = run_query(
        lambda: supabase.table("project_reviews")
        .select("id")
        .eq("contract_id", contract_id)
        .eq("reviewer_id", user_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sharh allaqachon yozilgan")

    result = run_query(
        lambda: supabase.table("project_reviews")
        .insert(
            {
                "contract_id": contract_id,
                "reviewer_id": user_id,
                "reviewee_id": reviewee_id,
                "direction": direction,
                "rating": payload.rating,
                "comment": payload.comment,
            }
        )
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Sharh saqlanmadi")
    return result.data[0]


@router.get("/{contract_id}/reviews", response_model=list[ProjectReviewResponse])
def list_project_reviews(contract_id: str, auth: UserAuthDep):
    supabase = auth.supabase
    contract = _get_contract_or_404(supabase, contract_id)
    _assert_participant(contract, auth.user_id)
    result = run_query(
        lambda: supabase.table("project_reviews")
        .select("*")
        .eq("contract_id", contract_id)
        .order("created_at")
        .execute()
    )
    return result.data or []
