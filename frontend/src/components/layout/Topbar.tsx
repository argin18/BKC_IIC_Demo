"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Bell, Bot, FileText, Menu, PlugZap, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const titles: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Energy Operations", subtitle: "Live facility health, cost, and device efficiency" },
  "/devices": { title: "Device Breakdown", subtitle: "Monitor consumption and status by equipment" },
  "/recommendations": { title: "AI Recommendations", subtitle: "Prioritized actions prepared for facility teams" },
  "/reports": { title: "Executive Reports", subtitle: "Management-ready energy and sustainability summaries" },
};

const mobileNav: Array<{ href: Route; label: string }> = [
  { href: "/", label: "Dashboard" },
  { href: "/devices", label: "Devices" },
  { href: "/recommendations", label: "Recommendations" },
  { href: "/reports", label: "Reports" },
];

export function Topbar() {
  const pathname = usePathname();
  const page = titles[pathname] ?? titles["/"];

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Sheet>
          <SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation"><Menu className="size-5" /></Button></SheetTrigger>
          <SheetContent side="left">
            <SheetHeader><SheetTitle>IIROS</SheetTitle></SheetHeader>
            <nav className="mt-6 grid gap-2">
              {mobileNav.map((item) => <Link key={item.href} href={item.href} className={cn("rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground", pathname === item.href && "bg-primary/12 text-primary")}>{item.label}</Link>)}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h1 className="truncate text-base font-semibold sm:text-lg">{page.title}</h1><Badge variant="outline" className="hidden border-primary/30 bg-primary/10 text-primary sm:inline-flex">MVP demo</Badge></div>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">{page.subtitle}</p>
        </div>
        <div className="hidden h-9 w-64 items-center gap-2 rounded-md border bg-card px-3 text-sm text-muted-foreground md:flex"><Search className="size-4" /><span>Search devices, reports...</span></div>
        <Button variant="outline" size="icon" aria-label="Alerts"><Bell className="size-4" /></Button>
        <Button variant="secondary" className="hidden sm:inline-flex"><Bot className="size-4" />Generate insights</Button>
        <Button className="hidden md:inline-flex"><FileText className="size-4" />Report</Button>
        <Button variant="outline" size="icon" aria-label="Backend status"><PlugZap className="size-4 text-emerald-300" /></Button>
      </div>
    </header>
  );
}
