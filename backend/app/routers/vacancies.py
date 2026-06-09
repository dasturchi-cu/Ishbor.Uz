from fastapi import APIRouter, HTTPException, Query, status

from app.database import get_supabase_admin
from app.db_utils import run_query
from app.deps import UserAuthDep
from app.schemas_platform import VacancyCreate, VacancyResponse

router = APIRouter(prefix="/vacancies", tags=["vacancies"])


def _feature_enabled() -> bool:
    admin = get_supabase_admin()
    row = run_query(
        lambda: admin.table("feature_flags").select("enabled").eq("key", "vacancies").limit(1).execute()
    )
    return bool((row.data or [{}])[0].get("enabled"))


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
