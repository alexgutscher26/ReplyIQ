import { Activity, DraftingCompass, Mail, Zap } from "lucide-react";
import Image from "next/image";

export default function FeaturesSection() {
  return (
    <section className="py-16 md:py-32" id="features">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-12 lg:grid-cols-5 lg:gap-24">
          <div className="lg:col-span-2">
            <div className="md:pr-6 lg:pr-0">
              <h2 className="text-4xl font-semibold lg:text-5xl">
                Built for Social Media Growth
              </h2>
              <p className="mt-6">
                AI is the future of social media marketing. Our platform is
                designed to help you grow your social media presence with
                cutting-edge AI technology.
              </p>
            </div>
            <ul className="mt-8 divide-y border-y *:flex *:items-center *:gap-3 *:py-3">
              <li>
                <Mail className="size-5" />
                Human like interactions and responses
              </li>
              <li>
                <Zap className="size-5" />
                Fast response time
              </li>
              <li>
                <Activity className="size-5" />
                Guaranteed growth in followers
              </li>
              <li>
                <DraftingCompass className="size-5" />
                Advanced analytics and insights
              </li>
            </ul>
          </div>
          <div className="border-border/50 relative rounded-3xl border p-3 lg:col-span-3">
            <div className="relative aspect-76/59 rounded-2xl bg-linear-to-b from-zinc-300 to-transparent p-px dark:from-zinc-700">
              <Image
                src="https://oz9ry1x8bp.ufs.sh/f/QJPPsA2erx3UnltDJjsAk2fj1SRanoqiWcUghYBDQPlpeMvV"
                className="hidden rounded-[15px] dark:block"
                alt="payments illustration dark"
                width={1207}
                height={929}
              />
              <Image
                src="https://oz9ry1x8bp.ufs.sh/f/QJPPsA2erx3U5qNcxQlIWTvDF8h0Y3cimfAULPSC4NOB2aIR"
                className="rounded-[15px] shadow dark:hidden"
                alt="payments illustration light"
                width={1207}
                height={929}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
