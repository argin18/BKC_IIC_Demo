from datetime import date, datetime
from decimal import Decimal
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict


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
