import { createTable } from "@/server/db/config";
import { relations } from "drizzle-orm";
import { index, integer, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const toolAnalytics = createTable(
  "tool_analytics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    toolName: text("tool_name").notNull(), // e.g., 'hashtag-generator', 'sentiment-analysis'
    toolCategory: text("tool_category").notNull(), // e.g., 'ai-generation', 'analysis', 'translation'
    actionType: text("action_type").notNull().default("usage"), // 'usage', 'error', 'success'
    metadata: jsonb("metadata"), // Additional data like platform, settings used, etc.
    duration: integer("duration"), // Time spent in milliseconds
    tokensUsed: integer("tokens_used"), // AI tokens consumed
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userIdIdx: index("tool_analytics_user_id_idx").on(table.userId),
    toolNameIdx: index("tool_analytics_tool_name_idx").on(table.toolName),
    toolCategoryIdx: index("tool_analytics_tool_category_idx").on(table.toolCategory),
    createdAtIdx: index("tool_analytics_created_at_idx").on(table.createdAt),
    userToolIdx: index("tool_analytics_user_tool_idx").on(table.userId, table.toolName),
  }),
);

export const toolAnalyticsRelations = relations(toolAnalytics, ({ one }) => ({
  user: one(user, {
    fields: [toolAnalytics.userId],
    references: [user.id],
  }),
}));

export const userToolAnalyticsRelations = relations(user, ({ many }) => ({
  toolAnalytics: many(toolAnalytics),
}));

export type SelectToolAnalytics = typeof toolAnalytics.$inferSelect;
export type CreateToolAnalytics = typeof toolAnalytics.$inferInsert;

// Predefined tool configurations for consistency
export const AI_TOOLS = {
  'hashtag-generator': {
    name: 'Hashtag Generator',
    category: 'ai-generation',
    description: 'AI-powered hashtag suggestions'
  },
  'thread-generator': {
    name: 'Thread Generator',
    category: 'ai-generation',
    description: 'Create engaging social media threads'
  },
  'video-script-generator': {
    name: 'Video Script Generator',
    category: 'ai-generation',
    description: 'AI-powered video script creation'
  },
  'image-caption-generator': {
    name: 'Image Caption Generator',
    category: 'ai-generation',
    description: 'AI captions for uploaded images'
  },
  'story-generator': {
    name: 'Story Generator',
    category: 'ai-generation',
    description: 'Instagram/Facebook story content'
  },
  'language-translator': {
    name: 'Language Translator',
    category: 'translation',
    description: 'Multi-language translation'
  },
  'sentiment-analysis': {
    name: 'Sentiment Analysis',
    category: 'analysis',
    description: 'Emotional tone analysis'
  },
  'emoji-suggestions': {
    name: 'Emoji Suggestions',
    category: 'enhancement',
    description: 'Context-aware emoji recommendations'
  }
} as const;

export type AIToolKey = keyof typeof AI_TOOLS; 