import {
  analyticsSummary,
  devices as deviceMocks,
  executiveReport,
  peakHours,
  recommendations as recommendationMocks,
  trendData,
} from "@/lib/mock-data";
import type {
  AnalyticsSummary,
  Device,
  ExecutiveReport,
  PeakHourData,
  Recommendation,
  TrendPoint,
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

type BackendAnalyticsSummary = {
  total_kwh: number;
  cost_npr: number;
  peak_hour: number;
  efficiency_score: number;
  co2_kg: number;
  device_count: number;
  anomaly_count?: number;
  cost_change_pct?: number;
  kwh_change_pct?: number;
};

type BackendTrendPoint = {
  timestamp: string;
  total_kwh: number;
  cost_npr: number;
};

type BackendDevice = {
  id: number;
  name: string;
  device_type: string;
  location: string;
  rated_power_kw: number | string;
  current_kw: number | string | null;
};

type BackendDeviceAnalytics = {
  device_id: number;
  device_name: string;
  total_kwh: number | string;
  cost_npr: number | string;
  efficiency_pct: number | string;
  status: string;
};

type BackendRecommendationRead = {
  id: number;
  generated_at: string;
  recommendation_type: string;
  title: string;
  description: string;
  estimated_saving_npr: number | string | null;
  priority: string;
  device_id: number | null;
};

type BackendExecutiveReportResponse = {
  id: number | null;
  title: string;
  generated_at: string;
  period_start: string;
  period_end: string;
  report_content: Record<string, any>;
  total_kwh: number | string;
  total_cost_npr: number | string;
};

const STATUS_MAP: Record<string, Device["status"]> = {
  RED: "critical",
  ORANGE: "watch",
  YELLOW: "watch",
  GREEN: "efficient",
};

const backendAnalyticsSummaryFallback: BackendAnalyticsSummary = {
  total_kwh: analyticsSummary.totalKwh,
  cost_npr: analyticsSummary.costNpr,
  peak_hour: analyticsSummary.peakHour,
  efficiency_score: analyticsSummary.efficiencyScore,
  co2_kg: analyticsSummary.co2Kg,
  device_count: analyticsSummary.deviceCount,
  anomaly_count: analyticsSummary.anomalyCount,
  cost_change_pct: analyticsSummary.costChangePct,
  kwh_change_pct: analyticsSummary.kwhChangePct,
};

const backendDeviceFallback: BackendDevice[] = deviceMocks.map((device) => ({
  id: device.id,
  name: device.name,
  device_type: device.type,
  location: device.location,
  rated_power_kw: device.ratedKw,
  current_kw: device.currentKw,
}));

const backendRecommendationFallback: BackendRecommendationRead[] = recommendationMocks.map((item) => ({
  id: item.id,
  generated_at: new Date().toISOString(),
  recommendation_type: item.type,
  title: item.title,
  description: item.description,
  estimated_saving_npr: item.estimatedSavingNpr,
  priority: item.priority,
  device_id: item.deviceName ? item.id : null,
}));

const backendTrendFallback: BackendTrendPoint[] = trendData.map((item) => ({
  timestamp: new Date(item.date).toISOString(),
  total_kwh: item.totalKwh,
  cost_npr: item.costNpr,
}));

const executiveReportFallback: BackendExecutiveReportResponse = {
  id: 1,
  title: executiveReport.title,
  generated_at: new Date().toISOString(),
  period_start: new Date().toISOString().slice(0, 10),
  period_end: new Date().toISOString().slice(0, 10),
  report_content: {
    executive_summary: executiveReport.sections[0]?.body ?? "",
    key_findings: executiveReport.sections[1]?.bullets ?? [],
    cost_analysis: {
      total_npr: executiveReport.kpis.totalCostNpr,
      vs_last_period_pct: 0,
      breakdown: {},
    },
    sustainability_section: {
      co2_kg: executiveReport.kpis.co2Kg,
      equivalent_trees: 0,
      recommendation: executiveReport.sections[2]?.body ?? "",
    },
    action_plan: executiveReport.sections[3]?.bullets.map((line) => ({ action: line, priority: "MEDIUM", saving_npr: 0, timeline: "2 weeks" })) ?? [],
  },
  total_kwh: executiveReport.kpis.totalKwh,
  total_cost_npr: executiveReport.kpis.totalCostNpr,
};

async function request<T>(path: string, fallback: unknown, init?: RequestInit): Promise<T> {
  if (USE_MOCKS) {
    return fallback as T;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      next: { revalidate: 30 },
      ...init,
    });

    if (!response.ok) {
      throw new Error(`IIROS API request failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    console.warn("IIROS API request failed, falling back to mock data:", path, error);
    return fallback as T;
  }
}

function mapSummary(response: BackendAnalyticsSummary): AnalyticsSummary {
  return {
    totalKwh: Number(response.total_kwh),
    costNpr: Number(response.cost_npr),
    peakHour: response.peak_hour,
    efficiencyScore: response.efficiency_score,
    co2Kg: Number(response.co2_kg),
    deviceCount: response.device_count,
    costChangePct: response.cost_change_pct ?? 0,
    kwhChangePct: response.kwh_change_pct ?? 0,
    anomalyCount: response.anomaly_count ?? 0,
  };
}

function mapTrendPoint(point: BackendTrendPoint): TrendPoint {
  return {
    date: new Date(point.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    totalKwh: Number(point.total_kwh),
    costNpr: Number(point.cost_npr),
    baselineKwh: Number((Number(point.total_kwh) * 0.9).toFixed(2)),
  };
}

function mapRecommendation(item: BackendRecommendationRead): Recommendation {
  return {
    id: item.id,
    type: item.recommendation_type as Recommendation["type"],
    title: item.title,
    description: item.description,
    priority: item.priority as Recommendation["priority"],
    estimatedSavingNpr: Number(item.estimated_saving_npr ?? 0),
    deviceName: item.device_id ? `Device ${item.device_id}` : undefined,
    actionLabel: "Review",
  };
}

function mapExecutiveReport(response: BackendExecutiveReportResponse): ExecutiveReport {
  const reportContent = response.report_content ?? {};
  const periodStart = new Date(response.period_start);
  const periodEnd = new Date(response.period_end);
  const generatedAt = new Date(response.generated_at).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const actionPlan = Array.isArray(reportContent.action_plan) ? reportContent.action_plan : [];

  return {
    title: response.title,
    period: `${periodStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${periodEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    generatedAt,
    kpis: {
      totalKwh: Number(response.total_kwh),
      totalCostNpr: Number(response.total_cost_npr),
      co2Kg: Number(reportContent.sustainability_section?.co2_kg ?? 0),
      projectedMonthlySavingNpr: actionPlan.reduce(
        (sum, item) => sum + Number(item.saving_npr ?? 0),
        0,
      ),
    },
    sections: [
      {
        title: "Executive summary",
        body: String(reportContent.executive_summary ?? ""),
        bullets: Array.isArray(reportContent.key_findings)
          ? reportContent.key_findings.map(String)
          : [],
      },
      {
        title: "Cost analysis",
        body: `Total cost is NPR ${Number(response.total_cost_npr).toLocaleString("en-NP")}.`,
        bullets: Array.isArray(reportContent.cost_analysis?.breakdown)
          ? reportContent.cost_analysis.breakdown.map(String)
          : [],
      },
      {
        title: "Sustainability",
        body: String(reportContent.sustainability_section?.recommendation ?? ""),
        bullets: [
          `Estimated CO2: ${Number(reportContent.sustainability_section?.co2_kg ?? 0).toLocaleString("en-NP")} kg`,
          `Equivalent trees: ${Number(reportContent.sustainability_section?.equivalent_trees ?? 0)}`,
        ],
      },
      {
        title: "Action plan",
        body: "Recommended next steps based on the generated report.",
        bullets: actionPlan.map((item: Record<string, any>) => String(item.action ?? item.title ?? "Review action")),
      },
    ],
  };
}

function normalizeDeviceStatus(status: string, currentKw: number): Device["status"] {
  if (currentKw <= 0) return "offline";
  return STATUS_MAP[status] ?? "efficient";
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const response = await request<BackendAnalyticsSummary>("/analytics/summary", backendAnalyticsSummaryFallback);
  return mapSummary(response);
}

export async function fetchTrends(period: "7d" | "14d" | "30d" = "30d"): Promise<TrendPoint[]> {
  const count = period === "7d" ? 7 : period === "14d" ? 14 : 30;
  const response = await request<BackendTrendPoint[]>(`/analytics/trends?period=${period}`, backendTrendFallback.slice(-count));
  return response.map(mapTrendPoint);
}

export async function fetchDevices(): Promise<Device[]> {
  const backendDevices = await request<BackendDevice[]>("/devices", backendDeviceFallback);
  const analytics = await request<BackendDeviceAnalytics[]>("/analytics/devices", []);
  const analyticsById = new Map(analytics.map((item) => [item.device_id, item]));

  return backendDevices.map((device) => {
    const stats = analyticsById.get(device.id);
    const currentKw = Number(device.current_kw ?? 0);

    return {
      id: device.id,
      name: device.name,
      type: device.device_type,
      location: device.location,
      ratedKw: Number(device.rated_power_kw),
      currentKw,
      totalKwh: Number(stats?.total_kwh ?? 0),
      costNpr: Number(stats?.cost_npr ?? 0),
      efficiencyPct: Number(stats?.efficiency_pct ?? 0),
      status: normalizeDeviceStatus(stats?.status ?? "GREEN", currentKw),
      lastSeen: currentKw > 0 ? "live" : "offline",
    };
  });
}

export async function fetchPeakHours(): Promise<PeakHourData[]> {
  return request<PeakHourData[]>("/analytics/peak-hours", peakHours);
}

export async function fetchRecommendations(): Promise<Recommendation[]> {
  const response = await request<BackendRecommendationRead[]>("/recommendations", backendRecommendationFallback);
  return response.map(mapRecommendation);
}

export async function generateRecommendations(): Promise<Recommendation[]> {
  const response = await request<{ recommendations: BackendRecommendationRead[] }>(
    "/recommendations/generate",
    { recommendations: backendRecommendationFallback },
    {
      method: "POST",
    },
  );
  return response.recommendations.map(mapRecommendation);
}

export async function generateExecutiveReport(period: "7d" | "14d" | "30d" = "30d"): Promise<ExecutiveReport> {
  const response = await request<BackendExecutiveReportResponse>(`/reports/executive?period=${period}`, executiveReportFallback, {
    method: "POST",
  });
  return mapExecutiveReport(response);
}
