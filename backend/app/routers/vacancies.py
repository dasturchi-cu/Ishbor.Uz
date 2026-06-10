from fastapi import APIRouter, HTTPException, Query, status

from app.database import get_supabase_admin
from app.db_utils import run_query
from app.deps import OptionalUserId, UserAuthDep
from app.notification_service import create_notification
from app.schemas_platform import (
    VacancyApplyCreate,
    VacancyApplicationResponse,
    VacancyCreate,
    VacancyDetailResponse,
    VacancyResponse,
)

router = APIRouter(prefix="/vacancies", tags=["vacancies"])


def _feature_enabled() -> bool:
    admin = get_supabase_admin()
    row = run_query(
        lambda: admin.table("feature_flags").select("enabled").eq("key", "vacancies").limit(1).execute()
    )
    return bool((row.data or [{}])[0].get("enabled"))


def _get_published_vacancy(supabase, vacancy_id: str) -> dict:
    result = run_query(
        lambda: supabase.table("vacancies")
        .select("*")
        .eq("id", vacancy_id)
        .eq("is_published", True)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vakansiya topilmadi")
    return result.data


def _enrich_vacancy_detail(row: dict, supabase, viewer_id: str | None = None) -> dict:
    client = run_query(
        lambda: supabase.table("profiles")
        .select("id, full_name, specialty, region, avatar_url")
        .eq("id", row["client_id"])
        .single()
        .execute()
    )
    apps = run_query(
        lambda: supabase.table("vacancy_applications")
        .select("id, status, freelancer_id")
        .eq("vacancy_id", row["id"])
        .execute()
    )
    app_rows = apps.data or []
    my_status = None
    if viewer_id:
        for app in app_rows:
            if app.get("freelancer_id") == viewer_id:
                my_status = app.get("status")
                break
    return {
        **row,
        "client_profile": client.data,
        "application_count": len(app_rows),
        "my_application_status": my_status,
    }


@router.get("", response_model=list[VacancyResponse])
def list_vacancies(
    region: str | None = None,
    limit: int = Query(default=24, le=100),
    offset: int = Query(default=0, ge=0),
):
    if not _feature_enabled():
        return []
    supabase = get_supabase_admin()
    query = supabase.table("vacancies").select("*").eq("is_published", True)
    if region:
        query = query.eq("region", region)
    result = run_query(
        lambda: query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    )
    return result.data or []


@router.get("/{vacancy_id}", response_model=VacancyDetailResponse)
def get_vacancy(vacancy_id: str, viewer_id: OptionalUserId = None):
    if not _feature_enabled():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vakansiya topilmadi")
    supabase = get_supabase_admin()
    row = _get_published_vacancy(supabase, vacancy_id)
    return _enrich_vacancy_detail(row, supabase, viewer_id)


@router.post("/{vacancy_id}/apply", response_model=VacancyApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_to_vacancy(vacancy_id: str, payload: VacancyApplyCreate, auth: UserAuthDep):
    if not _feature_enabled():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vakansiyalar moduli o'chirilgan")

    profile = run_query(
        lambda: auth.supabase.table("profiles").select("role, full_name").eq("id", auth.user_id).single().execute()
    )
    if not profile.data or profile.data.get("role") != "freelancer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat freelancer ariza yuborishi mumkin")

    supabase = auth.supabase
    vacancy = _get_published_vacancy(supabase, vacancy_id)
    if vacancy.get("client_id") == auth.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="O'z vakansiyangizga ariza yuborib bo'lmaydi")

    existing = run_query(
        lambda: supabase.table("vacancy_applications")
        .select("id")
        .eq("vacancy_id", vacancy_id)
        .eq("freelancer_id", auth.user_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ariza allaqachon yuborilgan")

    result = run_query(
        lambda: supabase.table("vacancy_applications")
        .insert(
            {
                "vacancy_id": vacancy_id,
                "freelancer_id": auth.user_id,
                "cover_letter": payload.cover_letter.strip(),
            }
        )
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Ariza yaratilmadi")

    client_id = vacancy.get("client_id")
    if client_id:
        create_notification(
            supabase,
            user_id=client_id,
            type="order",
            title=vacancy.get("title") or "Vakansiya",
            body="Yangi ish arizasi keldi",
            href=f"/jobs/{vacancy_id}",
        )
    return result.data[0]


@router.post("", response_model=VacancyResponse, status_code=status.HTTP_201_CREATED)
def create_vacancy(payload: VacancyCreate, auth: UserAuthDep):
    if not _feature_enabled():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vakansiyalar moduli o'chirilgan")
    profile = run_query(
        lambda: auth.supabase.table("profiles").select("role").eq("id", auth.user_id).single().execute()
    )
    if (profile.data or {}).get("role") != "client":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat mijoz vakansiya joylaydi")
    result = run_query(
        lambda: auth.supabase.table("vacancies")
        .insert({**payload.model_dump(exclude_none=True), "client_id": auth.user_id})
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Vakansiya yaratilmadi")
    return result.data[0]
