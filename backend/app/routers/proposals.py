"""Proposals router — alias for project_applications."""

from fastapi import APIRouter

from app.routers.applications import (
    create_application,
    list_my_applications,
    list_project_applications,
    update_application_status,
)
from app.schemas import ApplicationResponse

router = APIRouter(prefix="/proposals", tags=["proposals"])

router.add_api_route("", create_application, methods=["POST"], response_model=ApplicationResponse)
router.add_api_route("/mine", list_my_applications, methods=["GET"], response_model=list[ApplicationResponse])
router.add_api_route(
    "/project/{project_id}",
    list_project_applications,
    methods=["GET"],
    response_model=list[ApplicationResponse],
)
router.add_api_route(
    "/{application_id}/status",
    update_application_status,
    methods=["PATCH"],
    response_model=ApplicationResponse,
)
