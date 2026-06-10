"use client";

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Device } from "@/lib/types";
import { useElementSize } from "@/lib/use-element-size";
import { formatKwh, formatNPR } from "@/lib/utils";

interface DeviceBarChartProps {
  devices: Device[];
}

export function DeviceBarChart({ devices }: DeviceBarChartProps) {
  const [chartRef, chartSize] = useElementSize<HTMLDivElement>();
  const data = [...devices]
    .sort((a, b) => b.totalKwh - a.totalKwh)
    .slice(0, 6)
    .map((device) => ({
      ...device,
      shortName: device.name.replace(" Unit", "").replace("Zone ", "Z"),
    }));

  return (
    <Card className="min-h-[390px]">
      <CardHeader>
        <CardTitle>Top consumers</CardTitle>
        <CardDescription>Highest kWh devices this month.</CardDescription>
      </CardHeader>
      <CardContent className="h-[290px]">
        <div ref={chartRef} className="h-full min-h-0 w-full min-w-0">
          {chartSize.width > 0 && chartSize.height > 0 ? (
            <BarChart
              width={chartSize.width}
              height={chartSize.height}
              data={data}
              layout="vertical"
              margin={{ left: 12, right: 12, top: 8, bottom: 8 }}
            >
              <CartesianGrid stroke="var(--border)" horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" axisLine={false} tickLine={false} tickMargin={8} />
              <YAxis type="category" dataKey="shortName" axisLine={false} tickLine={false} width={116} tickMargin={8} />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const device = payload[0].payload as Device;

                  return (
                    <div className="rounded-md border bg-popover p-3 text-sm shadow-md">
                      <p className="font-medium">{device.name}</p>
                      <p className="text-muted-foreground">Usage: {formatKwh(device.totalKwh)}</p>
                      <p className="text-muted-foreground">Cost: {formatNPR(device.costNpr)}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="totalKwh" radius={[0, 6, 6, 0]} fill="var(--chart-2)" barSize={18} />
            </BarChart>
          ) : (
            <div className="h-full rounded-md bg-muted/40" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
