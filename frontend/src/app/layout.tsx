import type { Metadata } from "next";

import "./globals.css";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "IIROS Energy Dashboard",
  description: "AI-powered energy management dashboard for smart infrastructure optimization.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen font-sans">
        <TooltipProvider>
          <div className="flex min-h-screen bg-background">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <Topbar />
              <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
            </div>
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
