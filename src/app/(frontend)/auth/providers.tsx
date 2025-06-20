"use client";

import { authClient } from "@/server/auth/client";
import { api } from "@/trpc/react";
import { AuthUIProviderTanstack } from "@daveyplate/better-auth-ui/tanstack";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: providers = [] } = api.settings.socialAuthProviders.useQuery();

  return (
    <AuthUIProviderTanstack
      authClient={authClient}
      rememberMe={true}
      {...(providers.length > 0 && { providers })}
      navigate={(href: string) => router.push(href)}
      persistClient={false}
      replace={(href: string) => router.replace(href)}
      onSessionChange={() => router.refresh()}
      LinkComponent={(props: React.ComponentProps<typeof Link>) => (
        <Link {...props} href={props.href} />
      )}
      settingsUrl="/dashboard/settings/profile"
    >
      {children}
    </AuthUIProviderTanstack>
  );
}
