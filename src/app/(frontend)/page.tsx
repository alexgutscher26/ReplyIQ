import { api, HydrateClient } from "@/trpc/server";
import ContentSection from "./_components/content-section";
import FeaturesSection from "./_components/feature-section";
import HeroSection from "./_components/hero-section";
import PricingTable from "./_components/pricing-table";
import StatsSection from "./_components/stats-section";

export default async function Home() {
  // Prefetch data in an async block
  await (async () => {
    try {
      await Promise.all([
        api.settings.site.prefetch(),
        api.products.active.prefetch(),
        api.settings.currency.prefetch(),
        api.settings.downloadExtension.prefetch(),
      ]);
    } catch (error) {
      // Silently handle prefetch errors
      console.error("Failed to prefetch data:", error);
    }
  })();

  return (
    <HydrateClient>
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <ContentSection />
      <PricingTable />
    </HydrateClient>
  );
}
