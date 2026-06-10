from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

from app.url_safety import is_allowed_storage_file_url, is_safe_external_https_url, is_safe_internal_href


class ClientErrorReport(BaseModel):
    scope: str = Field(max_length=64)
    message: str = Field(max_length=500)
    status: int = 0
    api_path: str | None = Field(default=None, max_length=256)
    query_key: str | None = Field(default=None, max_length=128)
    page: str | None = Field(default=None, max_length=256)
    url: str | None = Field(default=None, max_length=512)
    ts: str | None = Field(default=None, max_length=64)


class RequestAuditStat(BaseModel):
    query_name: str
    endpoint: str
    component: str
    kind: str = "db"
    count_total: int = 0
    count_last_hour: int = 0


class RequestAuditClientBatch(BaseModel):
    events: list[RequestAuditStat] = Field(default_factory=list)


class AuditLogResponse(BaseModel):
    id: str
    actor_id: str | None = None
    action: str
    entity_type: str | None = None
    entity_id: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    ip_address: str | None = None
    created_at: datetime | None = None


class UserActivityResponse(BaseModel):
    id: str
    user_id: str
    activity_type: str
    title: str
    body: str | None = None
    href: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime | None = None


class ActivityFeedItemResponse(BaseModel):
    id: str
    kind: Literal["activity", "order", "message", "payment"]
    title: str
    body: str | None = None
    href: str | None = None
    created_at: datetime
    order_status: str | None = None
    amount: int | None = None
    payment_type: str | None = None


class UserReputationResponse(BaseModel):
    user_id: str
    avg_rating: float = 0
    review_count: int = 0
    completed_projects: int = 0
    completed_orders: int = 0
    success_rate: float = 0
    response_time_hours: float | None = None
    total_earnings: int = 0
    trust_score: int = 0
    trust_breakdown: dict[str, Any] = Field(default_factory=dict)
    dispute_count: int = 0
    dispute_lost_count: int = 0
    updated_at: datetime | None = None


class VerificationCreate(BaseModel):
    verification_type: Literal["identity", "freelancer", "employer", "company"]
    document_urls: list[str] = Field(default_factory=list, max_length=5)
    notes: str | None = Field(default=None, max_length=1000)

    @field_validator("document_urls")
    @classmethod
    def validate_document_urls(cls, urls: list[str]) -> list[str]:
        for url in urls:
            if not is_allowed_storage_file_url(url):
                raise ValueError("Faqat Supabase storage URL qabul qilinadi")
        return urls


class VerificationResponse(BaseModel):
    id: str
    user_id: str
    verification_type: str
    status: str
    document_urls: list[str] = Field(default_factory=list)
    notes: str | None = None
    admin_notes: str | None = None
    reviewed_at: datetime | None = None
    created_at: datetime | None = None


class VerificationReview(BaseModel):
    status: Literal["approved", "rejected"]
    admin_notes: str | None = Field(default=None, max_length=2000)


class ReportCreate(BaseModel):
    target_type: Literal["user", "service", "project", "review", "message"]
    target_id: str = Field(min_length=1, max_length=64)
    category: Literal["scam", "spam", "fake_account", "abuse"]
    description: str = Field(min_length=10, max_length=2000)


class ReportResponse(BaseModel):
    id: str
    reporter_id: str
    target_type: str
    target_id: str
    category: str
    description: str
    status: str
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ReportMessageCreate(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class ReportMessageResponse(BaseModel):
    id: str
    report_id: str
    sender_id: str
    message: str
    is_admin: bool = False
    created_at: datetime | None = None


class DraftUpsert(BaseModel):
    draft_key: str = Field(min_length=1, max_length=64)
    payload: dict[str, Any] = Field(default_factory=dict)


class DraftResponse(BaseModel):
    id: str
    draft_key: str
    payload: dict[str, Any] = Field(default_factory=dict)
    updated_at: datetime | None = None


class AnalyticsTrack(BaseModel):
    event_name: str = Field(min_length=1, max_length=64)
    properties: dict[str, Any] = Field(default_factory=dict)
    session_id: str | None = Field(default=None, max_length=64)


class StorageSignedUrlRequest(BaseModel):
    bucket: Literal["project-attachments"] = "project-attachments"
    path: str = Field(min_length=5, max_length=500)


class StorageSignedUrlResponse(BaseModel):
    url: str


class FeatureFlagResponse(BaseModel):
    key: str
    enabled: bool
    description: str | None = None
    rollout_percent: int = 100


class FeatureFlagUpdate(BaseModel):
    enabled: bool | None = None
    description: str | None = Field(default=None, max_length=500)
    rollout_percent: int | None = Field(default=None, ge=0, le=100)


class VacancyCreate(BaseModel):
    title: str = Field(min_length=3, max_length=160)
    description: str | None = Field(default=None, max_length=5000)
    region: str | None = Field(default=None, max_length=80)
    employment_type: Literal["full_time", "part_time", "contract", "internship"] = "full_time"
    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)
    is_published: bool = False


class VacancyResponse(BaseModel):
    id: str
    client_id: str
    title: str
    description: str | None = None
    region: str | None = None
    employment_type: str
    salary_min: int | None = None
    salary_max: int | None = None
    is_published: bool
    created_at: datetime | None = None


class VacancyClientProfile(BaseModel):
    id: str
    full_name: str | None = None
    specialty: str | None = None
    region: str | None = None
    avatar_url: str | None = None


class VacancyDetailResponse(VacancyResponse):
    client_profile: VacancyClientProfile | None = None
    application_count: int = 0
    my_application_status: str | None = None


class VacancyApplyCreate(BaseModel):
    cover_letter: str = Field(min_length=10, max_length=4000)


class VacancyApplicationResponse(BaseModel):
    id: str
    vacancy_id: str
    freelancer_id: str
    cover_letter: str
    status: str
    created_at: datetime | None = None


class ModerationActionResponse(BaseModel):
    id: str
    admin_id: str
    target_user_id: str | None = None
    action: str
    reason: str | None = None
    created_at: datetime | None = None


class FraudLogResponse(BaseModel):
    id: str
    user_id: str | None = None
    fraud_type: str
    severity: str
    details: dict[str, Any] = Field(default_factory=dict)
    resolved: bool = False
    created_at: datetime | None = None


class BackupMetadataResponse(BaseModel):
    id: str
    backup_type: str
    status: str
    storage_path: str | None = None
    size_bytes: int | None = None
    notes: str | None = None
    created_at: datetime | None = None


class AdminSuspendUser(BaseModel):
    suspended: bool
    until: datetime | None = None
    reason: str | None = Field(default=None, max_length=500)


class AdminAnalyticsSeriesPoint(BaseModel):
    date: str
    value: int


class AdminSearchTerm(BaseModel):
    query: str
    surface: str
    count: int


class AdminAnalyticsResponse(BaseModel):
    period_days: int
    new_users: int
    orders_total: int
    orders_completed: int
    revenue_completed: int
    platform_revenue_completed: int = 0
    search_events: int
    register_events: int
    conversion_rate: float
    users_series: list[AdminAnalyticsSeriesPoint] = Field(default_factory=list)
    revenue_series: list[AdminAnalyticsSeriesPoint] = Field(default_factory=list)
    commission_series: list[AdminAnalyticsSeriesPoint] = Field(default_factory=list)
    top_searches: list[AdminSearchTerm] = Field(default_factory=list)


class AdminOverviewResponse(BaseModel):
    stats: dict[str, Any]
    analytics: AdminAnalyticsResponse
    audit_logs: list[AuditLogResponse] = Field(default_factory=list)
    activity_feed: list[dict[str, Any]] = Field(default_factory=list)


class AdminBroadcastNotification(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    body: str = Field(min_length=2, max_length=500)
    href: str | None = Field(default=None, max_length=500)
    target: Literal["all", "freelancers", "clients"] = "all"

    @field_validator("href")
    @classmethod
    def validate_href(cls, value: str | None) -> str | None:
        if value is not None and not is_safe_internal_href(value):
            raise ValueError("href faqat ichki yo'l bo'lishi kerak (/...)")
        return value


class CompanyOwnerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    slug: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = Field(default=None, max_length=2000)
    logo_url: str | None = None
    website: str | None = Field(default=None, max_length=500)

    @field_validator("website")
    @classmethod
    def validate_website(cls, value: str | None) -> str | None:
        if value is not None and not is_safe_external_https_url(value):
            raise ValueError("website faqat https:// URL bo'lishi kerak")
        return value
    region: str | None = Field(default=None, max_length=80)
    employee_count: int | None = Field(default=None, ge=0, le=100_000)


class CompanyOwnerUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=2000)
    logo_url: str | None = None
    website: str | None = Field(default=None, max_length=500)
    region: str | None = Field(default=None, max_length=80)
    employee_count: int | None = Field(default=None, ge=0, le=100_000)

    @field_validator("website")
    @classmethod
    def validate_website(cls, value: str | None) -> str | None:
        if value is not None and not is_safe_external_https_url(value):
            raise ValueError("website faqat https:// URL bo'lishi kerak")
        return value


class CompanyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    slug: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = Field(default=None, max_length=2000)
    logo_url: str | None = None
    website: str | None = Field(default=None, max_length=500)
    region: str | None = Field(default=None, max_length=80)
    owner_id: str | None = None
    employee_count: int | None = Field(default=None, ge=0, le=100_000)
    is_verified: bool = False
    is_featured: bool = False
    is_published: bool = False


class CompanyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    slug: str | None = Field(default=None, min_length=2, max_length=80, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = Field(default=None, max_length=2000)
    logo_url: str | None = None
    website: str | None = Field(default=None, max_length=500)
    region: str | None = Field(default=None, max_length=80)
    owner_id: str | None = None
    employee_count: int | None = Field(default=None, ge=0, le=100_000)
    is_verified: bool | None = None
    is_featured: bool | None = None
    is_published: bool | None = None


class CompanyResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None = None
    logo_url: str | None = None
    website: str | None = None
    region: str | None = None
    owner_id: str | None = None
    employee_count: int | None = None
    is_verified: bool = False
    is_featured: bool = False
    is_published: bool = False
    stir: str | None = None
    stir_document_url: str | None = None
    stir_verified: bool = False
    created_at: datetime | None = None
    updated_at: datetime | None = None
