import { CalendarRange, FileText, Leaf, WalletCards } from "lucide-react";

import { ReportDisplay } from "@/components/ai/ReportDisplay";
import { PeakHourChart } from "@/components/charts/PeakHourChart";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchPeakHours, generateExecutiveReport } from "@/lib/api";
import { formatKwh, formatNPR } from "@/lib/utils";

export default async function ReportsPage() {
  const [report, peakHours] = await Promise.all([generateExecutiveReport(), fetchPeakHours()]);
  return <div className="space-y-6"><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><SummaryCard label="Report period" value="30 days" helper={report.period} icon={CalendarRange} tone="blue" /><SummaryCard label="Energy" value={formatKwh(report.kpis.totalKwh)} helper="Included in report" icon={FileText} tone="violet" /><SummaryCard label="Cost" value={formatNPR(report.kpis.totalCostNpr)} helper="NPR projection" icon={WalletCards} tone="green" /><SummaryCard label="CO2" value={`${report.kpis.co2Kg.toLocaleString("en-NP")} kg`} helper="Sustainability metric" icon={Leaf} tone="green" /></section><section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]"><ReportDisplay report={report} /><div className="space-y-6"><PeakHourChart data={peakHours} /><Card><CardHeader><CardTitle>Report pipeline</CardTitle><CardDescription>Future backend handoff points for generated executive reports.</CardDescription></CardHeader><CardContent className="space-y-3 text-sm text-muted-foreground"><p>1. Frontend requests /reports/executive with the selected period.</p><p>2. FastAPI calculates verified KPIs and passes context to Gemini.</p><p>3. IIROS stores the structured report and returns display-ready sections.</p></CardContent></Card></div></section></div>;
}
