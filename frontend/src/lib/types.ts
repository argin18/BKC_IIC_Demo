export type DeviceStatus = "efficient" | "watch" | "critical" | "offline";
export type RecommendationPriority = "HIGH" | "MEDIUM" | "LOW";
export type RecommendationType = "cost_saving" | "efficiency" | "sustainability";

export interface AnalyticsSummary {
  totalKwh: number;
  costNpr: number;
  peakHour: number;
  efficiencyScore: number;
  co2Kg: number;
  deviceCount: number;
  costChangePct: number;
  kwhChangePct: number;
  anomalyCount: number;
}

export interface TrendPoint {
  date: string;
  totalKwh: number;
  costNpr: number;
  baselineKwh: number;
}

export interface Device {
  id: number;
  name: string;
  type: string;
  location: string;
  ratedKw: number;
  currentKw: number;
  totalKwh: number;
  costNpr: number;
  efficiencyPct: number;
  status: DeviceStatus;
  lastSeen: string;
}

export interface PeakHourData {
  hour: number;
  avgKwh: number;
  isPeak: boolean;
}

export interface Recommendation {
  id: number;
  type: RecommendationType;
  title: string;
  description: string;
  priority: RecommendationPriority;
  estimatedSavingNpr: number;
  deviceName?: string;
  actionLabel: string;
}

export interface ExecutiveReportSection {
  title: string;
  body: string;
  bullets: string[];
}

export interface ExecutiveReport {
  title: string;
  period: string;
  generatedAt: string;
  kpis: {
    totalKwh: number;
    totalCostNpr: number;
    co2Kg: number;
    projectedMonthlySavingNpr: number;
  };
  sections: ExecutiveReportSection[];
}
