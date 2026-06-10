from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class EnergyReadingCreate(BaseModel):
    device_id: int
    kwh_consumed: float = Field(alias="kwh")
    power_kw: float | None = None
    timestamp: datetime | None = None
    voltage: float | None = None
    current_amps: float | None = None
    power_factor: float | None = None

    model_config = ConfigDict(populate_by_name=True)


class EnergyReadingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    device_id: int
    timestamp: datetime
    kwh_consumed: Decimal
    power_kw: Decimal | None = None
    voltage: Decimal | None = None
    current_amps: Decimal | None = None
    power_factor: Decimal | None = None
