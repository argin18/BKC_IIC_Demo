import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  label: string;
  value: string;
  helper: string;
  change?: string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "orange" | "red" | "violet";
}

const tones = {
  blue: "bg-blue-500/12 text-blue-200 ring-blue-400/20",
  green: "bg-emerald-500/12 text-emerald-200 ring-emerald-400/20",
  orange: "bg-amber-500/12 text-amber-100 ring-amber-400/20",
  red: "bg-red-500/12 text-red-100 ring-red-400/20",
  violet: "bg-violet-500/12 text-violet-100 ring-violet-400/20",
};

export function SummaryCard({ label, value, helper, change, icon: Icon, tone = "blue" }: SummaryCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 truncate text-2xl font-semibold tracking-normal">{value}</p></div>
          <div className={cn("grid size-10 shrink-0 place-items-center rounded-md ring-1", tones[tone])}><Icon className="size-5" /></div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 text-xs"><span className="truncate text-muted-foreground">{helper}</span>{change ? <span className="shrink-0 font-medium text-emerald-300">{change}</span> : null}</div>
      </CardContent>
    </Card>
  );
}
