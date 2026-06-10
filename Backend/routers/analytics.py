from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

import analytics
import schemas
from database import get_db
from models import Device, EnergyReading

router = APIRouter(prefix="/analytics", tags=["analytics"])

PERIOD_MAP = {"7d": 7, "14d": 14, "30d": 30}


def _resolve_days(period: str | None, days: int | None) -> int:
    if period and period in PERIOD_MAP:
        return PERIOD_MAP[period]
    return days or 30


@router.get("/summary", response_model=schemas.AnalyticsSummary)
def get_summary(
    period: str | None = Query(default=None, pattern="^(7d|14d|30d)$"),
    days: int | None = Query(default=None, ge=1, le=90),
    db: Session = Depends(get_db),
):
    resolved_days = _resolve_days(period, days)
    return analytics.get_analytics_summary(db, resolved_days)


@router.get("/trends", response_model=list[schemas.TrendPoint])
def get_trends(
    period: str = Query(default="7d", pattern="^(7d|14d|30d)$"),
    db: Session = Depends(get_db),
):
    days = PERIOD_MAP[period]
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    readings = (
        db.query(EnergyReading)
        .filter(EnergyReading.timestamp >= cutoff)
        .order_by(EnergyReading.timestamp.asc())
        .all()
    )
    return analytics.bucket_trends(readings)


@router.get("/devices", response_model=list[schemas.DeviceAnalytics])
def get_device_breakdown(
    period: str = Query(default="30d", pattern="^(7d|14d|30d)$"),
    db: Session = Depends(get_db),
):
    days = PERIOD_MAP[period]
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    devices = db.query(Device).filter(Device.is_active.is_(True)).all()
    readings = (
        db.query(EnergyReading)
        .filter(EnergyReading.timestamp >= cutoff)
        .all()
    )
    return analytics.build_device_analytics(devices, readings)


@router.get("/peak-hours", response_model=list[schemas.PeakHourData])
def get_peak_hours(
    period: str = Query(default="30d", pattern="^(7d|14d|30d)$"),
    db: Session = Depends(get_db),
):
    days = PERIOD_MAP[period]
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    readings = (
        db.query(EnergyReading)
        .filter(EnergyReading.timestamp >= cutoff)
        .all()
    )
    return analytics.get_peak_hour_data(readings)
