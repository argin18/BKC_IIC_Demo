from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from statistics import mean, stdev
from typing import Any

from sqlalchemy.orm import Session

from config import get_settings
from models import Device, EnergyReading

settings = get_settings()

BUSINESS_HOURS = range(9, 18)


def calculate_cost_npr(kwh: float, in_peak_window: bool = False) -> float:
    base = kwh * settings.commercial_tariff_npr
    return base * 1.3 if in_peak_window else base


def calculate_co2(kwh: float) -> float:
    return round(kwh * settings.co2_factor_kg_per_kwh, 2)


def calculate_total_kwh(readings: list[EnergyReading]) -> float:
    return round(sum(float(r.kwh_consumed) for r in readings), 2)


def detect_peak_hours(readings: list[EnergyReading]) -> dict[str, Any]:
    hourly_totals: dict[int, list[float]] = defaultdict(list)
    for reading in readings:
        hourly_totals[reading.timestamp.hour].append(float(reading.kwh_consumed))

    hourly_avg = {
        hour: mean(values) for hour, values in hourly_totals.items() if values
    }
    peak_hour = max(hourly_avg, key=hourly_avg.get) if hourly_avg else 14
    peak_kwh = hourly_avg.get(peak_hour, 0.0)

    return {
        "peak_hour": peak_hour,
        "peak_kwh": round(peak_kwh, 4),
        "hourly_avg": hourly_avg,
    }


def get_peak_hour_data(readings: list[EnergyReading]) -> list[dict[str, Any]]:
    peak_info = detect_peak_hours(readings)
    hourly_avg = peak_info["hourly_avg"]
    peak_hour = peak_info["peak_hour"]

    result = []
    for hour in range(24):
        avg_kwh = round(hourly_avg.get(hour, 0.0), 4)
        is_peak = hour in BUSINESS_HOURS or hour == peak_hour
        result.append({"hour": hour, "avg_kwh": avg_kwh, "is_peak": is_peak})
    return result


def _device_status(device: Device, readings: list[EnergyReading]) -> str:
    if not readings:
        return "GREEN"

    rated = float(device.rated_power_kw)
    avg_kw = mean(float(r.power_kw or r.kwh_consumed) for r in readings)
    ratio = avg_kw / rated if rated else 0

    business_readings = [r for r in readings if r.timestamp.hour in BUSINESS_HOURS]
    business_avg = (
        mean(float(r.power_kw or r.kwh_consumed) for r in business_readings)
        if business_readings
        else avg_kw
    )
    business_ratio = business_avg / rated if rated else 0

    if ratio > 0.95:
        return "RED"
    if business_ratio < 0.30:
        return "YELLOW"

    night_readings = [r for r in readings if 0 <= r.timestamp.hour < 6]
    if (
        night_readings
        and mean(float(r.kwh_consumed) for r in night_readings) > 0.1
        and device.device_type not in ("Server", "Security")
    ):
        return "ORANGE"
    if 0.60 <= ratio <= 0.90:
        return "GREEN"
    return "YELLOW"


def calculate_efficiency_score(
    devices: list[Device],
    readings: list[EnergyReading],
    anomaly_days: list[str],
) -> int:
    score = 100
    readings_by_device: dict[int, list[EnergyReading]] = defaultdict(list)
    for reading in readings:
        readings_by_device[reading.device_id].append(reading)

    overloaded = idle_waste = 0
    for device in devices:
        device_readings = readings_by_device.get(device.id, [])
        status = _device_status(device, device_readings)
        if status == "RED":
            overloaded += 1
        elif status == "ORANGE":
            idle_waste += 1

    score -= overloaded * 10
    score -= idle_waste * 5

    daily_totals: dict[date, float] = defaultdict(float)
    peak_window_totals: dict[date, float] = defaultdict(float)
    for reading in readings:
        day = reading.timestamp.date()
        kwh = float(reading.kwh_consumed)
        daily_totals[day] += kwh
        if reading.timestamp.hour in BUSINESS_HOURS:
            peak_window_totals[day] += kwh

    peak_shares = []
    for day, total in daily_totals.items():
        if total > 0:
            peak_shares.append((peak_window_totals[day] / total) * 100)

    if peak_shares:
        avg_peak_share = mean(peak_shares)
        if avg_peak_share > 40:
            score -= int((avg_peak_share - 40) * 2)

    recent_anomalies = [
        d for d in anomaly_days if d >= (date.today() - timedelta(days=7)).isoformat()
    ]
    if recent_anomalies:
        score -= 5
    elif not anomaly_days:
        score += 5

    return max(0, min(100, score))


def detect_anomaly_days(readings: list[EnergyReading]) -> list[str]:
    daily_totals: dict[date, float] = defaultdict(float)
    for reading in readings:
        daily_totals[reading.timestamp.date()] += float(reading.kwh_consumed)

    if len(daily_totals) < 3:
        return []

    values = list(daily_totals.values())
    avg = mean(values)
    spread = stdev(values) if len(values) > 1 else 0
    threshold = avg + 2.5 * spread

    return sorted(
        day.isoformat()
        for day, total in daily_totals.items()
        if total > threshold
    )


def build_device_analytics(
    devices: list[Device],
    readings: list[EnergyReading],
) -> list[dict[str, Any]]:
    readings_by_device: dict[int, list[EnergyReading]] = defaultdict(list)
    for reading in readings:
        readings_by_device[reading.device_id].append(reading)

    results = []
    for device in devices:
        device_readings = readings_by_device.get(device.id, [])
        total_kwh = calculate_total_kwh(device_readings)
        rated = float(device.rated_power_kw)
        avg_kw = (
            mean(float(r.power_kw or r.kwh_consumed) for r in device_readings)
            if device_readings
            else 0
        )
        efficiency_pct = round((avg_kw / rated) * 100, 1) if rated else 0
        results.append(
            {
                "device_id": device.id,
                "device_name": device.name,
                "total_kwh": total_kwh,
                "cost_npr": round(calculate_cost_npr(total_kwh), 2),
                "efficiency_pct": efficiency_pct,
                "status": _device_status(device, device_readings),
            }
        )
    return sorted(results, key=lambda item: item["total_kwh"], reverse=True)


def bucket_trends(readings: list[EnergyReading]) -> list[dict[str, Any]]:
    buckets: dict[datetime, float] = defaultdict(float)
    for reading in readings:
        bucket = reading.timestamp.replace(minute=0, second=0, microsecond=0)
        buckets[bucket] += float(reading.kwh_consumed)

    return [
        {
            "timestamp": ts,
            "total_kwh": round(kwh, 4),
            "cost_npr": round(
                calculate_cost_npr(kwh, in_peak_window=ts.hour in BUSINESS_HOURS),
                2,
            ),
        }
        for ts, kwh in sorted(buckets.items())
    ]


def build_analytics_context(
    devices: list[Device],
    readings: list[EnergyReading],
    period_days: int,
) -> dict[str, Any]:
    total_kwh = calculate_total_kwh(readings)
    peak_info = detect_peak_hours(readings)
    anomaly_days = detect_anomaly_days(readings)
    device_stats = build_device_analytics(devices, readings)

    return {
        "facility_name": settings.facility_name,
        "period_days": period_days,
        "total_kwh": total_kwh,
        "total_cost_npr": round(calculate_cost_npr(total_kwh), 2),
        "co2_kg_emitted": calculate_co2(total_kwh),
        "peak_hour": peak_info["peak_hour"],
        "avg_daily_kwh": round(total_kwh / max(period_days, 1), 2),
        "devices": [
            {
                "name": item["device_name"],
                "kwh_30d": item["total_kwh"],
                "rated_kw": float(
                    next(d.rated_power_kw for d in devices if d.id == item["device_id"])
                ),
                "avg_kw": round(item["total_kwh"] / max(period_days * 24, 1), 3),
                "efficiency_pct": item["efficiency_pct"],
                "status": item["status"],
            }
            for item in device_stats
        ],
        "anomaly_days": anomaly_days,
        "efficiency_score": calculate_efficiency_score(devices, readings, anomaly_days),
    }


def get_analytics_summary(db: Session, days: int = 30) -> dict[str, Any]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    devices = db.query(Device).filter(Device.is_active.is_(True)).all()
    readings = (
        db.query(EnergyReading)
        .filter(EnergyReading.timestamp >= cutoff)
        .all()
    )
    context = build_analytics_context(devices, readings, days)
    return {
        "total_kwh": context["total_kwh"],
        "cost_npr": context["total_cost_npr"],
        "peak_hour": context["peak_hour"],
        "efficiency_score": context["efficiency_score"],
        "co2_kg": context["co2_kg_emitted"],
        "device_count": len(devices),
    }


def generate_fallback_recommendations(context: dict[str, Any]) -> list[dict[str, Any]]:
    recommendations = []
    for device in context.get("devices", [])[:3]:
        if device["status"] in ("RED", "ORANGE", "YELLOW"):
            saving = round(device["kwh_30d"] * 0.15 * settings.commercial_tariff_npr, 2)
            recommendations.append(
                {
                    "title": f"Optimize {device['name']}",
                    "description": (
                        f"{device['name']} is operating at {device['efficiency_pct']}% "
                        f"of rated capacity with status {device['status']}. "
                        "Adjust schedules or setpoints during off-peak hours."
                    ),
                    "recommendation_type": "cost_saving",
                    "priority": "HIGH" if device["status"] == "RED" else "MEDIUM",
                    "estimated_saving_npr": saving,
                    "device_name": device["name"],
                }
            )

    if not recommendations:
        recommendations.append(
            {
                "title": "Shift non-critical loads off peak hours",
                "description": (
                    f"Peak consumption occurs around {context.get('peak_hour', 14)}:00. "
                    "Reschedule water pumps and HVAC pre-cooling to reduce surge costs."
                ),
                "recommendation_type": "efficiency",
                "priority": "MEDIUM",
                "estimated_saving_npr": round(context["total_cost_npr"] * 0.08, 2),
                "device_name": None,
            }
        )
    return recommendations
