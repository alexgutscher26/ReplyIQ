import { configStore } from "@/server/auth/config-store";
import { getAuthSettingsFromDB } from "@/server/auth/creds";
import { db } from "@/server/db";
import { isFirstUser } from "@/server/utils";
import { type SOCIAL_PROVIDERS } from "@/utils/schema/settings";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";

// Initialize auth settings before creating the auth instance
await getAuthSettingsFromDB();

type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];

// Helper to create provider config
const createProviderConfig = (provider: SocialProvider) => ({
  get clientId() {
    return configStore.getProviderCredentials(provider).clientId;
  },
  get clientSecret() {
    return configStore.getProviderCredentials(provider).clientSecret;
  },
});

// Get enabled providers
const enabledProviders = configStore.getEnabledProviders();

// Create social providers config object dynamically
const socialProvidersConfig = enabledProviders.reduce(
  (acc, provider) => {
    acc[provider] = createProviderConfig(provider);
    return acc;
  },
  {} as Record<SocialProvider, { clientId: string; clientSecret: string }>,
);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  plugins: [nextCookies(), admin()],
  emailAndPassword: {
    enabled: true,
  },
  get trustedOrigins() {
    return configStore.getTrustedOrigins();
  },
  get secret() {
    return configStore.getSecret();
  },
  socialProviders: socialProvidersConfig,
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          type UserWithSource = { source?: string } & typeof user;

          const { source, ...userData } = user as UserWithSource;

          if (source === "dashboard") {
            return { data: { ...userData, banned: false } };
          }

          return {
            data: {
              ...userData,
              role: (await isFirstUser()) ? "admin" : "user",
              banned: false,
            },
          };
        },
      },
    },
  },
});
