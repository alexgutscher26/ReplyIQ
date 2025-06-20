"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/trpc/react";
import { avatarFallback, formatCurrency } from "@/utils";

export function RecentSales() {
  const [sales] = api.billings.getRecentSales.useSuspenseQuery();

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
        <CardDescription>
          You made {sales.length} sales recently.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {sales.map((sale) => (
            <div key={sale.id} className="flex items-center">
              <Avatar className="size-9">
                <AvatarImage src={sale.image ?? ""} alt={sale.name} />
                <AvatarFallback>{avatarFallback(sale.name)}</AvatarFallback>
              </Avatar>
              <div className="ml-4 space-y-1">
                <p className="text-sm leading-none font-medium">{sale.name}</p>
                <p className="text-muted-foreground text-sm">{sale.email}</p>
              </div>
              <div className="ml-auto font-medium">
                +{formatCurrency(sale.amount)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
