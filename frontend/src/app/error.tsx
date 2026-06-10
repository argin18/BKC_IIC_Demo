"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Card className="max-w-md">
        <CardHeader><CardTitle>Dashboard could not load</CardTitle></CardHeader>
        <CardContent className="space-y-4"><p className="text-sm text-muted-foreground">The frontend is ready, but a data request failed. Try again or switch back to mock data.</p><Button onClick={reset}>Retry</Button></CardContent>
      </Card>
    </div>
  );
}
