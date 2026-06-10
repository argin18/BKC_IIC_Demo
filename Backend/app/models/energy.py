from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    device_type = Column(String(50), nullable=False)
    location = Column(String(100), nullable=False)
    rated_power_kw = Column(Numeric(8, 2), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    readings = relationship("EnergyReading", back_populates="device", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="device")


class EnergyReading(Base):
    __tablename__ = "energy_readings"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    kwh_consumed = Column(Numeric(10, 4), nullable=False)
    power_kw = Column(Numeric(8, 3), nullable=True)
    voltage = Column(Numeric(6, 2), nullable=True)
    current_amps = Column(Numeric(6, 3), nullable=True)
    power_factor = Column(Numeric(4, 3), nullable=True)

    device = relationship("Device", back_populates="readings")

    __table_args__ = (
        Index("idx_readings_device_time", "device_id", timestamp.desc()),
        Index("idx_readings_timestamp", timestamp.desc()),
    )


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    generated_at = Column(DateTime, server_default=func.now(), nullable=False)
    recommendation_type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    estimated_saving_npr = Column(Numeric(12, 2), nullable=True)
    priority = Column(String(10), nullable=False)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)

    device = relationship("Device", back_populates="recommendations")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    generated_at = Column(DateTime, server_default=func.now(), nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    report_content = Column(JSONB, nullable=False)
    total_kwh = Column(Numeric(12, 2), nullable=False)
    total_cost_npr = Column(Numeric(12, 2), nullable=False)
