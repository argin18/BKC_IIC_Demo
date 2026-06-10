"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Device } from "@/lib/types";
import { formatKwh, formatNPR, formatPercent, getStatusTone } from "@/lib/utils";

interface DeviceTableProps { devices: Device[]; }
type SortKey = "name" | "totalKwh" | "costNpr" | "efficiencyPct" | "currentKw";

export function DeviceTable({ devices }: DeviceTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("totalKwh");
  const sortedDevices = useMemo(() => [...devices].sort((a, b) => {
    const aValue = a[sortKey];
    const bValue = b[sortKey];
    if (typeof aValue === "string" && typeof bValue === "string") return aValue.localeCompare(bValue);
    return Number(bValue) - Number(aValue);
  }), [devices, sortKey]);
  const sortButton = (key: SortKey, label: string) => <Button variant="ghost" size="sm" className="h-8 px-1 text-muted-foreground" onClick={() => setSortKey(key)}>{label}<ArrowUpDown className="size-3.5" /></Button>;

  return (
    <Table>
      <TableHeader><TableRow><TableHead>{sortButton("name", "Device")}</TableHead><TableHead>Type</TableHead><TableHead>Location</TableHead><TableHead className="text-right">{sortButton("totalKwh", "kWh")}</TableHead><TableHead className="text-right">{sortButton("costNpr", "Cost")}</TableHead><TableHead className="text-right">{sortButton("efficiencyPct", "Efficiency")}</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
      <TableBody>
        {sortedDevices.map((device) => <TableRow key={device.id}><TableCell><div className="font-medium">{device.name}</div><div className="text-xs text-muted-foreground">{device.currentKw.toFixed(1)} kW now - {device.lastSeen}</div></TableCell><TableCell>{device.type}</TableCell><TableCell className="max-w-44 truncate text-muted-foreground">{device.location}</TableCell><TableCell className="text-right font-medium">{formatKwh(device.totalKwh)}</TableCell><TableCell className="text-right">{formatNPR(device.costNpr)}</TableCell><TableCell className="text-right">{formatPercent(device.efficiencyPct)}</TableCell><TableCell><Badge variant="outline" className={getStatusTone(device.status)}>{device.status}</Badge></TableCell></TableRow>)}
      </TableBody>
    </Table>
  );
}
