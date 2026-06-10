import { AlertTriangle, CheckCircle2, Leaf, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Recommendation } from "@/lib/types";
import { formatNPR } from "@/lib/utils";

const priorityTone = {
  HIGH: "border-red-400/30 bg-red-500/10 text-red-100",
  MEDIUM: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  LOW: "border-blue-400/30 bg-blue-500/10 text-blue-100",
};
const typeIcon = { cost_saving: WalletCards, efficiency: CheckCircle2, sustainability: Leaf };

interface RecommendationCardProps { recommendation: Recommendation; }

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const Icon = typeIcon[recommendation.type] ?? AlertTriangle;
  return (
    <Card className="h-full">
      <CardHeader className="gap-4">
        <div className="flex items-start justify-between gap-3"><div className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20"><Icon className="size-5" /></div><Badge variant="outline" className={priorityTone[recommendation.priority]}>{recommendation.priority}</Badge></div>
        <CardTitle className="text-base leading-6">{recommendation.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        <p className="text-sm leading-6 text-muted-foreground">{recommendation.description}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-4"><div><p className="text-xs text-muted-foreground">Estimated monthly saving</p><p className="font-semibold text-emerald-300">{formatNPR(recommendation.estimatedSavingNpr)}</p></div><Button variant="secondary" size="sm">{recommendation.actionLabel}</Button></div>
      </CardContent>
    </Card>
  );
}
