import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import * as React from "react";

interface ChartCardProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function ChartCard({ title, description, action, children }: ChartCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="relative z-10 flex flex-wrap items-start justify-between gap-3 pb-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold tracking-tight text-foreground">
            {title}
          </CardTitle>
          {description ? (
            <CardDescription className="text-sm text-muted-foreground/70">
              {description}
            </CardDescription>
          ) : null}
        </div>
        {action ? <div className="mt-1">{action}</div> : null}
      </CardHeader>
      <CardContent className="relative z-10 pt-5">{children}</CardContent>
    </Card>
  );
}
