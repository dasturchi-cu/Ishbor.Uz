import httpx
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from postgrest.exceptions import APIError

from app.config import settings
from app.rate_limit import check_rate_limit
from app.idempotency import idempotency_middleware
from app.sentry_init import init_sentry
from app.routers import (
    admin,
    applications,
    health,
    messages,
    notifications,
    orders,
    payments,
    profiles,
    projects,
    reviews,
    saved_items,
    services,
    stats,
    waitlist,
)
from app.supabase_errors import supabase_api_error_handler

init_sentry()

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
app.include_router(messages.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(saved_items.router, prefix="/api/v1")
app.include_router(reviews.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(stats.router, prefix="/api/v1")
app.include_router(waitlist.router, prefix="/api/v1")

app.add_exception_handler(APIError, supabase_api_error_handler)

_RATE_PATHS = (
    "/api/v1/messages",
    "/api/v1/payments/orders",
    "/api/v1/orders",
    "/api/v1/waitlist",
    "/api/v1/profiles/me/referral",
)
_WEBHOOK_PATH_PREFIX = "/api/v1/payments/webhooks"


@app.middleware("http")
async def idempotency(request: Request, call_next):
    return await idempotency_middleware(request, call_next)


@app.middleware("http")
async def light_rate_limit(request: Request, call_next):
    path = request.url.path
    if request.method == "POST" and (
        any(path.startswith(p) for p in _RATE_PATHS) or path.startswith(_WEBHOOK_PATH_PREFIX)
    ):
        ip = request.client.host if request.client else "unknown"
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
