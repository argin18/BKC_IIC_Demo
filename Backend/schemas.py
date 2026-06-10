from datetime import date, datetime
from decimal import Decimal
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


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
    readings: list["EnergyReadingRead"]
    summary: dict[str, Any]


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


class AnalyticsSummary(BaseModel):
    total_kwh: float
    cost_npr: float
    peak_hour: int
    efficiency_score: int
    co2_kg: float
    device_count: int


class TrendPoint(BaseModel):
    timestamp: datetime
    total_kwh: float
    cost_npr: float


class DeviceAnalytics(BaseModel):
    device_id: int
    device_name: str
    total_kwh: float
    cost_npr: float
    efficiency_pct: float
    status: str


class PeakHourData(BaseModel):
    hour: int
    avg_kwh: float
    is_peak: bool


class RecommendationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    generated_at: datetime
    recommendation_type: str
    title: str
    description: str
    estimated_saving_npr: Decimal | None = None
    priority: str
    device_id: int | None = None


class RecommendationGenerateResponse(BaseModel):
    recommendations: list[RecommendationRead]
    source: Literal["gemini", "fallback"]


class ExecutiveReportResponse(BaseModel):
    id: int | None = None
    title: str
    generated_at: datetime
    period_start: date
    period_end: date
    report_content: dict[str, Any]
    total_kwh: float
    total_cost_npr: float


class ReportMetadata(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    generated_at: datetime
    period_start: date
    period_end: date
    total_kwh: Decimal
    total_cost_npr: Decimal


class ErrorResponse(BaseModel):
    error: bool = True
    code: str
    message: str
    status: int
