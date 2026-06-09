"""Trust, buyer protection, terms consent, ledger, bank accounts, receipts."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Header, HTTPException, Query, Request, status
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.config import settings
from app.database import get_supabase_admin
from app.db_utils import run_query
from app.deps import UserAuthDep
from app.ledger_service import list_user_ledger
from app.platform_services import log_audit, refresh_reputation
from app.schemas_platform import UserReputationResponse
from app.trust_jobs import run_all_trust_jobs

router = APIRouter(prefix="/trust", tags=["trust"])


class TermsConsentBody(BaseModel):
    doc_type: str = Field(pattern="^(terms|privacy|buyer_protection)$")
    version: str = Field(min_length=1, max_length=32)


class BankAccountCreate(BaseModel):
    bank_name: str = Field(min_length=2, max_length=120)
    account_holder: str = Field(min_length=2, max_length=120)
    account_number: str = Field(min_length=8, max_length=32)
    mfo: str | None = Field(default=None, max_length=16)


class CompanyStirSubmit(BaseModel):
    stir: str = Field(min_length=9, max_length=14, pattern=r"^\d{9,14}$")
    document_url: str | None = Field(default=None, max_length=500)


def _client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


@router.get("/buyer-protection")
def buyer_protection_content():
    admin = get_supabase_admin()
    doc = run_query(
        lambda: admin.table("terms_documents")
        .select("*")
        .eq("doc_type", "buyer_protection")
        .eq("is_current", True)
        .limit(1)
        .execute()
    )
    stats = run_query(lambda: admin.from_("public_dispute_stats").select("*").limit(1).execute())
    dispute_row = (stats.data or [{}])[0] if hasattr(stats, "data") else {}
    if not dispute_row:
        try:
            dispute_row = run_query(
                lambda: admin.table("disputes").select("id", count="exact").limit(0).execute()
            )
            dispute_row = {"total_disputes": dispute_row.count or 0}
        except Exception:
            dispute_row = {}

    return {
        "document": (doc.data or [None])[0],
        "dispute_stats": dispute_row,
    }


@router.get("/dispute-stats/public")
def public_dispute_stats():
    admin = get_supabase_admin()
    result = run_query(
        lambda: admin.rpc("get_public_dispute_stats", {}).execute()
        if False
        else admin.table("disputes").select("id, status, sla_breached").execute()
    )
    rows = result.data or []
    total = len(rows)
    resolved = sum(1 for r in rows if r.get("status") in ("resolved_client", "resolved_freelancer", "closed"))
    open_count = sum(1 for r in rows if r.get("status") in ("open", "responded", "under_review"))
    sla_breached = sum(1 for r in rows if r.get("sla_breached"))
    rate = round((resolved / total) * 100, 1) if total else 100.0
    return {
        "total_disputes": total,
        "resolved_disputes": resolved,
        "open_disputes": open_count,
        "sla_breached_count": sla_breached,
        "resolution_rate_percent": rate,
    }


@router.get("/terms/current")
def current_terms(doc_type: str = Query(default="terms")):
    if doc_type not in ("terms", "privacy", "buyer_protection"):
        raise HTTPException(status_code=400, detail="Noto'g'ri doc_type")
    admin = get_supabase_admin()
    result = run_query(
        lambda: admin.table("terms_documents")
        .select("doc_type, version, title, content, effective_at")
        .eq("doc_type", doc_type)
        .eq("is_current", True)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Hujjat topilmadi")
    return result.data[0]


@router.post("/terms/consent", status_code=status.HTTP_204_NO_CONTENT)
def accept_terms(payload: TermsConsentBody, auth: UserAuthDep, request: Request):
    admin = get_supabase_admin()
    doc = run_query(
        lambda: admin.table("terms_documents")
        .select("version")
        .eq("doc_type", payload.doc_type)
        .eq("version", payload.version)
        .limit(1)
        .execute()
    )
    if not doc.data:
        raise HTTPException(status_code=400, detail="Hujjat versiyasi topilmadi")

    run_query(
        lambda: admin.table("user_terms_consents")
        .insert(
            {
                "user_id": auth.user_id,
                "doc_type": payload.doc_type,
                "version": payload.version,
                "ip_address": _client_ip(request),
                "user_agent": request.headers.get("user-agent"),
            }
        )
        .execute()
    )
    log_audit(
        actor_id=auth.user_id,
        action="terms_consent",
        entity_type="terms",
        entity_id=payload.version,
        metadata={"doc_type": payload.doc_type},
        request=request,
    )
    return None


@router.get("/terms/consent/status")
def terms_consent_status(auth: UserAuthDep):
    admin = get_supabase_admin()
    current = run_query(
        lambda: admin.table("terms_documents")
        .select("doc_type, version")
        .eq("is_current", True)
        .in_("doc_type", ["terms", "privacy"])
        .execute()
    )
    accepted = run_query(
        lambda: admin.table("user_terms_consents")
        .select("doc_type, version, accepted_at")
        .eq("user_id", auth.user_id)
        .order("accepted_at", desc=True)
        .execute()
    )
    by_type: dict[str, str] = {}
    for row in accepted.data or []:
        if row["doc_type"] not in by_type:
            by_type[row["doc_type"]] = row["version"]

    pending: list[str] = []
    for doc in current.data or []:
        if by_type.get(doc["doc_type"]) != doc["version"]:
            pending.append(doc["doc_type"])

    return {"accepted": by_type, "pending": pending, "requires_consent": len(pending) > 0}


@router.get("/reputation/me/breakdown", response_model=UserReputationResponse)
def my_trust_breakdown(auth: UserAuthDep):
    refresh_reputation(auth.user_id)
    admin = get_supabase_admin()
    result = run_query(
        lambda: admin.table("user_reputation").select("*").eq("user_id", auth.user_id).limit(1).execute()
    )
    if not result.data:
        return UserReputationResponse(user_id=auth.user_id)
    row = result.data[0]
    return row


@router.get("/reputation/{user_id}/breakdown")
def user_trust_breakdown(user_id: str):
    refresh_reputation(user_id)
    admin = get_supabase_admin()
    result = run_query(
        lambda: admin.table("user_reputation").select("*").eq("user_id", user_id).limit(1).execute()
    )
    if not result.data:
        return {"user_id": user_id, "trust_score": 0, "trust_breakdown": {}}
    return result.data[0]


@router.get("/ledger/me")
def my_ledger(auth: UserAuthDep, limit: int = Query(default=50, le=200), offset: int = Query(default=0, ge=0)):
    return {"items": list_user_ledger(auth.user_id, limit=limit, offset=offset)}


@router.get("/bank-accounts/mine")
def list_bank_accounts(auth: UserAuthDep):
    result = run_query(
        lambda: auth.supabase.table("bank_accounts")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.post("/bank-accounts", status_code=status.HTTP_201_CREATED)
def create_bank_account(payload: BankAccountCreate, auth: UserAuthDep):
    result = run_query(
        lambda: auth.supabase.table("bank_accounts")
        .insert(
            {
                "user_id": auth.user_id,
                "bank_name": payload.bank_name.strip(),
                "account_holder": payload.account_holder.strip(),
                "account_number": payload.account_number.strip(),
                "mfo": payload.mfo.strip() if payload.mfo else None,
            }
        )
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Bank hisobi saqlanmadi")
    return result.data[0]


@router.get("/receipts/order/{order_id}")
def get_order_receipt(order_id: str, auth: UserAuthDep):
    order = run_query(
        lambda: auth.supabase.table("orders")
        .select("client_id, freelancer_id")
        .eq("id", order_id)
        .single()
        .execute()
    )
    if not order.data:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")
    if auth.user_id not in (order.data["client_id"], order.data["freelancer_id"]):
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")

    admin = get_supabase_admin()
    receipt = run_query(
        lambda: admin.table("payment_receipts")
        .select("*")
        .eq("order_id", order_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not receipt.data:
        raise HTTPException(status_code=404, detail="Kvitansiya topilmadi")
    return receipt.data[0]


@router.get("/receipts/order/{order_id}/pdf")
def download_receipt_pdf(order_id: str, auth: UserAuthDep):
    receipt = get_order_receipt(order_id, auth)
    path = receipt.get("pdf_storage_path")
    if not path:
        raise HTTPException(status_code=404, detail="PDF mavjud emas")
    admin = get_supabase_admin()
    try:
        data = admin.storage.from_("project-attachments").download(path)
    except Exception as exc:
        raise HTTPException(status_code=404, detail="PDF yuklab bo'lmadi") from exc
    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{receipt["receipt_number"]}.pdf"'},
    )


@router.post("/companies/{company_id}/stir")
def submit_company_stir(company_id: str, payload: CompanyStirSubmit, auth: UserAuthDep):
    company = run_query(
        lambda: auth.supabase.table("companies").select("*").eq("id", company_id).single().execute()
    )
    if not company.data:
        raise HTTPException(status_code=404, detail="Kompaniya topilmadi")
    if company.data.get("owner_id") != auth.user_id:
        raise HTTPException(status_code=403, detail="Faqat egasi STIR yuborishi mumkin")

    admin = get_supabase_admin()
    result = run_query(
        lambda: admin.table("companies")
        .update(
            {
                "stir": payload.stir,
                "stir_document_url": payload.document_url,
                "stir_verified": False,
            }
        )
        .eq("id", company_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="STIR saqlanmadi")

    run_query(
        lambda: admin.table("user_verifications")
        .insert(
            {
                "user_id": auth.user_id,
                "verification_type": "company",
                "status": "pending",
                "document_urls": [payload.document_url] if payload.document_url else [],
                "notes": f"STIR: {payload.stir}",
            }
        )
        .execute()
    )
    return result.data[0]


@router.post("/jobs/run", tags=["jobs"])
def run_trust_jobs_cron(x_cron_secret: str | None = Header(default=None, alias="X-Cron-Secret")):
    secret = settings.cron_secret.strip()
    if not secret or x_cron_secret != secret:
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")
    return run_all_trust_jobs()


@router.post("/jobs/backup-checkpoint", tags=["jobs"])
def record_scheduled_backup(
    x_cron_secret: str | None = Header(default=None, alias="X-Cron-Secret"),
    backup_type: str = Query(default="scheduled"),
):
    """Cron: daily/weekly backup checkpoint metadata (Supabase PITR alohida)."""
    secret = settings.cron_secret.strip()
    if not secret or x_cron_secret != secret:
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")
    admin = get_supabase_admin()
    result = run_query(
        lambda: admin.table("backups_metadata")
        .insert(
            {
                "backup_type": backup_type,
                "status": "recorded",
                "notes": "Automated checkpoint via /trust/jobs/backup-checkpoint",
            }
        )
        .execute()
    )
    return (result.data or [{}])[0]
