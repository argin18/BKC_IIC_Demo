from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.schemas.energy import EnergyReadingRead


class DeviceBase(BaseModel):
    name: str
    device_type: str
    location: str
    rated_power_kw: Decimal


class DeviceCreate(DeviceBase):
    is_active: bool = True


class DeviceRead(DeviceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime


class DeviceWithStatus(DeviceRead):
    current_kw: float | None = None
    status: str = "GREEN"


class DeviceDetailResponse(BaseModel):
    device: DeviceRead
    readings: list[EnergyReadingRead]
    summary: dict[str, Any]
