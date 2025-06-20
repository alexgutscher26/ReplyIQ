import { createTable } from "@/server/db/config";
import { relations } from "drizzle-orm";
import { index, integer, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { products } from "./products-schema";

export const usage = createTable(
  "usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    used: integer("used").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userIdIdx: index("usage_user_id_idx").on(table.userId),
    productIdIdx: index("usage_product_id_idx").on(table.productId),
    userProductIdx: index("usage_user_product_idx").on(
      table.userId,
      table.productId,
    ),
  }),
);

export const usageRelations = relations(usage, ({ one }) => ({
  user: one(user, {
    fields: [usage.userId],
    references: [user.id],
  }),
  product: one(products, {
    fields: [usage.productId],
    references: [products.id],
  }),
}));

export const userUsageRelations = relations(user, ({ many }) => ({
  usages: many(usage),
}));

export const productUsageRelations = relations(products, ({ many }) => ({
  usages: many(usage),
}));

export type SelectUsage = typeof usage.$inferSelect;
export type CreateUsage = typeof usage.$inferInsert;
