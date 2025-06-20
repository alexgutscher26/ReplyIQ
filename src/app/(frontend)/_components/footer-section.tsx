"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/trpc/react";
import { Command, Loader2 } from "lucide-react";
import Link from "next/link";

const links = [
  {
    title: "Features",
    href: "/#features",
  },
  {
    title: "Solution",
    href: "/#content",
  },
  {
    title: "Pricing",
    href: "/#pricing",
  },
  {
    title: "Contact",
    href: "/contact",
  },
];

export default function FooterSection() {
  const {
    data: settings,
    isLoading,
    isError,
    error,
  } = api.settings.site.useQuery();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-red-500">{error.message}</p>
      </div>
    );
  }

  return (
    <footer className="py-16 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <Link href="/" aria-label="go home" className="mx-auto block size-fit">
          <Avatar className="size-6 shrink-0 rounded-none">
            <AvatarImage
              src={settings?.logo}
              alt={settings?.name}
              className="object-cover"
            />
            <AvatarFallback className="rounded-lg">
              <Command className="size-4" />
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="my-8 flex flex-wrap justify-center gap-6 text-sm">
          {links.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className="text-muted-foreground hover:text-primary block duration-150"
            >
              <span>{link.title}</span>
            </Link>
          ))}
        </div>
        <span className="text-muted-foreground block text-center text-sm">
          {" "}
          {`© ${new Date().getFullYear()} ${settings?.name}, All rights reserved.`}
        </span>
      </div>
    </footer>
  );
}
