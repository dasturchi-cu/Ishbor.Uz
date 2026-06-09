from fastapi import APIRouter, HTTPException, Query, status

from app.database import get_supabase_admin
from app.db_utils import run_query
from app.deps import UserAuthDep
from app.schemas_platform import CompanyResponse

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("", response_model=list[CompanyResponse])
def list_companies(
    region: str | None = None,
    featured: bool | None = None,
    limit: int = Query(default=24, le=100),
    offset: int = Query(default=0, ge=0),
):
    supabase = get_supabase_admin()
    query = supabase.table("companies").select("*").eq("is_published", True)
    if region:
        query = query.eq("region", region)
    if featured is True:
        query = query.eq("is_featured", True)
    result = run_query(
        lambda: query.order("is_featured", desc=True)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return result.data or []


@router.get("/me/list", response_model=list[CompanyResponse])
def list_my_companies(auth: UserAuthDep):
    result = run_query(
        lambda: auth.supabase.table("companies")
        .select("*")
        .eq("owner_id", auth.user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.get("/{slug}", response_model=CompanyResponse)
def get_company(slug: str):
    supabase = get_supabase_admin()
    result = run_query(
        lambda: supabase.table("companies")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", True)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kompaniya topilmadi")
    return result.data
