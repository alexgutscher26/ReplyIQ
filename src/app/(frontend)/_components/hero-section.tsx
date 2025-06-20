"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { ArrowRight, Chrome, Flame } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  const [settings] = api.settings.site.useSuspenseQuery();
  const [download] = api.settings.downloadExtension.useSuspenseQuery();

  return (
    <main className="overflow-hidden">
      <section>
        <div className="relative pt-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-3xl text-center sm:mx-auto lg:mt-0 lg:mr-auto lg:w-4/5">
              <Link
                href="/auth/sign-up"
                className="mx-auto flex w-fit items-center gap-2 rounded-(--radius) border p-1 pr-3"
              >
                <span className="bg-muted rounded-[calc(var(--radius)-0.25rem)] px-2 py-1 text-xs">
                  New
                </span>
                <span className="text-sm">No credit card required</span>
                <span className="block h-4 w-px bg-(--color-border)"></span>

                <ArrowRight className="size-4" />
              </Link>

              <h1 className="mt-8 text-4xl font-semibold text-balance md:text-5xl xl:text-6xl xl:[line-height:1.125]">
                AI-powered social media extension for everyone
              </h1>
              <p className="mx-auto mt-8 hidden max-w-2xl text-lg text-wrap sm:block">
                {settings?.name} is a browser extension available for Chrome and
                Firefox that uses AI models to help you write better social
                media posts and reply to comments faster.
              </p>
              <p className="mx-auto mt-6 max-w-2xl text-wrap sm:hidden">
                Write better social media posts and reply to comments faster
                with {settings?.name}. Available for Chrome and Firefox.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Button asChild size="lg">
                  <Link href={download.chrome! ?? "#"}>
                    <Chrome className="relative size-4" />
                    <span>Download for Chrome</span>
                  </Link>
                </Button>

                <Button asChild size="lg" variant="outline">
                  <Link href={download.firefox! ?? "#"}>
                    <Flame className="relative size-4" />
                    <span>Download for Firefox</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="relative mt-16">
            <div
              aria-hidden
              className="to-background absolute inset-0 z-10 bg-linear-to-b from-transparent from-35%"
            />
            <div className="ring-background bg-background relative mx-auto max-w-6xl overflow-hidden rounded-2xl border p-4 shadow-lg ring-1 inset-shadow-2xs shadow-zinc-950/15 dark:inset-shadow-white/20">
              <Image
                className="bg-background relative hidden aspect-15/8 rounded-2xl dark:block"
                src="https://oz9ry1x8bp.ufs.sh/f/QJPPsA2erx3UQB71AT2erx3U2GYiqAvZJ1SoyfKtmOXBka75"
                alt="app screen"
                width="2700"
                height="1440"
              />
              <Image
                className="border-border/25 relative z-2 aspect-15/8 rounded-2xl border dark:hidden"
                src="https://oz9ry1x8bp.ufs.sh/f/QJPPsA2erx3USzN6XdLao3PMhBTgurytZIq67fjJnswNAFOk"
                alt="app screen"
                width="2700"
                height="1440"
              />
            </div>
          </div>
        </div>
      </section>
      <section className="bg-background relative z-10 pb-16">
        <div className="m-auto max-w-5xl px-6">
          <h2 className="text-center text-lg font-medium">
            Your favorite companies are our partners.
          </h2>
          <div className="mx-auto mt-12 flex max-w-4xl flex-wrap items-center justify-center gap-x-12 gap-y-8 sm:gap-x-16 sm:gap-y-12">
            <Image
              className="h-5 w-fit dark:invert"
              src="https://html.tailus.io/blocks/customers/nvidia.svg"
              alt="Nvidia Logo"
              height="20"
              width="20"
            />
            <Image
              className="h-4 w-fit dark:invert"
              src="https://html.tailus.io/blocks/customers/column.svg"
              alt="Column Logo"
              height="16"
              width="16"
            />
            <Image
              className="h-4 w-fit dark:invert"
              src="https://html.tailus.io/blocks/customers/github.svg"
              alt="GitHub Logo"
              height="16"
              width="16"
            />
            <Image
              className="h-5 w-fit dark:invert"
              src="https://html.tailus.io/blocks/customers/nike.svg"
              alt="Nike Logo"
              height="20"
              width="20"
            />
            <Image
              className="h-4 w-fit dark:invert"
              src="https://html.tailus.io/blocks/customers/laravel.svg"
              alt="Laravel Logo"
              height="16"
              width="16"
            />
            <Image
              className="h-7 w-fit dark:invert"
              src="https://html.tailus.io/blocks/customers/lilly.svg"
              alt="Lilly Logo"
              height="28"
              width="28"
            />
            <Image
              className="h-5 w-fit dark:invert"
              src="https://html.tailus.io/blocks/customers/lemonsqueezy.svg"
              alt="Lemon Squeezy Logo"
              height="20"
              width="16"
            />
            <Image
              className="h-6 w-fit dark:invert"
              src="https://html.tailus.io/blocks/customers/openai.svg"
              alt="OpenAI Logo"
              height="24"
              width="24"
            />
            <Image
              className="h-4 w-fit dark:invert"
              src="https://html.tailus.io/blocks/customers/tailwindcss.svg"
              alt="Tailwind CSS Logo"
              height="16"
              width="16"
            />
            <Image
              className="h-5 w-fit dark:invert"
              src="https://html.tailus.io/blocks/customers/vercel.svg"
              alt="Vercel Logo"
              height="20"
              width="20"
            />
            <Image
              className="h-5 w-fit dark:invert"
              src="https://html.tailus.io/blocks/customers/zapier.svg"
              alt="Zapier Logo"
              height="20"
              width="20"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
