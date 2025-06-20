"use client";

import { api } from "@/trpc/react";
import Image from "next/image";

export default function ContentSection() {
  const [settings] = api.settings.site.useSuspenseQuery();

  return (
    <section className="py-16 md:py-32" id="content">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
        <h2 className="relative z-10 max-w-xl text-4xl font-medium lg:text-5xl">
          Facebook, Twitter, and LinkedIn engagement booster.
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 md:gap-12 lg:gap-24">
          <div className="relative mb-6 sm:mb-0">
            <div className="relative aspect-76/59 rounded-2xl bg-linear-to-b from-zinc-300 to-transparent p-px dark:from-zinc-700">
              <Image
                src="https://oz9ry1x8bp.ufs.sh/f/QJPPsA2erx3Ukh6En8rhT2OsaJqXyrv74PUuH1tQGB9izfb6"
                className="hidden rounded-[15px] dark:block"
                alt="payments illustration dark"
                width={1207}
                height={929}
              />
              <Image
                src="https://oz9ry1x8bp.ufs.sh/f/QJPPsA2erx3UBVUTdgPkvrVcaBgNEZJHfIXReo0n5iPLGQM2"
                className="rounded-[15px] shadow dark:hidden"
                alt="payments illustration light"
                width={1207}
                height={929}
              />
            </div>
          </div>

          <div className="relative space-y-4">
            <p className="text-muted-foreground">
              Write{" "}
              <span className="text-accent-foreground font-bold">
                trending posts, get more likes
              </span>
              , and increase your followers with our AI-powered social media
              marketing platform.
            </p>

            <p className="text-muted-foreground">
              Give{" "}
              <span className="text-accent-foreground font-bold">
                custom prompt
              </span>{" "}
              to our AI model to fit your brand voice and style. Our AI model
              will generate the best possible response for your social media
              posts.
            </p>

            <div className="pt-6">
              <blockquote className="border-l-4 pl-4">
                <p>
                  Using {settings?.name} has been a game-changer for our social
                  media marketing strategy. We have seen a significant increase
                  in engagement and followers since we started using the
                  platform.
                </p>

                <div className="mt-6 space-y-3">
                  <cite className="block font-medium">John Doe, CEO</cite>
                  <Image
                    className="h-5 w-fit dark:invert"
                    src="https://html.tailus.io/blocks/customers/nvidia.svg"
                    alt="Nvidia Logo"
                    height="20"
                    width="20"
                  />
                </div>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
