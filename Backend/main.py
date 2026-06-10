import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import get_settings
from database import Base, engine, verify_db_connection
from routers import ai, analytics, devices, readings

logging.basicConfig(level=logging.INFO)
settings = get_settings()

app = FastAPI(title="IIROS API", version="1.0.0", description="Intelligent Infrastructure & Resource Optimization System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(devices.router, prefix="/api")
app.include_router(readings.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(ai.router, prefix="/api")


@app.on_event("startup")
def on_startup():
    try:
        Base.metadata.create_all(bind=engine)
        verify_db_connection()
        logging.info("IIROS API started — database connection verified")
    except Exception as exc:
        logging.warning("Database unavailable at startup: %s", exc)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "IIROS API"}


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logging.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "code": "INTERNAL_ERROR",
            "message": str(exc),
            "status": 500,
        },
    )
