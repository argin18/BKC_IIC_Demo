export const dynamic = "force-dynamic";

import { Activity, Gauge, PlugZap, TriangleAlert } from "lucide-react";

import { DeviceBarChart } from "@/components/charts/DeviceBarChart";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { DeviceTable } from "@/components/devices/DeviceTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchDevices } from "@/lib/api";
import { formatKwh } from "@/lib/utils";

export default async function DevicesPage() {
  const devices = await fetchDevices();
  const activeDevices = devices.filter((device) => device.status !== "offline").length;
  const criticalDevices = devices.filter((device) => device.status === "critical").length;
  const totalKwh = devices.reduce((sum, device) => sum + device.totalKwh, 0);
  const averageEfficiency = Math.round(devices.reduce((sum, device) => sum + device.efficiencyPct, 0) / devices.length);

  return <div className="space-y-6"><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><SummaryCard label="Tracked devices" value={`${devices.length}`} helper={`${activeDevices} actively reporting`} icon={PlugZap} tone="blue" /><SummaryCard label="Total device kWh" value={formatKwh(totalKwh)} helper="Current month" icon={Activity} tone="green" /><SummaryCard label="Avg efficiency" value={`${averageEfficiency}%`} helper="Across all equipment" icon={Gauge} tone="violet" /><SummaryCard label="Critical" value={`${criticalDevices}`} helper="Needs facility review" icon={TriangleAlert} tone="red" /></section><section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]"><Card><CardHeader><CardTitle>All devices</CardTitle><CardDescription>Device-level readiness for API integration and future IoT telemetry.</CardDescription></CardHeader><CardContent className="px-0 sm:px-6"><DeviceTable devices={devices} /></CardContent></Card><DeviceBarChart devices={devices} /></section></div>;
}
