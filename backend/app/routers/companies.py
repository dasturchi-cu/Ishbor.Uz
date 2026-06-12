from fastapi import APIRouter, HTTPException, Query, status

from app.database import get_supabase_admin
from app.db_utils import run_query
from app.deps import OptionalUserId, UserAuthDep
from app.schemas_platform import CompanyOwnerCreate, CompanyOwnerUpdate, CompanyPublicResponse, CompanyResponse

router = APIRouter(prefix="/companies", tags=["companies"])

_PUBLIC_COMPANY_COLUMNS = (
    "id, name, slug, description, logo_url, website, region, employee_count, "
    "is_verified, is_featured, is_published, stir_verified, created_at, updated_at"
)


@router.get("", response_model=list[CompanyPublicResponse])
def list_companies(
    region: str | None = None,
    featured: bool | None = None,
    limit: int = Query(default=24, le=100),
    offset: int = Query(default=0, ge=0),
    user_id: OptionalUserId = None,
):
    supabase = get_supabase_admin()
    query = supabase.table("companies").select(_PUBLIC_COMPANY_COLUMNS).eq("is_published", True)
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


@router.post("/me", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_my_company(payload: CompanyOwnerCreate, auth: UserAuthDep):
    existing = run_query(
        lambda: auth.supabase.table("companies")
        .select("id")
        .eq("owner_id", auth.user_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sizda allaqachon kompaniya profili bor",
        )
    row = {
        **payload.model_dump(exclude_none=True),
        "owner_id": auth.user_id,
        "is_published": False,
        "is_verified": False,
        "is_featured": False,
    }
    result = run_query(lambda: auth.supabase.table("companies").insert(row).execute())
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Kompaniya yaratilmadi")
    return result.data[0]


@router.patch("/me/{company_id}", response_model=CompanyResponse)
def update_my_company(company_id: str, payload: CompanyOwnerUpdate, auth: UserAuthDep):
    company = run_query(
        lambda: auth.supabase.table("companies").select("owner_id").eq("id", company_id).single().execute()
    )
    if not company.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kompaniya topilmadi")
    if company.data.get("owner_id") != auth.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ruxsat yo'q")
    updates = payload.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Yangilash uchun maydon kerak")
    result = run_query(
        lambda: auth.supabase.table("companies").update(updates).eq("id", company_id).execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Kompaniya yangilanmadi")
    return result.data[0]


@router.get("/{slug}", response_model=CompanyPublicResponse)
def get_company(slug: str, user_id: OptionalUserId = None):
    supabase = get_supabase_admin()
    result = run_query(
        lambda: supabase.table("companies")
        .select(_PUBLIC_COMPANY_COLUMNS)
        .eq("slug", slug)
        .eq("is_published", True)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kompaniya topilmadi")
    return result.data
