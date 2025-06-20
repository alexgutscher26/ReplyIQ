import { createTable } from "@/server/db/config";
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  numeric,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { products } from "./products-schema";

export const billing = createTable(
  "billing",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    status: text("status").notNull().default("pending"), // pending, active, canceled, expired
    provider: text("provider").notNull(),
    providerTransactionId: text("provider_transaction_id"),
    providerId: text("provider_id").notNull(),
    customerId: text("customer_id").notNull(),
    amount: numeric("amount").notNull(),
    currency: text("currency").notNull(),
    interval: text("interval"),
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
    canceledAt: timestamp("canceled_at"),
    endedAt: timestamp("ended_at"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    // Add indexes for common queries
    userIdIdx: index("user_id_idx").on(table.userId),
    productIdIdx: index("product_id_idx").on(table.productId),
    statusIdx: index("status_idx").on(table.status),
    // Composite index for checking active subscriptions
    activeSubIdx: index("active_sub_idx").on(
      table.userId,
      table.productId,
      table.status,
    ),
  }),
);

export const billingRelations = relations(billing, ({ one }) => ({
  user: one(user, {
    fields: [billing.userId],
    references: [user.id],
  }),
  product: one(products, {
    fields: [billing.productId],
    references: [products.id],
  }),
}));

export const userBillingRelations = relations(user, ({ many }) => ({
  billings: many(billing),
}));

export const productBillingRelations = relations(products, ({ many }) => ({
  billings: many(billing),
}));

export type SelectBilling = typeof billing.$inferSelect;
export type CreateBilling = typeof billing.$inferInsert;
