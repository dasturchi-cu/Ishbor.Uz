import httpx
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from postgrest.exceptions import APIError

from app.client_ip import get_client_ip
from app.config import settings
from app.supabase_instrumentation import reset_request_route, set_request_route
from app.origin_guard import validate_origin
from app.rate_limit import check_rate_limit
from app.idempotency import idempotency_middleware
from app.sentry_init import init_sentry
from app.routers import (
    admin,
    ai,
    applications,
    calls,
    companies,
    contracts,
    conversations,
    dashboard,
    disputes,
    health,
    messages,
    milestones,
    notifications,
    orders,
    payments,
    profiles,
    projects,
    proposals,
    reviews,
    saved_items,
    services,
    stats,
    vacancies,
    waitlist,
    platform,
    trust,
    security,
)
from app.supabase_errors import supabase_api_error_handler
from app.timing_log import is_timing_enabled

init_sentry()

_timing_logger = logging.getLogger("ishbor.timing")

from app.startup_checks import validate_production_settings


@asynccontextmanager
async def lifespan(_app: FastAPI):
    validate_production_settings()
    yield


app = FastAPI(
    title="IshBor.uz API",
    description="Supabase + FastAPI backend",
    version="0.2.0",
    docs_url="/docs" if settings.effective_docs_enabled else None,
    redoc_url="/redoc" if settings.effective_docs_enabled else None,
    openapi_url="/openapi.json" if settings.effective_docs_enabled else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=(
        None
        if settings.is_production
        else r"https?://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?"
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1")
app.include_router(profiles.router, prefix="/api/v1")
app.include_router(services.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")
app.include_router(applications.router, prefix="/api/v1")
app.include_router(proposals.router, prefix="/api/v1")
app.include_router(companies.router, prefix="/api/v1")
app.include_router(contracts.router, prefix="/api/v1")
app.include_router(milestones.router, prefix="/api/v1")
app.include_router(disputes.router, prefix="/api/v1")
app.include_router(conversations.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(calls.router, prefix="/api/v1")
app.include_router(messages.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(saved_items.router, prefix="/api/v1")
app.include_router(reviews.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(stats.router, prefix="/api/v1")
app.include_router(vacancies.router, prefix="/api/v1")
app.include_router(waitlist.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(platform.router, prefix="/api/v1")
app.include_router(trust.router, prefix="/api/v1")
app.include_router(security.router, prefix="/api/v1")

app.add_exception_handler(APIError, supabase_api_error_handler)

_RATE_GET_PATHS = (
    "/api/v1/profiles/check-username",
)
_RATE_PATHS = (
    "/api/v1/messages",
    "/api/v1/payments",
    "/api/v1/orders",
    "/api/v1/waitlist",
    "/api/v1/profiles/me/referral",
    "/api/v1/ai",
    "/api/v1/security",
    "/api/v1/admin",
    "/api/v1/platform",
    "/api/v1/contracts",
    "/api/v1/vacancies",
    "/api/v1/applications",
)
_WEBHOOK_PATH_PREFIX = "/api/v1/payments/webhooks"


@app.middleware("http")
async def supabase_request_audit(request: Request, call_next):
    token = set_request_route(request.method, request.url.path)
    t0 = time.perf_counter() if is_timing_enabled() else 0.0
    try:
        response = await call_next(request)
        if is_timing_enabled():
            ms = (time.perf_counter() - t0) * 1000.0
            _timing_logger.info(
                "timing op=http.total ms=%.1f method=%s path=%s status=%s",
                ms,
                request.method,
                request.url.path,
                response.status_code,
            )
        return response
    finally:
        reset_request_route(token)


@app.middleware("http")
async def idempotency(request: Request, call_next):
    return await idempotency_middleware(request, call_next)


@app.middleware("http")
async def origin_guard(request: Request, call_next):
    blocked = validate_origin(request)
    if blocked is not None:
        return blocked
    return await call_next(request)


@app.middleware("http")
async def light_rate_limit(request: Request, call_next):
    path = request.url.path
    ip = get_client_ip(request)
    if path.startswith("/api/v1"):
        if not check_rate_limit(f"global:{ip}", max_hits=300):
            return JSONResponse(status_code=429, content={"detail": "Juda ko'p so'rov. Biroz kuting."})
    if request.method == "GET" and any(path.startswith(p) for p in _RATE_GET_PATHS):
        bucket_key = f"api:{ip}:{path}"
        if not check_rate_limit(bucket_key, max_hits=30):
            return JSONResponse(status_code=429, content={"detail": "Juda ko'p so'rov. Biroz kuting."})
    if request.method == "POST" and (
        any(path.startswith(p) for p in _RATE_PATHS) or path.startswith(_WEBHOOK_PATH_PREFIX)
    ):
        is_webhook = path.startswith(_WEBHOOK_PATH_PREFIX)
        bucket_key = f"{'webhook' if is_webhook else 'api'}:{ip}:{path}"
        max_hits = 120 if is_webhook else 40
        if not check_rate_limit(bucket_key, max_hits=max_hits):
            return JSONResponse(status_code=429, content={"detail": "Juda ko'p so'rov. Biroz kuting."})
    return await call_next(request)


@app.exception_handler(httpx.HTTPError)
async def httpx_error_handler(_request: Request, _exc: httpx.HTTPError) -> JSONResponse:
    return JSONResponse(
        status_code=503,
        content={"detail": "Ma'lumotlar bazasiga ulanish vaqinchalik uzildi. Qayta urinib ko'ring."},
    )


@app.get("/")
def root():
    return {"message": "IshBor.uz API", "docs": "/docs"}
