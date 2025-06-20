"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { Users } from "lucide-react";

export default function TotalUsers() {
  const [data] = api.user.getTotalUsers.useSuspenseQuery();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
        <Users className="text-muted-foreground size-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">+{data.total}</div>
        <p className="text-muted-foreground text-xs">
          {`${data.percentageChange > 0 ? "+" : ""}${data.percentageChange.toFixed(1)}%`}{" "}
          from last month
        </p>
      </CardContent>
    </Card>
  );
}
