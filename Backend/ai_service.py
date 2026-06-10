import json
import logging
import os
import re
from datetime import date, datetime, timezone
from typing import Any

from google import genai

from analytics import generate_fallback_recommendations
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def _get_client() -> genai.Client | None:
    if not settings.gemini_api_key:
        return None
    os.environ.setdefault("GEMINI_API_KEY", settings.gemini_api_key)
    return genai.Client(api_key=settings.gemini_api_key)


def _extract_json(text: str) -> Any:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned)


def _call_gemini(prompt: str) -> str:
    client = _get_client()
    if client is None:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
        config={"temperature": 0.2},
    )
    return response.text or ""


def generate_recommendations(
    analytics_context: dict[str, Any],
    count: int = 5,
) -> tuple[list[dict[str, Any]], str]:
    prompt = f"""You are an expert energy efficiency consultant for commercial buildings in Nepal.
Analyze this energy data for {analytics_context.get("facility_name", "the facility")}
and generate {count} specific, actionable recommendations.

ANALYTICS CONTEXT:
{json.dumps(analytics_context, indent=2, default=str)}

CONTEXT: Nepal electricity tariff NPR 12/unit (residential) to NPR 18/unit (commercial).
Grid emission factor: 0.43 kg CO2/kWh (NEA 2023).

Return ONLY a valid JSON array, no markdown, no explanation:
[{{"title":"...","description":"...","recommendation_type":"cost_saving|efficiency|sustainability","priority":"HIGH|MEDIUM|LOW","estimated_saving_npr":12400,"estimated_saving_kwh":689,"action_steps":["step1","step2"],"device_name":"...or null"}}]
"""

    for attempt in range(2):
        try:
            text = _call_gemini(
                prompt if attempt == 0 else prompt + "\nReturn ONLY valid JSON."
            )
            parsed = _extract_json(text)
            if isinstance(parsed, list) and parsed:
                return parsed, "gemini"
        except Exception as exc:
            logger.error("Gemini recommendation attempt %s failed: %s", attempt + 1, exc)

    return generate_fallback_recommendations(analytics_context), "fallback"


def generate_executive_report(
    analytics_context: dict[str, Any],
    period_start: date,
    period_end: date,
) -> dict[str, Any]:
    prompt = f"""You are an energy management consultant writing an executive report for a Nepali institution.
Use ONLY the verified numbers from the analytics context below. Do not invent new totals.

ANALYTICS CONTEXT:
{json.dumps(analytics_context, indent=2, default=str)}

PERIOD: {period_start.isoformat()} to {period_end.isoformat()}

Return ONLY valid JSON with this shape:
{{
  "title": "Monthly Energy Performance Report",
  "executive_summary": "...",
  "key_findings": ["...", "..."],
  "cost_analysis": {{"total_npr": 0, "vs_last_period_pct": 0, "breakdown": {{}}}},
  "sustainability_section": {{"co2_kg": 0, "equivalent_trees": 0, "recommendation": "..."}},
  "action_plan": [{{"action": "...", "priority": "HIGH", "saving_npr": 0, "timeline": "2 weeks"}}],
  "conclusion": "..."
}}
"""

    for attempt in range(2):
        try:
            text = _call_gemini(
                prompt if attempt == 0 else prompt + "\nReturn ONLY valid JSON."
            )
            parsed = _extract_json(text)
            if isinstance(parsed, dict):
                return parsed
        except Exception as exc:
            logger.error("Gemini report attempt %s failed: %s", attempt + 1, exc)

    co2 = analytics_context.get("co2_kg_emitted", 0)
    return {
        "title": f"Energy Performance Report — {period_end.strftime('%B %Y')}",
        "executive_summary": (
            f"Over {analytics_context.get('period_days', 30)} days, "
            f"{analytics_context.get('facility_name', 'the facility')} consumed "
            f"{analytics_context.get('total_kwh', 0)} kWh at an estimated cost of "
            f"NPR {analytics_context.get('total_cost_npr', 0):,.0f}."
        ),
        "key_findings": [
            f"Peak load occurs around {analytics_context.get('peak_hour', 14)}:00.",
            f"Facility efficiency score: {analytics_context.get('efficiency_score', 0)}/100.",
            f"Anomaly days detected: {', '.join(analytics_context.get('anomaly_days', [])[:3]) or 'none'}.",
        ],
        "cost_analysis": {
            "total_npr": analytics_context.get("total_cost_npr", 0),
            "vs_last_period_pct": 0,
            "breakdown": {"energy_charges": analytics_context.get("total_cost_npr", 0)},
        },
        "sustainability_section": {
            "co2_kg": co2,
            "equivalent_trees": round(co2 / 21.77, 1),
            "recommendation": "Prioritize peak-hour load shifting to reduce grid emissions.",
        },
        "action_plan": [
            {
                "action": item["title"],
                "priority": item["priority"],
                "saving_npr": item.get("estimated_saving_npr", 0),
                "timeline": "2-4 weeks",
            }
            for item in generate_fallback_recommendations(analytics_context)[:3]
        ],
        "conclusion": "Immediate operational adjustments can reduce costs without new hardware.",
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
