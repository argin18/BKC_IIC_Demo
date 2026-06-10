import {
  analyticsSummary,
  devices,
  executiveReport,
  peakHours,
  recommendations,
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
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";

async function request<T>(path: string, fallback: T): Promise<T> {
  if (USE_MOCKS) {
    return fallback;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      throw new Error(`IIROS API request failed: ${response.status}`);
    }

    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  return request("/analytics/summary", analyticsSummary);
}

export function fetchTrends(period: "7d" | "14d" | "30d" = "30d"): Promise<TrendPoint[]> {
  const count = period === "7d" ? 7 : period === "14d" ? 14 : 30;
  return request(`/analytics/trends?period=${period}`, trendData.slice(-count));
}

export function fetchDevices(): Promise<Device[]> {
  return request("/devices", devices);
}

export function fetchPeakHours(): Promise<PeakHourData[]> {
  return request("/analytics/peak-hours", peakHours);
}

export function fetchRecommendations(): Promise<Recommendation[]> {
  return request("/recommendations", recommendations);
}

export function generateRecommendations(): Promise<Recommendation[]> {
  return request("/recommendations/generate", recommendations);
}

export function generateExecutiveReport(): Promise<ExecutiveReport> {
  return request("/reports/executive", executiveReport);
}
