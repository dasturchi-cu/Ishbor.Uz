from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from postgrest.exceptions import APIError

from app.config import settings
from app.routers import admin, health, messages, orders, profiles, projects, reviews, services, stats
from app.supabase_errors import supabase_api_error_handler

app = FastAPI(
    title="IshBor.uz API",
    description="Supabase + FastAPI backend",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1")
app.include_router(profiles.router, prefix="/api/v1")
app.include_router(services.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")
app.include_router(messages.router, prefix="/api/v1")
app.include_router(reviews.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(stats.router, prefix="/api/v1")

app.add_exception_handler(APIError, supabase_api_error_handler)


@app.get("/")
def root():
    return {"message": "IshBor.uz API", "docs": "/docs"}
