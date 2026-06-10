from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import desc
from sqlalchemy.orm import Session

import models
import schemas


def get_devices(db: Session, active_only: bool = True) -> list[models.Device]:
    query = db.query(models.Device)
    if active_only:
        query = query.filter(models.Device.is_active.is_(True))
    return query.order_by(models.Device.id).all()


def get_device(db: Session, device_id: int) -> models.Device | None:
    return db.query(models.Device).filter(models.Device.id == device_id).first()


def create_device(db: Session, device: schemas.DeviceCreate) -> models.Device:
    db_device = models.Device(
        name=device.name,
        device_type=device.device_type,
        location=device.location,
        rated_power_kw=device.rated_power_kw,
        is_active=device.is_active,
    )
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device


def get_readings(
    db: Session,
    device_id: int | None = None,
    start: datetime | None = None,
    end: datetime | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[models.EnergyReading]:
    query = db.query(models.EnergyReading)
    if device_id is not None:
        query = query.filter(models.EnergyReading.device_id == device_id)
    if start is not None:
        query = query.filter(models.EnergyReading.timestamp >= start)
    if end is not None:
        query = query.filter(models.EnergyReading.timestamp <= end)
    return (
        query.order_by(desc(models.EnergyReading.timestamp))
        .offset(offset)
        .limit(limit)
        .all()
    )


def create_reading(db: Session, reading: schemas.EnergyReadingCreate) -> models.EnergyReading:
    db_reading = models.EnergyReading(
        device_id=reading.device_id,
        timestamp=reading.timestamp or datetime.now(timezone.utc),
        kwh_consumed=reading.kwh_consumed,
        power_kw=reading.power_kw,
        voltage=reading.voltage,
        current_amps=reading.current_amps,
        power_factor=reading.power_factor,
    )
    db.add(db_reading)
    db.commit()
    db.refresh(db_reading)
    return db_reading


def bulk_create_readings(db: Session, readings: list[schemas.EnergyReadingCreate]) -> int:
    db_readings = [
        models.EnergyReading(
            device_id=reading.device_id,
            timestamp=reading.timestamp or datetime.now(timezone.utc),
            kwh_consumed=reading.kwh_consumed,
            power_kw=reading.power_kw,
            voltage=reading.voltage,
            current_amps=reading.current_amps,
            power_factor=reading.power_factor,
        )
        for reading in readings
    ]
    db.bulk_save_objects(db_readings)
    db.commit()
    return len(db_readings)


def get_recommendations(
    db: Session,
    recommendation_type: str | None = None,
    priority: str | None = None,
    limit: int = 20,
) -> list[models.Recommendation]:
    query = db.query(models.Recommendation).order_by(desc(models.Recommendation.generated_at))
    if recommendation_type:
        query = query.filter(models.Recommendation.recommendation_type == recommendation_type)
    if priority:
        query = query.filter(models.Recommendation.priority == priority)
    return query.limit(limit).all()


def create_recommendation(db: Session, data: dict) -> models.Recommendation:
    rec = models.Recommendation(
        recommendation_type=data["recommendation_type"],
        title=data["title"],
        description=data["description"],
        estimated_saving_npr=Decimal(str(data.get("estimated_saving_npr", 0))),
        priority=data["priority"],
        device_id=data.get("device_id"),
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec


def create_report(db: Session, data: dict) -> models.Report:
    report = models.Report(
        period_start=data["period_start"],
        period_end=data["period_end"],
        report_content=data["report_content"],
        total_kwh=Decimal(str(data["total_kwh"])),
        total_cost_npr=Decimal(str(data["total_cost_npr"])),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def get_reports(db: Session, limit: int = 20) -> list[models.Report]:
    return (
        db.query(models.Report)
        .order_by(desc(models.Report.generated_at))
        .limit(limit)
        .all()
    )
