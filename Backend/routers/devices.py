from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import analytics
import crud
import schemas
from database import get_db

router = APIRouter(prefix="/devices", tags=["devices"])


@router.get("", response_model=list[schemas.DeviceWithStatus])
def list_devices(db: Session = Depends(get_db)):
    devices = crud.get_devices(db)
    cutoff = datetime.now(timezone.utc) - timedelta(hours=1)
    response = []

    for device in devices:
        latest = crud.get_readings(db, device_id=device.id, start=cutoff, limit=1)
        current_kw = float(latest[0].power_kw or latest[0].kwh_consumed) if latest else None
        recent = crud.get_readings(
            db,
            device_id=device.id,
            start=datetime.now(timezone.utc) - timedelta(days=7),
            limit=5000,
        )
        status = analytics._device_status(device, recent)

        response.append(
            schemas.DeviceWithStatus(
                id=device.id,
                name=device.name,
                device_type=device.device_type,
                location=device.location,
                rated_power_kw=device.rated_power_kw,
                is_active=device.is_active,
                created_at=device.created_at,
                current_kw=current_kw,
                status=status,
            )
        )
    return response


@router.get("/{device_id}", response_model=schemas.DeviceDetailResponse)
def get_device_detail(device_id: int, db: Session = Depends(get_db)):
    device = crud.get_device(db, device_id)
    if not device:
        raise HTTPException(
            status_code=404,
            detail={
                "error": True,
                "code": "DEVICE_NOT_FOUND",
                "message": f"Device with id={device_id} does not exist",
                "status": 404,
            },
        )

    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    readings = crud.get_readings(db, device_id=device_id, start=cutoff, limit=500)
    total_kwh = analytics.calculate_total_kwh(readings)

    return schemas.DeviceDetailResponse(
        device=device,
        readings=readings,
        summary={
            "total_kwh_24h": total_kwh,
            "cost_npr": analytics.calculate_cost_npr(total_kwh),
            "status": analytics._device_status(device, readings),
        },
    )


@router.post("", response_model=schemas.DeviceRead, status_code=201)
def create_device(device: schemas.DeviceCreate, db: Session = Depends(get_db)):
    return crud.create_device(db, device)
