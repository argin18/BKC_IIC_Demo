"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { BarChart3, Bot, FileText, Gauge, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const navItems: Array<{ href: Route; label: string; icon: ComponentType<{ className?: string }> }> = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/devices", label: "Devices", icon: BarChart3 },
  { href: "/recommendations", label: "Recommendations", icon: Bot },
  { href: "/reports", label: "Reports", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-border/70 bg-background/95 lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-border/70 px-5">
          <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm"><Zap className="size-5" /></div>
          <div className="min-w-0"><p className="truncate text-sm font-semibold">IIROS</p><p className="truncate text-xs text-muted-foreground">Energy intelligence</p></div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link href={item.href} className={cn("flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", active && "bg-primary/12 text-primary ring-1 ring-primary/20")}>
                    <Icon className="size-4" /><span>{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
        <div className="p-4">
          <Separator className="mb-4" />
          <div className="rounded-lg border bg-card p-4">
            <div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm font-medium">Demo mode</p><Badge variant="outline" className="border-emerald-400/30 bg-emerald-500/10 text-emerald-100">Mock data</Badge></div>
            <p className="text-xs leading-5 text-muted-foreground">API helpers are shaped for FastAPI. Flip the mock flag when backend endpoints are live.</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
