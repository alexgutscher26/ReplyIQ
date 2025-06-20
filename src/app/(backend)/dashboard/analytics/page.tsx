import { Separator } from "@/components/ui/separator";
import { getSession } from "@/server/utils";
import { redirect } from "next/navigation";
import FacebookUsage from "../_components/facebook-usage";
import LinkedinUsage from "../_components/linkedin-usage";
import TotalUsage from "../_components/total-usage";
import TwitterUsage from "../_components/twitter-usage";
import { UsageOverview } from "../_components/usage-overview";

export default async function AnalyticsPage() {
  const session = await getSession();

  if (session?.user?.role !== "admin") {
    return redirect("/dashboard");
  }

  return (
    <div className="flex-1 space-y-6 p-10 pb-16">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">
          Here&apos;s a detailed overview of your site-wide usage analytics.
        </p>
      </div>
      <Separator />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <TotalUsage isSiteWide />
        <FacebookUsage isSiteWide />
        <TwitterUsage isSiteWide />
        <LinkedinUsage isSiteWide />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <UsageOverview isSiteWide />
      </div>
    </div>
  );
}
