import { AlertTriangle, Clock3, Gauge, Leaf, WalletCards, Zap } from "lucide-react";

import { RecommendationCard } from "@/components/ai/RecommendationCard";
import { DeviceBarChart } from "@/components/charts/DeviceBarChart";
import { EnergyTrendChart } from "@/components/charts/EnergyTrendChart";
import { PeakHourChart } from "@/components/charts/PeakHourChart";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { DeviceTable } from "@/components/devices/DeviceTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { fetchAnalyticsSummary, fetchDevices, fetchPeakHours, fetchRecommendations, fetchTrends } from "@/lib/api";
import { formatHour, formatKwh, formatNPR } from "@/lib/utils";

export default async function DashboardPage() {
  const [summary, trends, devices, peaks, recs] = await Promise.all([fetchAnalyticsSummary(), fetchTrends("30d"), fetchDevices(), fetchPeakHours(), fetchRecommendations()]);
  const topRecommendations = recs.slice(0, 2);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Total energy" value={formatKwh(summary.totalKwh)} helper="30-day measured usage" change={`${summary.kwhChangePct}%`} icon={Zap} tone="blue" />
        <SummaryCard label="Estimated cost" value={formatNPR(summary.costNpr)} helper="NPR 18 per unit" change={`${summary.costChangePct}%`} icon={WalletCards} tone="green" />
        <SummaryCard label="Peak hour" value={formatHour(summary.peakHour)} helper="Highest average load" icon={Clock3} tone="orange" />
        <SummaryCard label="Efficiency" value={`${summary.efficiencyScore}/100`} helper="Operational score" icon={Gauge} tone="violet" />
        <SummaryCard label="CO2 impact" value={`${summary.co2Kg.toLocaleString("en-NP")} kg`} helper="Nepal grid factor" icon={Leaf} tone="green" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,0.9fr)]"><EnergyTrendChart data={trends} /><DeviceBarChart devices={devices} /></section>

      <section className="grid gap-6 xl:grid-cols-[minmax(340px,0.85fr)_minmax(0,1.15fr)]">
        <PeakHourChart data={peaks} />
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><CardTitle>Facility health</CardTitle><CardDescription>Current operating score and anomaly exposure.</CardDescription></div><Badge variant="outline" className="border-amber-400/30 bg-amber-500/10 text-amber-100"><AlertTriangle className="size-3" /> {summary.anomalyCount} anomalies</Badge></CardHeader>
          <CardContent className="space-y-5"><div><div className="mb-2 flex items-center justify-between text-sm"><span className="text-muted-foreground">Efficiency score</span><span className="font-medium">{summary.efficiencyScore}%</span></div><Progress value={summary.efficiencyScore} /></div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-md border bg-muted/30 p-4"><p className="text-xs text-muted-foreground">Devices tracked</p><p className="mt-2 text-xl font-semibold">{summary.deviceCount}</p></div><div className="rounded-md border bg-muted/30 p-4"><p className="text-xs text-muted-foreground">Critical devices</p><p className="mt-2 text-xl font-semibold text-red-200">{devices.filter((device) => device.status === "critical").length}</p></div><div className="rounded-md border bg-muted/30 p-4"><p className="text-xs text-muted-foreground">Projected savings</p><p className="mt-2 text-xl font-semibold text-emerald-300">{formatNPR(recs.reduce((total, rec) => total + rec.estimatedSavingNpr, 0))}</p></div></div></CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <Card><CardHeader><CardTitle>Device breakdown</CardTitle><CardDescription>Sortable operational table prepared for the future /devices endpoint.</CardDescription></CardHeader><CardContent className="px-0 sm:px-6"><DeviceTable devices={devices.slice(0, 6)} /></CardContent></Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">{topRecommendations.map((recommendation) => <RecommendationCard key={recommendation.id} recommendation={recommendation} />)}</div>
      </section>
    </div>
  );
}
