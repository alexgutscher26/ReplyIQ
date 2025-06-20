import { configStore } from "@/server/auth/config-store";
import { db } from "@/server/db";
import { authSettingsSchema } from "@/utils/schema/settings";

export async function getAuthSettingsFromDB() {
  try {
    const settings = await db.query.settings.findFirst();
    const auth = authSettingsSchema.parse(settings?.general?.auth ?? {});

    // Update the config store with all values
    configStore.updateAuth(auth);
    return auth;
  } catch (error) {
    console.error("Failed to load settings from DB:", error);
    return {
      secret: "",
      trustedOrigins: [],
      enabledProviders: [],
      providerCredentials: {},
    };
  }
}
