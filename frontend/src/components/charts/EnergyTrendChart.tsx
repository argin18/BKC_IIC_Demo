"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TrendPoint } from "@/lib/types";
import { useElementSize } from "@/lib/use-element-size";
import { formatKwh, formatNPR } from "@/lib/utils";

interface EnergyTrendChartProps {
  data: TrendPoint[];
}

type Period = "7d" | "14d" | "30d";

export function EnergyTrendChart({ data }: EnergyTrendChartProps) {
  const [chartRef, chartSize] = useElementSize<HTMLDivElement>();
  const [period, setPeriod] = useState<Period>("30d");
  const visibleData = useMemo(() => {
    const count = period === "7d" ? 7 : period === "14d" ? 14 : 30;
    return data.slice(-count);
  }, [data, period]);

  return (
    <Card className="min-h-[390px]">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Energy trend</CardTitle>
          <CardDescription>
            Consumption and expected baseline across the selected window.
          </CardDescription>
        </div>
        <Tabs value={period} onValueChange={(value) => setPeriod(value as Period)}>
          <TabsList>
            <TabsTrigger value="7d">7d</TabsTrigger>
            <TabsTrigger value="14d">14d</TabsTrigger>
            <TabsTrigger value="30d">30d</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="h-[290px]">
        <div ref={chartRef} className="h-full min-h-0 w-full min-w-0">
          {chartSize.width > 0 && chartSize.height > 0 ? (
            <AreaChart
              width={chartSize.width}
              height={chartSize.height}
              data={visibleData}
              margin={{ left: 0, right: 12, top: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="energy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={12} minTickGap={20} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={44} />
              <Tooltip
                cursor={{ stroke: "var(--chart-1)", strokeWidth: 1 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const point = payload[0].payload as TrendPoint;

                  return (
                    <div className="rounded-md border bg-popover p-3 text-sm shadow-md">
                      <p className="font-medium">{label}</p>
                      <p className="text-muted-foreground">Usage: {formatKwh(point.totalKwh)}</p>
                      <p className="text-muted-foreground">Cost: {formatNPR(point.costNpr)}</p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="baselineKwh"
                stroke="var(--chart-2)"
                fill="transparent"
                strokeDasharray="4 4"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="totalKwh"
                stroke="var(--chart-1)"
                fill="url(#energy)"
                strokeWidth={2.5}
              />
            </AreaChart>
          ) : (
            <div className="h-full rounded-md bg-muted/40" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
