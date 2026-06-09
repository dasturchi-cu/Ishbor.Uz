from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


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


class AdminAnalyticsResponse(BaseModel):
    period_days: int
    new_users: int
    orders_total: int
    orders_completed: int
    revenue_completed: int
    search_events: int
    register_events: int
    conversion_rate: float
    users_series: list[AdminAnalyticsSeriesPoint] = Field(default_factory=list)
    revenue_series: list[AdminAnalyticsSeriesPoint] = Field(default_factory=list)


class AdminOverviewResponse(BaseModel):
    stats: dict[str, Any]
    analytics: AdminAnalyticsResponse
    audit_logs: list[AuditLogResponse] = Field(default_factory=list)


class AdminBroadcastNotification(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    body: str = Field(min_length=2, max_length=500)
    href: str | None = Field(default=None, max_length=500)
    target: Literal["all", "freelancers", "clients"] = "all"


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
    created_at: datetime | None = None
    updated_at: datetime | None = None
