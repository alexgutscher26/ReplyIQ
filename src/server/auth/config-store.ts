import { type AuthSettings } from "@/utils/schema/settings";

class ConfigStore {
  private auth: AuthSettings = {
    secret:
      process.env.BETTER_AUTH_SECRET ??
      "c9b1f7e8a3d0e4c6b8a2d1f7e8c3b0a2d1f7e8c3b0a2d1f7e8c3b0a2d1f7e8c3",
    trustedOrigins: [],
    enabledProviders: [],
    providerCredentials: {},
  };

  updateAuth(config: Partial<AuthSettings>) {
    this.auth = {
      ...this.auth,
      ...config,
    };
  }

  getProviderCredentials(provider: AuthSettings["enabledProviders"][number]) {
    return (
      this.auth.providerCredentials[provider] ?? {
        clientId: "",
        clientSecret: "",
      }
    );
  }

  getSecret(): AuthSettings["secret"] {
    return this.auth.secret;
  }

  getTrustedOrigins(): AuthSettings["trustedOrigins"] {
    return this.auth.trustedOrigins;
  }

  getEnabledProviders(): AuthSettings["enabledProviders"] {
    return this.auth.enabledProviders;
  }
}

export const configStore = new ConfigStore();
