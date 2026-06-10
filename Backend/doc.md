# IIROS Backend Documentation

**Intelligent Infrastructure & Resource Optimization System**  
FastAPI + PostgreSQL + Google Gemini AI

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Project Structure](#3-project-structure)
4. [How Components Interact](#4-how-components-interact)
5. [Database Design](#5-database-design)
6. [API Reference](#6-api-reference)
7. [Business Logic & Analytics Rules](#7-business-logic--analytics-rules)
8. [Gemini AI Integration](#8-gemini-ai-integration)
9. [Environment Variables](#9-environment-variables)
10. [Setup & Running](#10-setup--running)
11. [Error Handling](#11-error-handling)
12. [Frontend Integration](#12-frontend-integration)

---

## 1. Overview

IIROS is an AI-powered energy management backend for commercial and institutional buildings in Nepal. It:

- Stores **simulated (or future IoT) energy readings** per device
- Runs **analytics** (cost, peak hours, efficiency, CO₂, anomalies)
- Calls **Google Gemini** to generate recommendations and executive reports
- Exposes a **REST API** consumed by the Next.js dashboard

**Base URL (development):** `http://localhost:8000/api`  
**Interactive docs:** `http://localhost:8000/docs`

---

## 2. System Architecture

```mermaid
flowchart TB
    subgraph Frontend["Next.js Dashboard"]
        UI[Dashboard / Devices / Recommendations / Reports]
    end

    subgraph Backend["FastAPI Backend"]
        API[API Layer<br/>app/api/v1/endpoints]
        CRUD[CRUD Layer<br/>app/crud]
        ANALYTICS[Analytics Service<br/>app/services/analytics.py]
        AI[Gemini AI Service<br/>app/services/ai_service.py]
    end

    subgraph External["External Services"]
        GEMINI[Google Gemini API]
    end

    subgraph Data["PostgreSQL (Neon)"]
        DEVICES[(devices)]
        READINGS[(energy_readings)]
        RECS[(recommendations)]
        REPORTS[(reports)]
    end

    UI -->|HTTP REST| API
    API --> CRUD
    API --> ANALYTICS
    API --> AI
    CRUD --> DEVICES
    CRUD --> READINGS
    CRUD --> RECS
    CRUD --> REPORTS
    ANALYTICS --> READINGS
    ANALYTICS --> DEVICES
    AI --> GEMINI
    AI --> ANALYTICS
```

### Request lifecycle (example: dashboard summary)

1. Frontend calls `GET /api/analytics/summary`
2. **Endpoint** (`analytics.py`) receives the request and opens a DB session
3. **Analytics service** queries `energy_readings` and `devices` for the selected period
4. Service computes KPIs (kWh, cost, peak hour, efficiency, CO₂)
5. **Pydantic schema** validates and shapes the JSON response
6. Frontend renders summary cards

### Request lifecycle (example: AI recommendations)

1. Frontend calls `POST /api/recommendations/generate`
2. **Analytics service** builds a structured context object from DB data
3. **AI service** sends that context to Gemini (or uses fallback rules)
4. Each recommendation is **saved** to `recommendations` table via CRUD
5. Response includes stored recommendations + `source: "gemini" | "fallback"`

---

## 3. Project Structure

```
Backend/
├── app/
│   ├── main.py                    # FastAPI app, CORS, startup, health check
│   ├── core/
│   │   ├── config.py              # Settings from .env
│   │   └── database.py            # SQLAlchemy engine, sessions
│   ├── models/
│   │   └── energy.py              # ORM models (DB tables)
│   ├── schemas/
│   │   ├── device.py              # Device request/response shapes
│   │   ├── energy.py              # Reading request/response shapes
│   │   ├── analytics.py           # Analytics response shapes
│   │   ├── ai.py                  # Recommendation & report shapes
│   │   └── common.py              # Error response shape
│   ├── crud/
│   │   └── device.py              # Pure database read/write functions
│   ├── services/
│   │   ├── analytics.py           # Business logic (no direct HTTP)
│   │   └── ai_service.py          # Gemini API wrapper
│   └── api/
│       ├── deps.py                # Shared dependencies (get_db)
│       └── v1/
│           ├── router.py          # Combines all endpoint routers
│           └── endpoints/
│               ├── devices.py
│               ├── readings.py
│               ├── analytics.py
│               └── ai.py
├── scripts/
│   └── seed.py                    # Populates DB with demo data
├── requirements.txt
├── Procfile                       # Railway: uvicorn app.main:app
├── .env                           # Secrets (not committed)
└── doc.md                         # This file
```

| Layer | Responsibility | Does NOT do |
|-------|----------------|-------------|
| **Endpoints** | HTTP routing, status codes, query params | Business math, Gemini calls directly |
| **Schemas** | Validate input/output JSON | Database access |
| **CRUD** | SQL queries, insert/update | Cost calculations, AI |
| **Services** | Analytics rules, Gemini prompts | HTTP concerns |
| **Models** | Table definitions, relationships | API validation |

---

## 4. How Components Interact

### 4.1 Database ↔ Models ↔ CRUD

- **Models** (`app/models/energy.py`) define SQLAlchemy classes mapped to PostgreSQL tables.
- **CRUD** (`app/crud/device.py`) uses those models to run queries — no business logic.
- Every endpoint that needs data calls `get_db()` → receives a SQLAlchemy `Session` → passes it to CRUD or service functions.

### 4.2 Analytics service ↔ Database

`app/services/analytics.py` reads `Device` and `EnergyReading` rows and computes:

- Total kWh and NPR cost
- Peak hour (hour 0–23 with highest average consumption)
- Per-device efficiency and status (GREEN / YELLOW / ORANGE / RED)
- Facility efficiency score (0–100)
- Anomaly days (z-score on daily totals)
- Trend buckets (hourly aggregation for charts)

**Important:** NPR and CO₂ numbers shown to users come from the analytics engine. Gemini only writes narrative text around these pre-calculated values.

### 4.3 AI service ↔ Analytics ↔ Database

```
energy_readings + devices
        ↓
build_analytics_context()     ← analytics service
        ↓
generate_recommendations()    ← ai_service (Gemini or fallback)
        ↓
create_recommendation()       ← crud → recommendations table
```

If Gemini fails or `GEMINI_API_KEY` is missing, `generate_fallback_recommendations()` in the analytics service produces rule-based recommendations instead.

### 4.4 Seed script ↔ Database

`scripts/seed.py`:

1. Drops and recreates all tables (when `reset=True`)
2. Inserts 10 devices
3. Generates ~7,210 hourly readings over 30 days with realistic patterns
4. Plants demo anomalies (e.g. Server Room Cooling spike at 14:00 yesterday)

Run after first deploy or when you need fresh demo data.

### 4.5 Frontend ↔ Backend

The Next.js app calls the API via `fetch` (typically `lib/api.ts`). CORS is configured in `app/main.py` to allow `http://localhost:3000` and production Vercel URL.

---

## 5. Database Design

PostgreSQL hosted on **Neon**. Four core tables.

### Entity relationship diagram

```mermaid
erDiagram
    devices ||--o{ energy_readings : "has many"
    devices ||--o{ recommendations : "optional FK"
    devices {
        int id PK
        string name
        string device_type
        string location
        decimal rated_power_kw
        boolean is_active
        timestamp created_at
    }
    energy_readings {
        int id PK
        int device_id FK
        timestamp timestamp
        decimal kwh_consumed
        decimal power_kw
        decimal voltage
        decimal current_amps
        decimal power_factor
    }
    recommendations {
        int id PK
        timestamp generated_at
        string recommendation_type
        string title
        text description
        decimal estimated_saving_npr
        string priority
        int device_id FK "nullable"
    }
    reports {
        int id PK
        timestamp generated_at
        date period_start
        date period_end
        jsonb report_content
        decimal total_kwh
        decimal total_cost_npr
    }
```

---

### 5.1 Table: `devices`

Represents a physical or logical energy-consuming unit (HVAC, lighting zone, server rack, etc.).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | INTEGER | NO | Primary key. Auto-increment. |
| `name` | VARCHAR(100) | NO | Human-readable name, e.g. `"Server Room Cooling"`. |
| `device_type` | VARCHAR(50) | NO | Category: `HVAC`, `Lighting`, `Server`, `Security`, `Pump`, `Kitchen`, `Elevator`. Used for status rules. |
| `location` | VARCHAR(100) | NO | Building location, e.g. `"Block B - Server Room"`. |
| `rated_power_kw` | DECIMAL(8,2) | NO | Nameplate capacity in kilowatts. Used to compute efficiency %. |
| `is_active` | BOOLEAN | NO | Default `true`. Inactive devices are excluded from analytics. |
| `created_at` | TIMESTAMP | NO | When the device record was created. Default: now. |

**Relationships:**
- One device → many `energy_readings`
- One device → many `recommendations` (optional; `device_id` can be NULL for facility-wide recs)

**Seeded devices (10):**

| name | device_type | rated_power_kw |
|------|-------------|----------------|
| AC Unit Floor 1 | HVAC | 4.5 |
| AC Unit Floor 2 | HVAC | 4.5 |
| Server Room Cooling | HVAC | 5.0 |
| Lighting Zone A | Lighting | 2.0 |
| Lighting Zone B | Lighting | 2.5 |
| Elevator Bank | Elevator | 3.0 |
| Lab Computers | Server | 6.0 |
| Canteen Equipment | Kitchen | 3.5 |
| Security Systems | Security | 1.5 |
| Water Pump | Pump | 2.8 |

---

### 5.2 Table: `energy_readings`

Core fact table. One row = one device's energy consumption for one time interval (1-hour buckets in seed data; 15-min buckets possible for IoT).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | INTEGER | NO | Primary key. |
| `device_id` | INTEGER | NO | Foreign key → `devices.id`. Which device this reading belongs to. |
| `timestamp` | TIMESTAMP | NO | When the reading was taken (UTC). Indexed for fast range queries. |
| `kwh_consumed` | DECIMAL(10,4) | NO | Energy used in this interval (kWh). Must be ≥ 0. |
| `power_kw` | DECIMAL(8,3) | YES | Instantaneous power draw (kW) at sampling time. |
| `voltage` | DECIMAL(6,2) | YES | Line voltage (V). Reserved for future IoT. |
| `current_amps` | DECIMAL(6,3) | YES | Current (A). Reserved for future IoT. |
| `power_factor` | DECIMAL(4,3) | YES | Efficiency metric 0.00–1.00. Reserved for future IoT. |

**Indexes:**
- `idx_readings_device_time` on (`device_id`, `timestamp DESC`) — fast per-device history
- `idx_readings_timestamp` on (`timestamp DESC`) — fast global time-range queries

**Typical row example:**

```json
{
  "id": 4821,
  "device_id": 3,
  "timestamp": "2026-06-09T14:00:00",
  "kwh_consumed": 17.0000,
  "power_kw": 17.000,
  "voltage": 231.45,
  "current_amps": 73.913,
  "power_factor": 0.912
}
```

**How rows are created:**
- `scripts/seed.py` — bulk demo data
- `POST /api/readings` — single ingest (IoT-ready)
- `POST /api/readings/bulk` — batch ingest

---

### 5.3 Table: `recommendations`

Immutable audit log of AI-generated (or fallback) recommendations. Rows are **inserted**, never updated.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | INTEGER | NO | Primary key. |
| `generated_at` | TIMESTAMP | NO | When the recommendation was created. Default: now. |
| `recommendation_type` | VARCHAR(50) | NO | One of: `cost_saving`, `efficiency`, `sustainability`. |
| `title` | VARCHAR(200) | NO | Short headline for UI cards. |
| `description` | TEXT | NO | Full recommendation text. |
| `estimated_saving_npr` | DECIMAL(12,2) | YES | Estimated monthly saving in Nepalese Rupees. |
| `priority` | VARCHAR(10) | NO | `HIGH`, `MEDIUM`, or `LOW`. |
| `device_id` | INTEGER | YES | FK → `devices.id`. NULL = facility-wide recommendation. |

**Typical row example:**

```json
{
  "id": 1,
  "generated_at": "2026-06-10T11:18:48",
  "recommendation_type": "cost_saving",
  "title": "Optimize Server Room Cooling",
  "description": "Reduce AC setpoint to 24°C during off-peak hours...",
  "estimated_saving_npr": 12400.00,
  "priority": "HIGH",
  "device_id": 3
}
```

---

### 5.4 Table: `reports`

Stores generated executive reports. One row per report generation event.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | INTEGER | NO | Primary key. |
| `generated_at` | TIMESTAMP | NO | When the report was generated. |
| `period_start` | DATE | NO | Report coverage start date. |
| `period_end` | DATE | NO | Report coverage end date. |
| `report_content` | JSONB | NO | Full structured Gemini output (sections, findings, action plan). |
| `total_kwh` | DECIMAL(12,2) | NO | Snapshot of period total kWh at generation time. |
| `total_cost_npr` | DECIMAL(12,2) | NO | Snapshot of period total cost at generation time. |

**`report_content` JSON structure (from Gemini or fallback):**

```json
{
  "title": "Energy Performance Report — June 2026",
  "executive_summary": "...",
  "key_findings": ["...", "..."],
  "cost_analysis": {
    "total_npr": 247644,
    "vs_last_period_pct": 0,
    "breakdown": { "energy_charges": 247644 }
  },
  "sustainability_section": {
    "co2_kg": 5915.94,
    "equivalent_trees": 271.7,
    "recommendation": "..."
  },
  "action_plan": [
    {
      "action": "Adjust AC schedule",
      "priority": "HIGH",
      "saving_npr": 12400,
      "timeline": "2 weeks"
    }
  ],
  "conclusion": "..."
}
```

---

## 6. API Reference

All endpoints are prefixed with `/api`.  
Content-Type: `application/json`.

---

### 6.1 Health

#### `GET /api/health`

Check if the API is running.

**Response `200`:**
```json
{
  "status": "ok",
  "service": "IIROS API"
}
```

---

### 6.2 Devices

#### `GET /api/devices`

List all active devices with live status.

**Logic:**
- Fetches active devices from DB
- Gets latest reading (last 1 hour) for `current_kw`
- Computes `status` from last 7 days of readings using analytics rules

**Response `200`:** Array of devices

```json
[
  {
    "id": 1,
    "name": "AC Unit Floor 1",
    "device_type": "HVAC",
    "location": "Block A - Floor 1",
    "rated_power_kw": "4.50",
    "is_active": true,
    "created_at": "2026-06-10T11:17:40",
    "current_kw": 4.172,
    "status": "ORANGE"
  }
]
```

| Field | Description |
|-------|-------------|
| `current_kw` | Latest power draw (kW), or `null` if no recent reading |
| `status` | `GREEN` / `YELLOW` / `ORANGE` / `RED` — see [§7.3](#73-device-status-rules) |

---

#### `GET /api/devices/{device_id}`

Single device with last 24 hours of readings and summary.

**Path params:** `device_id` (integer)

**Response `200`:**
```json
{
  "device": {
    "id": 3,
    "name": "Server Room Cooling",
    "device_type": "HVAC",
    "location": "Block B - Server Room",
    "rated_power_kw": "5.00",
    "is_active": true,
    "created_at": "2026-06-10T11:17:40"
  },
  "readings": [
    {
      "id": 4821,
      "device_id": 3,
      "timestamp": "2026-06-09T14:00:00",
      "kwh_consumed": "17.0000",
      "power_kw": "17.000",
      "voltage": "231.45",
      "current_amps": "73.913",
      "power_factor": "0.912"
    }
  ],
  "summary": {
    "total_kwh_24h": 89.5,
    "cost_npr": 1611.0,
    "status": "ORANGE"
  }
}
```

**Response `404`:**
```json
{
  "error": true,
  "code": "DEVICE_NOT_FOUND",
  "message": "Device with id=99 does not exist",
  "status": 404
}
```

---

#### `POST /api/devices`

Create a new device (admin / seed use).

**Request body:**
```json
{
  "name": "New Lab AC",
  "device_type": "HVAC",
  "location": "Block C - Lab 1",
  "rated_power_kw": 3.5,
  "is_active": true
}
```

**Response `201`:** Created device object (same shape as `DeviceRead`).

---

### 6.3 Energy Readings

#### `GET /api/readings`

Paginated list of energy readings.

**Query params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `device_id` | int | — | Filter by device |
| `start` | datetime | — | Readings on or after this time (ISO 8601) |
| `end` | datetime | — | Readings on or before this time |
| `limit` | int | 100 | Max rows (max 1000) |
| `offset` | int | 0 | Pagination offset |

**Example:** `GET /api/readings?device_id=3&limit=24`

**Response `200`:** Array of `EnergyReadingRead` objects.

---

#### `POST /api/readings`

Ingest a single energy reading (IoT-ready endpoint).

**Request body:**
```json
{
  "device_id": 3,
  "kwh": 4.25,
  "power_kw": 4.25,
  "timestamp": "2026-06-10T12:00:00",
  "voltage": 230.5,
  "current_amps": 18.5,
  "power_factor": 0.95
}
```

> Note: `kwh` is an alias for `kwh_consumed`.

**Response `201`:** Created reading object.  
**Response `404`:** Device not found.

---

#### `POST /api/readings/bulk`

Bulk insert readings (used by seed scripts or data import).

**Request body:** Array of reading objects (same shape as single POST).

**Response `201`:**
```json
{
  "inserted": 7210
}
```

---

### 6.4 Analytics

#### `GET /api/analytics/summary`

Dashboard KPI cards — the first thing judges see on the demo.

**Query params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | string | — | `7d`, `14d`, or `30d` |
| `days` | int | 30 | Custom day count (1–90) if `period` not set |

**Example:** `GET /api/analytics/summary?period=30d`

**Response `200`:**
```json
{
  "total_kwh": 13818.77,
  "cost_npr": 248737.86,
  "peak_hour": 13,
  "efficiency_score": 52,
  "co2_kg": 5942.07,
  "device_count": 10
}
```

| Field | Description |
|-------|-------------|
| `total_kwh` | Sum of all readings in period |
| `cost_npr` | Total cost at NPR 18/kWh commercial tariff |
| `peak_hour` | Hour (0–23) with highest average consumption |
| `efficiency_score` | Facility score 0–100 (see [§7.4](#74-efficiency-score)) |
| `co2_kg` | CO₂ emitted: `total_kwh × 0.43` |
| `device_count` | Number of active devices |

---

#### `GET /api/analytics/trends`

Time-series data for energy trend charts (Recharts AreaChart).

**Query params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | string | `7d` | `7d`, `14d`, or `30d` |

**Response `200`:**
```json
[
  {
    "timestamp": "2026-06-03T14:00:00",
    "total_kwh": 26.3505,
    "cost_npr": 616.6
  }
]
```

Readings are aggregated into **hourly buckets** across all devices. `cost_npr` includes a 1.3× surge factor for business hours (09:00–17:00).

---

#### `GET /api/analytics/devices`

Per-device consumption breakdown for bar charts and device tables.

**Query params:** `period` — `7d` | `14d` | `30d` (default `30d`)

**Response `200`:**
```json
[
  {
    "device_id": 3,
    "device_name": "Server Room Cooling",
    "total_kwh": 1890.5,
    "cost_npr": 34029.0,
    "efficiency_pct": 60.4,
    "status": "ORANGE"
  }
]
```

Sorted by `total_kwh` descending (highest consumers first).

---

#### `GET /api/analytics/peak-hours`

24-hour heatmap / bar chart data for peak hour visualization.

**Query params:** `period` — `7d` | `14d` | `30d` (default `30d`)

**Response `200`:**
```json
[
  { "hour": 0, "avg_kwh": 1.10, "is_peak": false },
  { "hour": 9, "avg_kwh": 4.85, "is_peak": true },
  { "hour": 14, "avg_kwh": 5.92, "is_peak": true }
]
```

| Field | Description |
|-------|-------------|
| `hour` | 0–23 |
| `avg_kwh` | Average kWh across all devices for that hour |
| `is_peak` | `true` if business hours (9–17) OR highest-consumption hour |

---

### 6.5 AI — Recommendations & Reports

#### `POST /api/recommendations/generate`

Trigger Gemini to analyze facility data and generate recommendations. Results are **saved to the database**.

**Request body:** None

**Flow:**
1. Load last 30 days of readings + all active devices
2. Build analytics context object
3. Call Gemini (or fallback)
4. Insert each recommendation into `recommendations` table
5. Return stored rows + source indicator

**Response `200`:**
```json
{
  "recommendations": [
    {
      "id": 1,
      "generated_at": "2026-06-10T11:18:48",
      "recommendation_type": "cost_saving",
      "title": "Optimize Server Room Cooling",
      "description": "Reduce AC setpoint to 24°C during off-peak hours...",
      "estimated_saving_npr": "12400.00",
      "priority": "HIGH",
      "device_id": 3
    }
  ],
  "source": "gemini"
}
```

| `source` value | Meaning |
|----------------|---------|
| `gemini` | Response from Google Gemini API |
| `fallback` | Rule-based recommendations (Gemini unavailable) |

---

#### `GET /api/recommendations`

Fetch previously generated recommendations (cached in DB).

**Query params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `recommendation_type` | string | — | Filter: `cost_saving`, `efficiency`, `sustainability` |
| `priority` | string | — | Filter: `HIGH`, `MEDIUM`, `LOW` |
| `limit` | int | 20 | Max results (max 100) |

**Response `200`:** Array of recommendation objects (newest first).

---

#### `POST /api/reports/executive`

Generate a full AI executive report for management.

**Query params:** `period` — `7d` | `14d` | `30d` (default `30d`)

**Flow:**
1. Build analytics context for the period
2. Call Gemini for structured report JSON (or fallback template)
3. Save to `reports` table with KPI snapshots
4. Return full report

**Response `200`:**
```json
{
  "id": 1,
  "title": "Energy Performance Report — June 2026",
  "generated_at": "2026-06-10T11:19:16",
  "period_start": "2026-05-11",
  "period_end": "2026-06-10",
  "report_content": {
    "title": "...",
    "executive_summary": "...",
    "key_findings": ["..."],
    "cost_analysis": { "total_npr": 248737.86 },
    "sustainability_section": { "co2_kg": 5942.07 },
    "action_plan": [{ "action": "...", "priority": "HIGH" }],
    "conclusion": "..."
  },
  "total_kwh": 13818.77,
  "total_cost_npr": 248737.86
}
```

---

#### `GET /api/reports`

List metadata for past generated reports (without full `report_content`).

**Query params:** `limit` (default 20, max 100)

**Response `200`:**
```json
[
  {
    "id": 1,
    "generated_at": "2026-06-10T11:19:16",
    "period_start": "2026-05-11",
    "period_end": "2026-06-10",
    "total_kwh": "13818.77",
    "total_cost_npr": "248737.86"
  }
]
```

---

## 7. Business Logic & Analytics Rules

All rules live in `app/services/analytics.py`.

### 7.1 Cost calculation

| Rule | Formula |
|------|---------|
| Base commercial tariff | `cost_npr = kwh × 18.0` (NEA institutional rate) |
| Peak window surcharge | Business hours 09:00–17:00: `cost × 1.3` |
| CO₂ emissions | `co2_kg = total_kwh × 0.43` (NEA 2023 grid factor) |
| Tree equivalent | `co2_kg / 21.77` (avg tree absorbs 21.77 kg CO₂/year) |

### 7.2 Peak hour detection

- Compute average kWh per hour (0–23) across all devices
- `peak_hour` = hour with highest average
- Business hours (9–17) always flagged as `is_peak: true` in heatmap data

### 7.3 Device status rules

| Status | Condition |
|--------|-----------|
| **GREEN** | Avg power is 60–90% of rated capacity |
| **YELLOW** | Underloaded (<30% of rated during business hours) |
| **ORANGE** | Idle waste: non-zero consumption midnight–6 AM (except Server/Security) |
| **RED** | Overloaded: >95% of rated capacity sustained |

### 7.4 Efficiency score

Starts at **100**, then:

| Condition | Penalty |
|-----------|---------|
| Each overloaded (RED) device | −10 |
| Each idle-waste (ORANGE) device | −5 |
| Peak-hour share >40% of daily total | −2 per % over 40 |
| Anomaly day in last 7 days | −5 |
| Zero anomaly days in 30 days | +5 |

Score clamped to 0–100.

| Range | Interpretation |
|-------|----------------|
| 80–100 | Excellent |
| 60–79 | Good |
| 40–59 | Needs Attention |
| <40 | Critical |

### 7.5 Anomaly detection

A day is flagged anomalous if:

```
daily_total_kwh > (30-day average + 2.5 × standard deviation)
```

Simple z-score method — no ML required.

---

## 8. Gemini AI Integration

**File:** `app/services/ai_service.py`  
**Model:** `gemini-2.0-flash` (configurable via `GEMINI_MODEL`)

### What Gemini does

- Generates 5–8 prioritized energy optimization recommendations
- Writes executive summary reports with narrative sections
- Estimates cost savings justification in NPR context

### What Gemini does NOT do

- Does **not** query the database directly
- Does **not** calculate NPR totals (analytics engine provides verified numbers)
- Does **not** control devices
- Does **not** store conversation state (stateless per call)

### Analytics context sent to Gemini

```json
{
  "facility_name": "Itahari International College",
  "period_days": 30,
  "total_kwh": 13818.77,
  "total_cost_npr": 248737.86,
  "co2_kg_emitted": 5942.07,
  "peak_hour": 13,
  "avg_daily_kwh": 460.63,
  "efficiency_score": 52,
  "anomaly_days": ["2026-06-07", "2026-06-03"],
  "devices": [
    {
      "name": "Server Room Cooling",
      "kwh_30d": 1890.5,
      "rated_kw": 5.0,
      "avg_kw": 2.63,
      "efficiency_pct": 60.4,
      "status": "ORANGE"
    }
  ]
}
```

### Error handling

1. Gemini call wrapped in try/except
2. JSON parse failure → retry once with stricter prompt
3. Second failure → `generate_fallback_recommendations()` from analytics service
4. API always returns valid shaped JSON — never exposes raw Gemini errors to frontend

---

## 9. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon) |
| `GEMINI_API_KEY` | Yes* | Google AI Studio API key |
| `GEMINI_MODEL` | No | Default: `gemini-2.0-flash` |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |
| `FACILITY_NAME` | No | Used in AI prompts and reports |

\* Without `GEMINI_API_KEY`, AI endpoints still work using fallback recommendations.

**Example `.env`:**
```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.0-flash
CORS_ORIGINS=http://localhost:3000,https://iiros.vercel.app
FACILITY_NAME=Itahari International College
```

---

## 10. Setup & Running

### Install dependencies

```bash
cd Backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Configure environment

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL and GEMINI_API_KEY
```

### Seed the database

```bash
python scripts/seed.py
```

Expected output: `Seeded 10 devices and 7210 energy readings.`

### Run the server

```bash
uvicorn app.main:app --reload --port 8000
```

### Verify

```bash
curl http://localhost:8000/api/health
curl "http://localhost:8000/api/analytics/summary?period=30d"
```

Open `http://localhost:8000/docs` for Swagger UI.

### Deploy (Railway)

Procfile runs: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

Set the same environment variables in the Railway dashboard.

---

## 11. Error Handling

### Standard error response

```json
{
  "error": true,
  "code": "DEVICE_NOT_FOUND",
  "message": "Device with id=99 does not exist",
  "status": 404
}
```

### Error codes

| Code | HTTP Status | When |
|------|-------------|------|
| `DEVICE_NOT_FOUND` | 404 | Device ID does not exist |
| `INTERNAL_ERROR` | 500 | Unhandled server exception |

---

## 12. Frontend Integration

### Recommended API calls per page

| Page | Endpoints used |
|------|----------------|
| **Dashboard** | `GET /analytics/summary`, `GET /analytics/trends`, `GET /analytics/peak-hours` |
| **Devices** | `GET /devices`, `GET /devices/{id}`, `GET /analytics/devices` |
| **Recommendations** | `POST /recommendations/generate`, `GET /recommendations` |
| **Reports** | `POST /reports/executive`, `GET /reports` |

### Frontend env

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### CORS

Backend allows origins listed in `CORS_ORIGINS`. When connecting frontend to backend for the first time, ensure this includes your Next.js dev server (`http://localhost:3000`).

### Future IoT flow (not built yet)

```
ESP32 / Smart Meter
      ↓ MQTT
MQTT Broker
      ↓
POST /api/readings  →  energy_readings table
      ↓
Analytics + Gemini pipeline (unchanged)
```

The `voltage`, `current_amps`, and `power_factor` columns in `energy_readings` are already reserved for real sensor data.

---

## Quick Reference — All Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health` | Health check |
| GET | `/api/devices` | List devices with status |
| GET | `/api/devices/{id}` | Device detail + 24h readings |
| POST | `/api/devices` | Create device |
| GET | `/api/readings` | List readings (paginated) |
| POST | `/api/readings` | Ingest single reading |
| POST | `/api/readings/bulk` | Bulk ingest readings |
| GET | `/api/analytics/summary` | Dashboard KPIs |
| GET | `/api/analytics/trends` | Time-series chart data |
| GET | `/api/analytics/devices` | Per-device breakdown |
| GET | `/api/analytics/peak-hours` | Peak hour heatmap |
| POST | `/api/recommendations/generate` | Generate AI recommendations |
| GET | `/api/recommendations` | List cached recommendations |
| POST | `/api/reports/executive` | Generate executive report |
| GET | `/api/reports` | List past reports |

---

*IIROS — IICQuest 4.0 Smart Energy Track*
