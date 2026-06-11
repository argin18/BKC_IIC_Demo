from datetime import datetime

from pydantic import BaseModel


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
