import { createTable } from "@/server/db/config";
import { relations } from "drizzle-orm";
import { index, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { products } from "./products-schema";

export const generations = createTable(
  "generation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    source: text("source").notNull(), // e.g., "twitter", "linkedin", etc
    link: text("link"),
    post: text("post").notNull(),
    reply: text("reply").notNull(),
    author: text("author"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userIdIdx: index("generation_user_id_idx").on(table.userId),
    productIdIdx: index("generation_product_id_idx").on(table.productId),
    sourceIdx: index("generation_source_idx").on(table.source),
    userProductIdx: index("generation_user_product_idx").on(
      table.userId,
      table.productId,
    ),
  }),
);

export const generationRelations = relations(generations, ({ one }) => ({
  user: one(user, {
    fields: [generations.userId],
    references: [user.id],
  }),
  product: one(products, {
    fields: [generations.productId],
    references: [products.id],
  }),
}));

export const userGenerationsRelations = relations(user, ({ many }) => ({
  generations: many(generations),
}));

export const productGenerationsRelations = relations(products, ({ many }) => ({
  generations: many(generations),
}));

export type SelectGeneration = typeof generations.$inferSelect;
export type CreateGeneration = typeof generations.$inferInsert;
