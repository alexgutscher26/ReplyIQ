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
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
        <CardTitle className="text-sm font-medium sm:text-base">
          Twitter Generations
        </CardTitle>
        <Twitter className="text-muted-foreground size-4 sm:size-5" />
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-xl font-bold sm:text-2xl lg:text-3xl">{data.total.toLocaleString()}</div>
        <p className="text-muted-foreground text-xs sm:text-sm">
          <span className={`font-medium ${data.percentageChange > 0 ? 'text-green-600' : data.percentageChange < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
            {`${data.percentageChange > 0 ? "+" : ""}${data.percentageChange.toFixed(1)}%`}
          </span>{" "}
          from last month
        </p>
      </CardContent>
    </Card>
  );
}
