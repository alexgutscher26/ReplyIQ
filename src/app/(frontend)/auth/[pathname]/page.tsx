import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/trpc/server";
import { AuthCard } from "@daveyplate/better-auth-ui";
import { authViewPaths } from "@daveyplate/better-auth-ui/server";
import { Command } from "lucide-react";
import Link from "next/link";

export function generateStaticParams() {
  return Object.values(authViewPaths).map((pathname) => ({ pathname }));
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ pathname: string }>;
}) {
  const settings = await api.settings.site();
  const { pathname } = await params;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="flex aspect-square size-6 items-center justify-center gap-2 font-medium">
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
            {settings.name ?? "Replier"}
          </div>
        </Link>
        <div className="flex flex-col items-center gap-4">
          <AuthCard pathname={pathname} />
          <div className="text-muted-foreground hover:[&_a]:text-primary text-center text-xs text-balance [&_a]:underline [&_a]:underline-offset-4">
            By clicking continue, you agree to our{" "}
            <Link href="/terms">Terms of Service</Link> and{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </div>
        </div>
      </div>
    </div>
  );
}
