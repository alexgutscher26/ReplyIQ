import { createTable } from "@/server/db/config";
import {
  boolean,
  integer,
  jsonb,
  numeric,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const products = createTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price").notNull(),
  type: text("type").notNull(),
  mode: text("mode").notNull(),
  limit: integer("limit"),
  hasTrial: boolean("has_trial").default(false),
  trialDuration: integer("trial_duration"),
  trialUsageLimit: integer("trial_usage_limit"),
  marketingTaglines: jsonb("marketing_taglines").array(),
  status: text("status").notNull().default("active"),
  priceId: text("price_id"), // Add this field to store Stripe price ID
  isFree: boolean("is_free").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type SelectProduct = typeof products.$inferSelect;
export type CreateProduct = typeof products.$inferInsert;
