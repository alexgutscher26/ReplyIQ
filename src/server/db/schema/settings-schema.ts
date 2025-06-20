import { createTable } from "@/server/db/config";
import {
  accountSettingsSchema,
  generalSettingsSchema,
  type AccountSettingsFormValues,
  type GeneralSettings,
} from "@/utils/schema/settings";
import { jsonb, timestamp, uuid } from "drizzle-orm/pg-core";

export const settings = createTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  general: jsonb("general")
    .default(generalSettingsSchema.parse({}))
    .$type<GeneralSettings>(),
  account: jsonb("account")
    .default(accountSettingsSchema.parse({}))
    .$type<AccountSettingsFormValues>(),
  billing: jsonb("billing").default({}).$type<{
    currency: string;
    subscriptionPlans: {
      id: string;
      name: string;
      price: number;
      interval: "month" | "year";
    }[];
    taxSettings: {
      enabled: boolean;
      rate?: number;
    };
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
