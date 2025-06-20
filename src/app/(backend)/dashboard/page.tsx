import { Separator } from "@/components/ui/separator";
import FacebookUsage from "./_components/facebook-usage";
import LinkedinUsage from "./_components/linkedin-usage";
import TotalUsage from "./_components/total-usage";
import TwitterUsage from "./_components/twitter-usage";
import { UsageOverview } from "./_components/usage-overview";

export default async function DashboardPage() {
  return (
    <div className="flex-1 space-y-6 p-10 pb-16">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Here&apos;s a detailed overview of your usage.
        </p>
      </div>
      <Separator />
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
