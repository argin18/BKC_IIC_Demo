import type {
  AnalyticsSummary,
  Device,
  ExecutiveReport,
  PeakHourData,
  Recommendation,
  TrendPoint,
} from "@/lib/types";

export const analyticsSummary: AnalyticsSummary = {
  totalKwh: 18240.6,
  costNpr: 328331,
  peakHour: 14,
  efficiencyScore: 76,
  co2Kg: 7843,
  deviceCount: 10,
  costChangePct: -8.4,
  kwhChangePct: -6.8,
  anomalyCount: 3,
};

const trendSeeds = [520, 548, 566, 590, 574, 613, 641, 612, 598, 670, 704, 682, 651, 720, 746, 710, 690, 735, 812, 786, 742, 701, 689, 731, 755, 724, 706, 694, 672, 658];

export const trendData: TrendPoint[] = trendSeeds.map((value, index) => ({
  date: `Jun ${index + 1}`,
  totalKwh: value,
  costNpr: value * 18,
  baselineKwh: Math.round(value * 0.9),
}));

export const devices: Device[] = [
  { id: 1, name: "Server Room AC Unit", type: "HVAC", location: "Block B - Server Room", ratedKw: 8.5, currentKw: 7.9, totalKwh: 2840, costNpr: 51120, efficiencyPct: 24, status: "critical", lastSeen: "2 min ago" },
  { id: 2, name: "AC Unit Floor 1", type: "HVAC", location: "Academic Block - Floor 1", ratedKw: 6.2, currentKw: 4.8, totalKwh: 2210, costNpr: 39780, efficiencyPct: 68, status: "watch", lastSeen: "2 min ago" },
  { id: 3, name: "AC Unit Floor 2", type: "HVAC", location: "Academic Block - Floor 2", ratedKw: 6.2, currentKw: 5.1, totalKwh: 2368, costNpr: 42624, efficiencyPct: 72, status: "watch", lastSeen: "3 min ago" },
  { id: 4, name: "Lab Computers", type: "Computing", location: "Computer Lab 3", ratedKw: 12, currentKw: 7.3, totalKwh: 2056, costNpr: 37008, efficiencyPct: 83, status: "efficient", lastSeen: "1 min ago" },
  { id: 5, name: "Lighting Zone A", type: "Lighting", location: "Admin Wing", ratedKw: 3.4, currentKw: 2.1, totalKwh: 1225, costNpr: 22050, efficiencyPct: 81, status: "efficient", lastSeen: "1 min ago" },
  { id: 6, name: "Lighting Zone B", type: "Lighting", location: "Library and Hallway", ratedKw: 3.8, currentKw: 2.8, totalKwh: 1390, costNpr: 25020, efficiencyPct: 64, status: "watch", lastSeen: "4 min ago" },
  { id: 7, name: "Elevator Bank", type: "Mechanical", location: "Main Lobby", ratedKw: 10, currentKw: 1.8, totalKwh: 950, costNpr: 17100, efficiencyPct: 89, status: "efficient", lastSeen: "6 min ago" },
  { id: 8, name: "Canteen Equipment", type: "Kitchen", location: "Canteen", ratedKw: 9, currentKw: 6.6, totalKwh: 1842, costNpr: 33156, efficiencyPct: 71, status: "watch", lastSeen: "5 min ago" },
  { id: 9, name: "Security Systems", type: "Security", location: "Campus-wide", ratedKw: 2.1, currentKw: 1.1, totalKwh: 712, costNpr: 12816, efficiencyPct: 92, status: "efficient", lastSeen: "1 min ago" },
  { id: 10, name: "Water Pump", type: "Utility", location: "Service Area", ratedKw: 5.5, currentKw: 0, totalKwh: 648, costNpr: 11664, efficiencyPct: 78, status: "offline", lastSeen: "28 min ago" },
];

export const peakHours: PeakHourData[] = Array.from({ length: 24 }, (_, hour) => {
  const businessBoost = hour >= 9 && hour <= 17 ? 12 : 0;
  const lunchSpike = hour === 14 ? 11 : hour === 13 ? 7 : 0;
  const base = hour < 6 ? 9 : hour < 9 ? 17 : hour < 18 ? 32 : hour < 22 ? 22 : 12;

  return {
    hour,
    avgKwh: base + businessBoost + lunchSpike,
    isPeak: hour >= 13 && hour <= 15,
  };
});

export const recommendations: Recommendation[] = [
  {
    id: 1,
    type: "cost_saving",
    priority: "HIGH",
    title: "Reschedule server room cooling after 6 PM",
    description: "Server Room AC is drawing 340% above its baseline during off-peak windows. Shift the setpoint to 24 C after business hours and schedule a maintenance check for airflow blockage.",
    estimatedSavingNpr: 12400,
    deviceName: "Server Room AC Unit",
    actionLabel: "Create action plan",
  },
  {
    id: 2,
    type: "efficiency",
    priority: "HIGH",
    title: "Investigate HVAC overlap on Floor 2",
    description: "Floor 2 HVAC and Lighting Zone B peak together from 1 PM to 3 PM. Staggering schedules by 30 minutes can reduce the daily peak charge exposure.",
    estimatedSavingNpr: 8300,
    deviceName: "AC Unit Floor 2",
    actionLabel: "Review schedule",
  },
  {
    id: 3,
    type: "sustainability",
    priority: "MEDIUM",
    title: "Reduce idle lighting in admin wing",
    description: "Lighting Zone A remains active between midnight and 5 AM. Occupancy-based dimming can cut avoidable consumption and reduce carbon impact.",
    estimatedSavingNpr: 3900,
    deviceName: "Lighting Zone A",
    actionLabel: "Mark for audit",
  },
  {
    id: 4,
    type: "cost_saving",
    priority: "LOW",
    title: "Batch canteen equipment startup",
    description: "Canteen load jumps sharply at 8 AM. A soft-start sequence can lower the morning demand spike without affecting operations.",
    estimatedSavingNpr: 2100,
    deviceName: "Canteen Equipment",
    actionLabel: "Add to report",
  },
];

export const executiveReport: ExecutiveReport = {
  title: "IIROS Executive Energy Report",
  period: "June 1 - June 30, 2026",
  generatedAt: "June 10, 2026, 5:30 PM",
  kpis: {
    totalKwh: analyticsSummary.totalKwh,
    totalCostNpr: analyticsSummary.costNpr,
    co2Kg: analyticsSummary.co2Kg,
    projectedMonthlySavingNpr: 26700,
  },
  sections: [
    {
      title: "Executive Summary",
      body: "Campus energy consumption is stable overall, but three preventable spikes are increasing monthly cost exposure. The highest-impact issue is server room cooling outside active occupancy windows.",
      bullets: ["Current projected monthly energy cost is NPR 328,331.", "Top three actions can save approximately NPR 26,700 per month.", "Efficiency score is 76, which is good but not yet optimized."],
    },
    {
      title: "Key Findings",
      body: "Peak demand concentrates between 1 PM and 3 PM. HVAC devices account for the largest share of preventable cost and should be prioritized before lower-load systems.",
      bullets: ["Server Room AC Unit is the highest-risk device by baseline deviation.", "Lighting Zone B creates recurring afternoon overlap with HVAC load.", "Water Pump is currently offline and should be checked before demo day."],
    },
    {
      title: "Recommended Actions",
      body: "IIROS recommends operational schedule changes first because they require no hardware investment and are easy to validate within one billing cycle.",
      bullets: ["Adjust server room cooling schedule after business hours.", "Stagger Floor 2 HVAC and lighting loads during the 1 PM to 3 PM peak window.", "Enable occupancy-based lighting policy for admin wing after midnight."],
    },
  ],
};
