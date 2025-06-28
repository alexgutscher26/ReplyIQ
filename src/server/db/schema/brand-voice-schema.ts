import { createTable } from "@/server/db/config";
import { relations } from "drizzle-orm";
import { index, integer, text, timestamp, uuid, jsonb, boolean } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const brandVoices = createTable(
  "brand_voices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    name: text("name").notNull(),
    description: text("description"),
    industry: text("industry"), // e.g., 'technology', 'fashion', 'finance'
    toneAttributes: jsonb("tone_attributes"), // e.g., ['professional', 'friendly', 'authoritative']
    writingStyle: jsonb("writing_style"), // Analyzed writing characteristics
    vocabulary: jsonb("vocabulary"), // Common words, phrases, terminology
    brandPersonality: jsonb("brand_personality"), // Personality traits
    contentExamples: jsonb("content_examples"), // Sample content used for training
    analysisResults: jsonb("analysis_results"), // AI analysis of brand voice
    trainingStatus: text("training_status").notNull().default("draft"), // 'draft', 'analyzing', 'trained', 'error'
    isActive: boolean("is_active").default(true),
    trainingProgress: integer("training_progress").default(0), // 0-100%
    modelVersion: text("model_version"), // Version identifier for tracking
    lastTrainingAt: timestamp("last_training_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userIdIdx: index("brand_voices_user_id_idx").on(table.userId),
    nameIdx: index("brand_voices_name_idx").on(table.name),
    statusIdx: index("brand_voices_status_idx").on(table.trainingStatus),
    activeIdx: index("brand_voices_active_idx").on(table.isActive),
  }),
);

export const brandVoiceTrainingData = createTable(
  "brand_voice_training_data",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandVoiceId: uuid("brand_voice_id")
      .notNull()
      .references(() => brandVoices.id, { onDelete: "cascade" }),
    contentType: text("content_type").notNull(), // 'text', 'social-post', 'blog', 'email', 'website'
    title: text("title"),
    content: text("content").notNull(),
    platform: text("platform"), // 'twitter', 'facebook', 'linkedin', 'blog', etc.
    metadata: jsonb("metadata"), // Additional context like date, engagement metrics
    wordCount: integer("word_count"),
    isProcessed: boolean("is_processed").default(false),
    analysisScore: integer("analysis_score"), // Quality/relevance score 0-100
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    brandVoiceIdIdx: index("training_data_brand_voice_id_idx").on(table.brandVoiceId),
    contentTypeIdx: index("training_data_content_type_idx").on(table.contentType),
    processedIdx: index("training_data_processed_idx").on(table.isProcessed),
  }),
);

export const brandVoiceGenerations = createTable(
  "brand_voice_generations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    brandVoiceId: uuid("brand_voice_id")
      .references(() => brandVoices.id, { onDelete: "set null" }),
    prompt: text("prompt").notNull(),
    generatedContent: text("generated_content").notNull(),
    contentType: text("content_type"), // 'social-post', 'email', 'blog', etc.
    platform: text("platform"),
    metadata: jsonb("metadata"),
    qualityScore: integer("quality_score"), // User feedback 1-5
    isUsed: boolean("is_used").default(false),
    tokensUsed: integer("tokens_used"),
    generationTime: integer("generation_time"), // milliseconds
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userIdIdx: index("generations_user_id_idx").on(table.userId),
    brandVoiceIdIdx: index("generations_brand_voice_id_idx").on(table.brandVoiceId),
    contentTypeIdx: index("generations_content_type_idx").on(table.contentType),
    createdAtIdx: index("generations_created_at_idx").on(table.createdAt),
  }),
);

export const brandVoiceRelations = relations(brandVoices, ({ one, many }) => ({
  user: one(user, {
    fields: [brandVoices.userId],
    references: [user.id],
  }),
  trainingData: many(brandVoiceTrainingData),
  generations: many(brandVoiceGenerations),
}));

export const brandVoiceTrainingDataRelations = relations(brandVoiceTrainingData, ({ one }) => ({
  brandVoice: one(brandVoices, {
    fields: [brandVoiceTrainingData.brandVoiceId],
    references: [brandVoices.id],
  }),
}));

export const brandVoiceGenerationsRelations = relations(brandVoiceGenerations, ({ one }) => ({
  user: one(user, {
    fields: [brandVoiceGenerations.userId],
    references: [user.id],
  }),
  brandVoice: one(brandVoices, {
    fields: [brandVoiceGenerations.brandVoiceId],
    references: [brandVoices.id],
  }),
}));

export const userBrandVoicesRelations = relations(user, ({ many }) => ({
  brandVoices: many(brandVoices),
  brandVoiceGenerations: many(brandVoiceGenerations),
}));

export type SelectBrandVoice = typeof brandVoices.$inferSelect;
export type CreateBrandVoice = typeof brandVoices.$inferInsert;
export type SelectBrandVoiceTrainingData = typeof brandVoiceTrainingData.$inferSelect;
export type CreateBrandVoiceTrainingData = typeof brandVoiceTrainingData.$inferInsert;
export type SelectBrandVoiceGeneration = typeof brandVoiceGenerations.$inferSelect;
export type CreateBrandVoiceGeneration = typeof brandVoiceGenerations.$inferInsert;

// Predefined industry categories
export const INDUSTRIES = {
  'technology': 'Technology',
  'healthcare': 'Healthcare',
  'finance': 'Finance & Banking',
  'retail': 'Retail & E-commerce',
  'fashion': 'Fashion & Beauty',
  'food': 'Food & Beverage',
  'travel': 'Travel & Hospitality',
  'education': 'Education',
  'real-estate': 'Real Estate',
  'automotive': 'Automotive',
  'entertainment': 'Entertainment & Media',
  'nonprofit': 'Non-profit',
  'consulting': 'Consulting',
  'manufacturing': 'Manufacturing',
  'other': 'Other'
} as const;

// Content types for training data
export const CONTENT_TYPES = {
  'social-post': 'Social Media Post',
  'blog': 'Blog Article',
  'email': 'Email Content',
  'website': 'Website Copy',
  'press-release': 'Press Release',
  'newsletter': 'Newsletter',
  'product-description': 'Product Description',
  'marketing-copy': 'Marketing Copy',
  'customer-support': 'Customer Support',
  'other': 'Other'
} as const;

export type IndustryKey = keyof typeof INDUSTRIES;
export type ContentTypeKey = keyof typeof CONTENT_TYPES; 