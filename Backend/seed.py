import random
from datetime import datetime, timedelta, timezone

from database import Base, SessionLocal, engine
from models import Device, EnergyReading

DEVICE_CONFIGS = [
    {"name": "AC Unit Floor 1", "device_type": "HVAC", "location": "Block A - Floor 1", "rated_power_kw": 4.5},
    {"name": "AC Unit Floor 2", "device_type": "HVAC", "location": "Block A - Floor 2", "rated_power_kw": 4.5},
    {"name": "Server Room Cooling", "device_type": "HVAC", "location": "Block B - Server Room", "rated_power_kw": 5.0},
    {"name": "Lighting Zone A", "device_type": "Lighting", "location": "Block A - Corridors", "rated_power_kw": 2.0},
    {"name": "Lighting Zone B", "device_type": "Lighting", "location": "Block B - Labs", "rated_power_kw": 2.5},
    {"name": "Elevator Bank", "device_type": "Elevator", "location": "Main Building", "rated_power_kw": 3.0},
    {"name": "Lab Computers", "device_type": "Server", "location": "Block B - Lab 3", "rated_power_kw": 6.0},
    {"name": "Canteen Equipment", "device_type": "Kitchen", "location": "Canteen", "rated_power_kw": 3.5},
    {"name": "Security Systems", "device_type": "Security", "location": "Campus-wide", "rated_power_kw": 1.5},
    {"name": "Water Pump", "device_type": "Pump", "location": "Utility Block", "rated_power_kw": 2.8},
]

ANOMALY_DAY_OFFSETS = [3, 9, 22]


def _load_multiplier(device_type: str, hour: int) -> float:
    if device_type == "HVAC":
        if 9 <= hour <= 17:
            return random.uniform(0.75, 1.0)
        if 0 <= hour < 6:
            return random.uniform(0.15, 0.35)
        return random.uniform(0.4, 0.7)
    if device_type == "Lighting":
        if 7 <= hour <= 19:
            return random.uniform(0.7, 1.0)
        return random.uniform(0.02, 0.1)
    if device_type == "Server":
        return random.uniform(0.55, 0.75)
    if device_type == "Security":
        return random.uniform(0.35, 0.5)
    if device_type == "Kitchen":
        if 10 <= hour <= 14 or 17 <= hour <= 20:
            return random.uniform(0.6, 0.95)
        return random.uniform(0.1, 0.3)
    if device_type == "Pump":
        if hour in (6, 7, 18, 19):
            return random.uniform(0.8, 1.0)
        return random.uniform(0.05, 0.2)
    return random.uniform(0.4, 0.8)


def seed_database(reset: bool = True) -> None:
    if reset:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        devices = [Device(**config) for config in DEVICE_CONFIGS]
        db.add_all(devices)
        db.flush()

        end_time = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
        start_time = end_time - timedelta(days=30)
        current_time = start_time
        readings: list[EnergyReading] = []

        server_ac = next(d for d in devices if d.name == "Server Room Cooling")

        while current_time <= end_time:
            day_offset = (end_time.date() - current_time.date()).days
            is_anomaly_day = day_offset in ANOMALY_DAY_OFFSETS

            for device in devices:
                multiplier = _load_multiplier(device.device_type, current_time.hour)
                noise = random.uniform(0.95, 1.05)
                power_kw = float(device.rated_power_kw) * multiplier * noise

                if (
                    device.id == server_ac.id
                    and day_offset == 1
                    and current_time.hour == 14
                ):
                    power_kw = float(device.rated_power_kw) * 3.4

                if is_anomaly_day and device.device_type == "HVAC" and 13 <= current_time.hour <= 15:
                    power_kw *= random.uniform(1.4, 1.8)

                kwh = round(power_kw, 4)

                readings.append(
                    EnergyReading(
                        device_id=device.id,
                        timestamp=current_time,
                        kwh_consumed=kwh,
                        power_kw=round(power_kw, 3),
                        voltage=round(random.uniform(228, 235), 2),
                        current_amps=round(power_kw * 1000 / 230, 3),
                        power_factor=round(random.uniform(0.85, 0.98), 3),
                    )
                )

            current_time += timedelta(hours=1)

        db.add_all(readings)
        db.commit()
        print(f"Seeded {len(devices)} devices and {len(readings)} energy readings.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
