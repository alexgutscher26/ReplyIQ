import { type AuthSettings } from "@/utils/schema/settings";

class ConfigStore {
  private auth: AuthSettings = {
    secret: "",
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
