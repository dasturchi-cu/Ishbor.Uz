from fastapi import APIRouter, HTTPException, status

from app.contract_service import create_contract_from_proposal
from app.database import get_supabase_admin
from app.db_utils import run_query
from app.deps import UserAuthDep
from app.notification_service import create_notification
from app.schemas import ApplicationCreate, ApplicationResponse, ApplicationStatusUpdate

router = APIRouter(prefix="/applications", tags=["applications"])

_APPLICATION_TRANSITIONS: dict[str, set[str]] = {
    "submitted": {"shortlisted", "rejected", "hired"},
    "shortlisted": {"rejected", "hired"},
    "rejected": set(),
    "hired": set(),
}


def _enrich_application(row: dict, supabase) -> dict:
    freelancer = run_query(
        lambda: supabase.table("profiles")
        .select("id, full_name, specialty, region, avatar_url")
        .eq("id", row["freelancer_id"])
        .single()
        .execute()
    )
    project = run_query(
        lambda: supabase.table("projects")
        .select("id, title, client_id, status, budget")
        .eq("id", row["project_id"])
        .single()
        .execute()
    )
    return {
        **row,
        "freelancer_profile": freelancer.data,
        "project": project.data,
    }


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(payload: ApplicationCreate, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase

    profile = run_query(
        lambda: supabase.table("profiles").select("role").eq("id", user_id).single().execute()
    )
    if not profile.data or profile.data.get("role") != "freelancer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat freelancer ariza yuborishi mumkin")

    project = run_query(
        lambda: supabase.table("projects").select("*").eq("id", payload.project_id).single().execute()
    )
    if not project.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loyiha topilmadi")
    if project.data.get("status") != "open":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Loyiha yopiq")
    if project.data.get("client_id") == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="O'z loyihangizga ariza yuborib bo'lmaydi")

    existing = run_query(
        lambda: supabase.table("project_applications")
        .select("id")
        .eq("project_id", payload.project_id)
        .eq("freelancer_id", user_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ariza allaqachon yuborilgan")

    result = run_query(
        lambda: supabase.table("project_applications")
        .insert(
            {
                "project_id": payload.project_id,
                "freelancer_id": user_id,
                "cover_letter": payload.cover_letter.strip(),
                "proposed_budget": payload.proposed_budget,
                "proposed_days": payload.proposed_days,
            }
        )
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ariza yaratilmadi")

    row = result.data[0]
    if project.data.get("status") == "open":
        run_query(
            lambda: supabase.table("projects")
            .update({"status": "in_review"})
            .eq("id", payload.project_id)
            .execute()
        )
    client_id = project.data.get("client_id")
    if client_id:
        create_notification(
            supabase,
            user_id=client_id,
            type="order",
            title=project.data.get("title") or "Loyiha",
            body="Yangi ariza keldi",
            href=f"/projects/{payload.project_id}",
        )
    return _enrich_application(row, supabase)


@router.get("/mine", response_model=list[ApplicationResponse])
def list_my_applications(auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    result = run_query(
        lambda: supabase.table("project_applications")
        .select("*")
        .eq("freelancer_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return [_enrich_application(row, supabase) for row in (result.data or [])]


@router.get("/project/{project_id}", response_model=list[ApplicationResponse])
def list_project_applications(project_id: str, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    project = run_query(
        lambda: supabase.table("projects").select("client_id").eq("id", project_id).single().execute()
    )
    if not project.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loyiha topilmadi")
    if project.data["client_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")

    result = run_query(
        lambda: supabase.table("project_applications")
        .select("*")
        .eq("project_id", project_id)
        .order("created_at", desc=True)
        .execute()
    )
    return [_enrich_application(row, supabase) for row in (result.data or [])]


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def withdraw_application(application_id: str, auth: UserAuthDep):
    user_id = auth.user_id
    supabase = auth.supabase
    existing = run_query(
        lambda: supabase.table("project_applications")
        .select("*")
        .eq("id", application_id)
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ariza topilmadi")
    if existing.data["freelancer_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")
    current_status = existing.data.get("status") or "submitted"
    if current_status not in ("submitted", "shortlisted"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Faqat kutilayotgan arizani bekor qilish mumkin",
        )

    run_query(lambda: supabase.table("project_applications").delete().eq("id", application_id).execute())
    return None


@router.patch("/{application_id}/status", response_model=ApplicationResponse)
def update_application_status(
    application_id: str, payload: ApplicationStatusUpdate, auth: UserAuthDep
):
    user_id = auth.user_id
    supabase = auth.supabase
    existing = run_query(
        lambda: supabase.table("project_applications")
        .select("*")
        .eq("id", application_id)
        .single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ariza topilmadi")

    project = run_query(
        lambda: supabase.table("projects")
        .select("client_id")
        .eq("id", existing.data["project_id"])
        .single()
        .execute()
    )
    if not project.data or project.data["client_id"] != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")

    current_status = existing.data.get("status") or "submitted"
    allowed = _APPLICATION_TRANSITIONS.get(current_status, set())
    if payload.status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{current_status}' dan '{payload.status}' ga o'tish mumkin emas",
        )

    result = run_query(
        lambda: supabase.table("project_applications")
        .update({"status": payload.status})
        .eq("id", application_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ariza topilmadi")

    row = result.data[0]
    project_row = run_query(
        lambda: supabase.table("projects")
        .select("title")
        .eq("id", row["project_id"])
        .single()
        .execute()
    )
    title = (project_row.data or {}).get("title") or "Loyiha"
    status_labels = {
        "shortlisted": "Arizangiz tanlandi",
        "rejected": "Ariza rad etildi",
        "hired": "Siz ishga olindingiz",
    }
    body = status_labels.get(payload.status, f"Holat: {payload.status}")
    create_notification(
        supabase,
        user_id=row["freelancer_id"],
        type="order",
        title=title,
        body=body,
        href=f"/projects/{row['project_id']}",
    )

    if payload.status == "hired":
        admin = get_supabase_admin()
        project_full = run_query(
            lambda: admin.table("projects")
            .select("*")
            .eq("id", row["project_id"])
            .single()
            .execute()
        )
        contract_id = None
        if project_full.data:
            contract = create_contract_from_proposal(row, project_full.data)
            contract_id = contract.get("id")
        create_notification(
            admin,
            user_id=row["freelancer_id"],
            type="order",
            title=title,
            body="Taklifingiz qabul qilindi — shartnoma yaratildi",
            href=f"/dashboard/contracts/{contract_id}" if contract_id else "/dashboard/orders",
        )

    return _enrich_application(row, supabase)
