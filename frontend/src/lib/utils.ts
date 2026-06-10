import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNPR(value: number) {
  return new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatKwh(value: number) {
  return `${new Intl.NumberFormat("en-NP", {
    maximumFractionDigits: value >= 100 ? 0 : 1,
  }).format(value)} kWh`;
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function formatHour(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalized}:00 ${suffix}`;
}

export function getStatusTone(status: string) {
  switch (status) {
    case "critical":
      return "border-red-400/30 bg-red-500/10 text-red-200";
    case "watch":
      return "border-amber-400/30 bg-amber-500/10 text-amber-100";
    case "offline":
      return "border-zinc-400/30 bg-zinc-500/10 text-zinc-200";
    default:
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  }
}
