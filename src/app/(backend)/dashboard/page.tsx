import { Separator } from "@/components/ui/separator";
import FacebookUsage from "./_components/facebook-usage";
import LinkedinUsage from "./_components/linkedin-usage";
import { MobileQuickActions } from "./_components/mobile-quick-actions";
import TotalUsage from "./_components/total-usage";
import TwitterUsage from "./_components/twitter-usage";
import { UsageOverview } from "./_components/usage-overview";

export default async function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pb-16 sm:space-y-6 sm:p-6 lg:p-10">
      <div className="space-y-1 sm:space-y-0.5">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Dashboard</h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          Here&apos;s a detailed overview of your usage.
        </p>
      </div>
      <Separator className="my-4 sm:my-6" />
      <MobileQuickActions />
      <div className="space-y-4 sm:space-y-6">
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          <TotalUsage />
          <FacebookUsage />
          <TwitterUsage />
          <LinkedinUsage />
        </div>
        <div className="grid gap-4">
          <UsageOverview />
        </div>
      </div>
    </div>
  );
}
