"use client";

import { Bar, BarChart, Cell, Tooltip, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PeakHourData } from "@/lib/types";
import { useElementSize } from "@/lib/use-element-size";
import { formatHour, formatKwh } from "@/lib/utils";

interface PeakHourChartProps {
  data: PeakHourData[];
}

export function PeakHourChart({ data }: PeakHourChartProps) {
  const [chartRef, chartSize] = useElementSize<HTMLDivElement>();

  return (
    <Card className="min-h-[320px]">
      <CardHeader>
        <CardTitle>Peak-hour profile</CardTitle>
        <CardDescription>Average hourly load with peak window highlighted.</CardDescription>
      </CardHeader>
      <CardContent className="h-[220px]">
        <div ref={chartRef} className="h-full min-h-0 w-full min-w-0">
          {chartSize.width > 0 && chartSize.height > 0 ? (
            <BarChart
              width={chartSize.width}
              height={chartSize.height}
              data={data}
              margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
            >
              <XAxis
                dataKey="hour"
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                tickFormatter={(hour) => (hour % 3 === 0 ? `${hour}` : "")}
              />
              <YAxis axisLine={false} tickLine={false} tickMargin={8} width={34} />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const point = payload[0].payload as PeakHourData;

                  return (
                    <div className="rounded-md border bg-popover p-3 text-sm shadow-md">
                      <p className="font-medium">{formatHour(point.hour)}</p>
                      <p className="text-muted-foreground">Average: {formatKwh(point.avgKwh)}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="avgKwh" radius={[5, 5, 0, 0]} barSize={10}>
                {data.map((entry) => (
                  <Cell key={entry.hour} fill={entry.isPeak ? "var(--chart-3)" : "var(--chart-1)"} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <div className="h-full rounded-md bg-muted/40" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
