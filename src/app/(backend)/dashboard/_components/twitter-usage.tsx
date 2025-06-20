"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { Twitter } from "lucide-react";

export default function TwitterUsage({
  isSiteWide = false,
}: {
  isSiteWide?: boolean;
}) {
  const [data] = api.generations.getTwitterStats.useSuspenseQuery({
    isSiteWide,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Twitter Generations
        </CardTitle>
        <Twitter className="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{data.total.toLocaleString()}</div>
        <p className="text-muted-foreground text-xs">
          {`${data.percentageChange > 0 ? "+" : ""}${data.percentageChange.toFixed(1)}%`}{" "}
          from last month
        </p>
      </CardContent>
    </Card>
  );
}
