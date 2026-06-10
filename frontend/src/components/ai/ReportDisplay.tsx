import { CalendarDays, Download, Leaf, WalletCards, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExecutiveReport } from "@/lib/types";
import { formatKwh, formatNPR } from "@/lib/utils";

interface ReportDisplayProps { report: ExecutiveReport; }

export function ReportDisplay({ report }: ReportDisplayProps) {
  const kpis = [
    { label: "Energy", value: formatKwh(report.kpis.totalKwh), icon: Zap },
    { label: "Cost", value: formatNPR(report.kpis.totalCostNpr), icon: WalletCards },
    { label: "CO2", value: `${report.kpis.co2Kg.toLocaleString("en-NP")} kg`, icon: Leaf },
    { label: "Savings", value: formatNPR(report.kpis.projectedMonthlySavingNpr), icon: Download },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div><CardTitle className="text-xl">{report.title}</CardTitle><CardDescription className="mt-2 flex items-center gap-2"><CalendarDays className="size-4" /> {report.period} - generated {report.generatedAt}</CardDescription></div>
          <Button><Download className="size-4" />Export PDF</Button>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => { const Icon = item.icon; return <div key={item.label} className="rounded-md border bg-muted/30 p-4"><div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground"><Icon className="size-4" /> {item.label}</div><p className="text-lg font-semibold">{item.value}</p></div>; })}
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        {report.sections.map((section) => <Card key={section.title}><CardHeader><CardTitle className="text-base">{section.title}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm leading-6 text-muted-foreground">{section.body}</p><ul className="space-y-2 text-sm">{section.bullets.map((bullet) => <li key={bullet} className="flex gap-2 leading-6"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" /> {bullet}</li>)}</ul></CardContent></Card>)}
      </div>
    </div>
  );
}
