from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api.deps import get_db
from app.models import Device, EnergyReading
from app.services import ai_service, analytics

router = APIRouter(tags=["ai"])


def _device_id_by_name(db: Session, name: str | None) -> int | None:
    if not name:
        return None
    device = db.query(Device).filter(Device.name == name).first()
    return device.id if device else None


@router.post("/recommendations/generate", response_model=schemas.RecommendationGenerateResponse)
def generate_recommendations(db: Session = Depends(get_db)):
    period_days = 30
    cutoff = datetime.now(timezone.utc) - timedelta(days=period_days)
    devices = db.query(Device).filter(Device.is_active.is_(True)).all()
    readings = db.query(EnergyReading).filter(EnergyReading.timestamp >= cutoff).all()
    context = analytics.build_analytics_context(devices, readings, period_days)

    raw_recommendations, source = ai_service.generate_recommendations(context)
    stored = []

    for item in raw_recommendations:
        rec = crud.create_recommendation(
            db,
            {
                "recommendation_type": item.get("recommendation_type", "efficiency"),
                "title": item.get("title", "Energy optimization"),
                "description": item.get("description", ""),
                "estimated_saving_npr": item.get("estimated_saving_npr", 0),
                "priority": item.get("priority", "MEDIUM"),
                "device_id": _device_id_by_name(db, item.get("device_name")),
            },
        )
        stored.append(rec)

    return schemas.RecommendationGenerateResponse(recommendations=stored, source=source)


@router.get("/recommendations", response_model=list[schemas.RecommendationRead])
def list_recommendations(
    recommendation_type: str | None = None,
    priority: str | None = None,
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db),
):
    return crud.get_recommendations(
        db,
        recommendation_type=recommendation_type,
        priority=priority,
        limit=limit,
    )


@router.post("/reports/executive", response_model=schemas.ExecutiveReportResponse)
def generate_executive_report(
    period: str = Query(default="30d", pattern="^(7d|14d|30d)$"),
    db: Session = Depends(get_db),
):
    period_days = {"7d": 7, "14d": 14, "30d": 30}[period]
    period_end = date.today()
    period_start = period_end - timedelta(days=period_days)

    cutoff = datetime.now(timezone.utc) - timedelta(days=period_days)
    devices = db.query(Device).filter(Device.is_active.is_(True)).all()
    readings = db.query(EnergyReading).filter(EnergyReading.timestamp >= cutoff).all()
    context = analytics.build_analytics_context(devices, readings, period_days)

    report_content = ai_service.generate_executive_report(context, period_start, period_end)
    report = crud.create_report(
        db,
        {
            "period_start": period_start,
            "period_end": period_end,
            "report_content": report_content,
            "total_kwh": context["total_kwh"],
            "total_cost_npr": context["total_cost_npr"],
        },
    )

    return schemas.ExecutiveReportResponse(
        id=report.id,
        title=report_content.get("title", "Executive Report"),
        generated_at=report.generated_at,
        period_start=report.period_start,
        period_end=report.period_end,
        report_content=report_content,
        total_kwh=float(report.total_kwh),
        total_cost_npr=float(report.total_cost_npr),
    )


@router.get("/reports", response_model=list[schemas.ReportMetadata])
def list_reports(limit: int = Query(default=20, le=100), db: Session = Depends(get_db)):
    return crud.get_reports(db, limit=limit)
