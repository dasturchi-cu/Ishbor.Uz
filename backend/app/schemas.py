from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

MAX_MONEY = 2_147_483_647


class SessionFlagsResponse(BaseModel):
    is_banned: bool = False
    is_admin: bool = False
    onboarding_completed: bool = False
    role: Literal["freelancer", "client"] | None = None
    is_suspended: bool = False
    email_verified: bool = True
    require_email_verified: bool = False


class SecurityConfigResponse(BaseModel):
    require_email_verified: bool = False
    session_idle_minutes: int = 120


class ProfileResponse(BaseModel):
    id: str
    role: Literal["freelancer", "client"]
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    phone_verified_at: datetime | None = None
    bio: str | None = None
    region: str | None = None
    specialty: str | None = None
    avatar_url: str | None = None
    is_admin: bool = False
    is_verified: bool = False
    wallet_balance: int = 0
    profile_views: int = 0
    onboarding_completed: bool = False
    username: str | None = None
    is_banned: bool = False
    is_suspended: bool = False
    suspended_until: datetime | None = None
    suspension_reason: str | None = None
    portfolio_urls: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    hourly_rate: int | None = None
    experience_level: str | None = None
    languages: list[dict] = Field(default_factory=list)
    telegram_chat_id: str | None = None
    ui_preferences: dict = Field(default_factory=dict)
    created_at: datetime | None = None

    @model_validator(mode="before")
    @classmethod
    def coerce_null_profile_fields(cls, data):
        if isinstance(data, dict):
            for key in ("skills", "portfolio_urls", "languages"):
                if data.get(key) is None:
                    data[key] = []
            if data.get("wallet_balance") is None:
                data["wallet_balance"] = 0
            if data.get("profile_views") is None:
                data["profile_views"] = 0
            if data.get("ui_preferences") is None:
                data["ui_preferences"] = {}
        return data


class ProfilePublicResponse(BaseModel):
    id: str
    role: Literal["freelancer", "client"]
    username: str | None = None
    full_name: str | None = None
    bio: str | None = None
    region: str | None = None
    specialty: str | None = None
    avatar_url: str | None = None
    created_at: datetime | None = None
    avg_rating: float | None = None
    review_count: int = 0
    trust_score: int = 0
    completed_orders: int = 0
    profile_views: int = 0
    is_verified: bool = False
    portfolio_urls: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    hourly_rate: int | None = None
    experience_level: str | None = None
    languages: list[dict] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def coerce_null_public_profile_fields(cls, data):
        if isinstance(data, dict):
            for key in ("skills", "portfolio_urls", "languages"):
                if data.get(key) is None:
                    data[key] = []
        return data


class ProfileRoleUpdate(BaseModel):
    role: Literal["freelancer", "client"]


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    bio: str | None = None
    region: str | None = None
    specialty: str | None = None
    avatar_url: str | None = None
    onboarding_completed: bool | None = None
    username: str | None = Field(default=None, min_length=3, max_length=30)
    skills: list[str] | None = None
    hourly_rate: int | None = Field(default=None, ge=0, le=MAX_MONEY)
    experience_level: str | None = None
    languages: list[dict] | None = None
    portfolio_urls: list[str] | None = None
    role: Literal["freelancer", "client"] | None = None


class UiPreferencesUpdate(BaseModel):
    theme: Literal["light", "dark"] | None = None
    language: Literal["uz", "ru", "en"] | None = None
    timezone: str | None = Field(default=None, max_length=64)


class ServicePackage(BaseModel):
    id: str
    label_key: str
    price: int
    delivery_days: int


class ServiceFaqItem(BaseModel):
    q: str = Field(min_length=3, max_length=200)
    a: str = Field(min_length=3, max_length=500)


def _normalize_service_faq(items: list[ServiceFaqItem] | list[dict] | None) -> list[dict]:
    if not items:
        return []
    cleaned: list[dict] = []
    seen: set[str] = set()
    for raw in items:
        if isinstance(raw, ServiceFaqItem):
            q, a = raw.q.strip(), raw.a.strip()
        elif isinstance(raw, dict):
            q = str(raw.get("q", "")).strip()
            a = str(raw.get("a", "")).strip()
        else:
            continue
        if len(q) < 3 or len(a) < 3:
            continue
        key = q.lower()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append({"q": q, "a": a})
        if len(cleaned) >= 5:
            break
    return cleaned


def _normalize_service_includes(items: list[str], *, required: bool) -> list[str]:
    cleaned: list[str] = []
    seen: set[str] = set()
    for raw in items:
        item = raw.strip()
        if len(item) < 3 or len(item) > 200:
            continue
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(item)
        if len(cleaned) >= 10:
            break
    if required and len(cleaned) < 1:
        raise ValueError("Kamida bitta 'nima kiradi' bandi kerak")
    return cleaned


class ServiceCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)
    price: int = Field(gt=0, le=MAX_MONEY)
    category: str = Field(min_length=2)
    region: str = Field(min_length=2)
    image_urls: list[str] = Field(default_factory=list)
    delivery_days: int = Field(default=5, gt=0, le=365)
    packages: list[ServicePackage] = Field(default_factory=list)
    includes: list[str] = Field(min_length=1, max_length=10)
    faq: list[ServiceFaqItem] = Field(default_factory=list, max_length=5)

    @field_validator("includes")
    @classmethod
    def validate_includes(cls, value: list[str]) -> list[str]:
        return _normalize_service_includes(value, required=True)

    @field_validator("faq")
    @classmethod
    def validate_faq(cls, value: list[ServiceFaqItem]) -> list[dict]:
        return _normalize_service_faq(value)


class ServiceUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, min_length=10)
    price: int | None = Field(default=None, gt=0, le=MAX_MONEY)
    category: str | None = Field(default=None, min_length=2)
    region: str | None = Field(default=None, min_length=2)
    image_urls: list[str] | None = None
    delivery_days: int | None = Field(default=None, gt=0, le=365)
    packages: list[ServicePackage] | None = None
    includes: list[str] | None = None
    faq: list[ServiceFaqItem] | None = None

    @field_validator("includes")
    @classmethod
    def validate_includes_update(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        return _normalize_service_includes(value, required=True)

    @field_validator("faq")
    @classmethod
    def validate_faq_update(cls, value: list[ServiceFaqItem] | None) -> list[dict] | None:
        if value is None:
            return None
        return _normalize_service_faq(value)


class ServiceResponse(BaseModel):
    id: str
    freelancer_id: str
    title: str
    description: str
    price: int
    category: str
    region: str
    image_urls: list[str] = Field(default_factory=list)
    delivery_days: int = 5
    packages: list[dict] = Field(default_factory=list)
    includes: list[str] = Field(default_factory=list)
    faq: list[dict] = Field(default_factory=list)
    view_count: int = 0
    is_hidden: bool = False
    moderation_status: str = "approved"
    created_at: datetime | None = None
    profiles: dict | None = None

    @model_validator(mode="before")
    @classmethod
    def coerce_null_service_fields(cls, data):
        if isinstance(data, dict):
            if data.get("image_urls") is None:
                data["image_urls"] = []
            if data.get("packages") is None:
                data["packages"] = []
            if data.get("includes") is None:
                data["includes"] = []
            if data.get("faq") is None:
                data["faq"] = []
            if data.get("view_count") is None:
                data["view_count"] = 0
            if data.get("is_hidden") is None:
                data["is_hidden"] = False
            if data.get("moderation_status") is None:
                data["moderation_status"] = "approved"
        return data


class ServiceListResponse(BaseModel):
    items: list[ServiceResponse]
    total: int


class OrderCreate(BaseModel):
    service_id: str
    notes: str | None = None
    package_id: str | None = None


class ReferralApply(BaseModel):
    referrer_id: str


class ReferralStatsResponse(BaseModel):
    count: int
    bonus_earned: int = 0


class NotificationPrefsResponse(BaseModel):
    emailNewOrders: bool = True
    emailPromotions: bool = False
    smsUrgent: bool = False
    telegramConnect: bool = False
    chatMuted: bool = False


class NotificationPrefsUpdate(BaseModel):
    emailNewOrders: bool | None = None
    emailPromotions: bool | None = None
    smsUrgent: bool | None = None
    telegramConnect: bool | None = None
    chatMuted: bool | None = None


class UsernameCheckResponse(BaseModel):
    available: bool


class AdminUserUpdate(BaseModel):
    role: Literal["freelancer", "client"] | None = None
    is_banned: bool | None = None
    is_verified: bool | None = None


class AdminBulkUserAction(BaseModel):
    user_ids: list[str] = Field(min_length=1, max_length=50)
    action: Literal["ban", "unban", "verify", "unverify", "suspend", "unsuspend"]


class AdminBulkUserNotify(BaseModel):
    user_ids: list[str] = Field(min_length=1, max_length=50)
    title: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=500)


class OrderStatusUpdate(BaseModel):
    status: Literal["pending", "active", "delivered", "completed", "disputed", "cancelled"]
    delivery_notes: str | None = None
    dispute_reason: str | None = None


class OrderResponse(BaseModel):
    id: str
    service_id: str | None = None
    project_id: str | None = None
    application_id: str | None = None
    contract_id: str | None = None
    client_id: str
    freelancer_id: str
    amount: int
    platform_fee: int = 0
    status: str
    payment_status: str | None = "unpaid"
    notes: str | None = None
    delivery_notes: str | None = None
    dispute_reason: str | None = None
    package_id: str | None = None
    created_at: datetime | None = None
    services: dict | None = None
    projects: dict | None = None
    client_profile: dict | None = None
    freelancer_profile: dict | None = None


class PaymentIntentResponse(BaseModel):
    id: str
    order_id: str
    provider: str
    amount: int
    status: str
    redirect_url: str | None = None


class CheckoutResponse(BaseModel):
    order: OrderResponse
    payment_intent: PaymentIntentResponse | None = None
    redirect_url: str | None = None


class TransactionResponse(BaseModel):
    id: str
    order_id: str | None = None
    user_id: str
    type: str
    amount: int
    provider: str | None = None
    status: str
    created_at: datetime | None = None


class WithdrawalResponse(BaseModel):
    id: str
    freelancer_id: str
    amount: int
    status: str
    note: str | None = None
    created_at: datetime | None = None


class ProjectCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)
    category: str = Field(min_length=2)
    skills: list[str] = Field(default_factory=list)
    budget: int = Field(gt=0, le=MAX_MONEY)
    budget_type: str = "fixed"
    deadline: date | None = None
    level: str = "intermediate"
    region: str = Field(min_length=2)
    attachment_urls: list[str] = Field(default_factory=list)
    is_public: bool = True


class ProjectStatusUpdate(BaseModel):
    status: Literal[
        "draft",
        "open",
        "in_review",
        "accepted",
        "active",
        "submitted",
        "revision_requested",
        "completed",
        "cancelled",
        "disputed",
        "closed",
        "in_progress",
    ]


class ProjectUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = Field(default=None, min_length=10)
    category: str | None = Field(default=None, min_length=2)
    skills: list[str] | None = None
    budget: int | None = Field(default=None, gt=0, le=MAX_MONEY)
    budget_type: str | None = None
    deadline: date | None = None
    level: str | None = None
    region: str | None = Field(default=None, min_length=2)
    attachment_urls: list[str] | None = None
    is_public: bool | None = None


class ProjectResponse(BaseModel):
    id: str
    client_id: str
    title: str
    description: str
    category: str
    skills: list[str] = Field(default_factory=list)
    budget: int
    budget_type: str
    deadline: date | None = None
    level: str
    region: str
    status: str
    is_public: bool = True
    attachment_urls: list[str] = Field(default_factory=list)
    created_at: datetime | None = None
    profiles: dict | None = None
    application_count: int = 0
    contract_id: str | None = None


class ApplicationCreate(BaseModel):
    project_id: str
    cover_letter: str = Field(min_length=10, max_length=4000)
    proposed_budget: int = Field(gt=0, le=MAX_MONEY)
    proposed_days: int = Field(default=7, gt=0, le=365)


class ApplicationStatusUpdate(BaseModel):
    status: Literal["submitted", "shortlisted", "rejected", "hired"]


class ApplicationResponse(BaseModel):
    id: str
    project_id: str
    freelancer_id: str
    cover_letter: str
    proposed_budget: int
    proposed_days: int
    status: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
    freelancer_profile: dict | None = None
    project: dict | None = None


class MessageCreate(BaseModel):
    order_id: str
    content: str = Field(min_length=1, max_length=2000)


class MessageResponse(BaseModel):
    id: str
    order_id: str
    sender_id: str
    receiver_id: str
    content: str
    read_at: datetime | None = None
    created_at: datetime | None = None


class ConversationResponse(BaseModel):
    order_id: str
    other_user_id: str
    other_user_name: str
    order_title: str
    order_status: str
    last_message: str | None = None
    last_message_at: datetime | None = None
    unread_count: int = 0


class ReviewCreate(BaseModel):
    order_id: str
    rating: int = Field(ge=1, le=5)
    comment: str | None = None


class ReviewResponse(BaseModel):
    id: str
    order_id: str
    reviewer_id: str
    freelancer_id: str
    rating: int
    comment: str | None = None
    reply: str | None = None
    replied_at: datetime | None = None
    created_at: datetime | None = None
    profiles: dict | None = None


class ReviewReplyUpdate(BaseModel):
    reply: str = Field(min_length=1, max_length=2000)


class ReviewUpdate(BaseModel):
    rating: int | None = Field(default=None, ge=1, le=5)
    comment: str | None = Field(default=None, max_length=2000)


class PublicReviewResponse(BaseModel):
    id: str
    rating: int
    comment: str
    created_at: datetime | None = None
    author_name: str
    author_role: str | None = None
    freelancer_id: str
    freelancer_name: str | None = None
    freelancer_specialty: str | None = None
