from fastapi import APIRouter

from app.api.v1.endpoints import ai, analytics, devices, readings

api_router = APIRouter()
api_router.include_router(devices.router)
api_router.include_router(readings.router)
api_router.include_router(analytics.router)
api_router.include_router(ai.router)
