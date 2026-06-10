from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

import crud
import schemas
from database import get_db

router = APIRouter(prefix="/readings", tags=["readings"])


@router.get("", response_model=list[schemas.EnergyReadingRead])
def list_readings(
    device_id: int | None = None,
    start: datetime | None = None,
    end: datetime | None = None,
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    return crud.get_readings(
        db,
        device_id=device_id,
        start=start,
        end=end,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=schemas.EnergyReadingRead, status_code=201)
def ingest_reading(reading: schemas.EnergyReadingCreate, db: Session = Depends(get_db)):
    device = crud.get_device(db, reading.device_id)
    if not device:
        raise HTTPException(
            status_code=404,
            detail={
                "error": True,
                "code": "DEVICE_NOT_FOUND",
                "message": f"Device with id={reading.device_id} does not exist",
                "status": 404,
            },
        )
    return crud.create_reading(db, reading)


@router.post("/bulk", status_code=201)
def bulk_ingest_readings(
    readings: list[schemas.EnergyReadingCreate],
    db: Session = Depends(get_db),
):
    count = crud.bulk_create_readings(db, readings)
    return {"inserted": count}
