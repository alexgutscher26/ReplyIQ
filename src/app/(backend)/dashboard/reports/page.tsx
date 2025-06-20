import ActiveSubscriptions from "@/app/(backend)/dashboard/reports/_components/active-subscriptions";
import PaidUsers from "@/app/(backend)/dashboard/reports/_components/paid-users";
import { RecentSales } from "@/app/(backend)/dashboard/reports/_components/recent-sales";
import { RevenueOverview } from "@/app/(backend)/dashboard/reports/_components/revenue-overview";
import TotalRevenue from "@/app/(backend)/dashboard/reports/_components/total-revenue";
import TotalUsers from "@/app/(backend)/dashboard/reports/_components/total-users";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/server/utils";
import { redirect } from "next/navigation";

export default async function ReportsPage() {
  const session = await getSession();

  if (session?.user?.role !== "admin") {
    return redirect("/dashboard");
  }

  return (
    <div className="flex-1 space-y-6 p-10 pb-16">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Report</h2>
        <p className="text-muted-foreground">
          Here&apos;s a detailed overview of your business reports.
        </p>
      </div>
      <Separator />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <TotalRevenue />
        <ActiveSubscriptions />
        <TotalUsers />
        <PaidUsers />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <RevenueOverview />
        <RecentSales />
      </div>
    </div>
  );
}
