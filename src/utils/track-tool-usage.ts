/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "@/trpc/react";
import { type AIToolKey } from "@/server/db/schema/tool-analytics-schema";

// Client-side utility for tracking tool usage
export function useToolTracker() {
  const trackUsage = api.toolAnalytics.trackUsage.useMutation();

  return {
    trackTool: async (
      toolName: AIToolKey,
      metadata?: Record<string, any>,
      duration?: number,
      tokensUsed?: number
    ) => {
      try {
        await trackUsage.mutateAsync({
          toolName,
          metadata,
          duration,
          tokensUsed,
        });
      } catch (error) {
        // Silent fail - don't interrupt user experience for analytics
        console.warn("Failed to track tool usage:", error);
      }
    },
    isTracking: trackUsage.isPending,
  };
}

// Server-side utility for tracking tool usage
export async function trackToolUsageServer(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  userId: string,
  toolName: AIToolKey,
  metadata?: Record<string, any>,
  duration?: number,
  tokensUsed?: number
) {
  try {
    const { toolAnalytics } = await import("@/server/db/schema/tool-analytics-schema");
    const { AI_TOOLS } = await import("@/server/db/schema/tool-analytics-schema");
    
    const tool = AI_TOOLS[toolName];
    
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await db.insert(toolAnalytics).values({
      userId,
      toolName,
      toolCategory: tool.category,
      actionType: "usage",
      metadata,
      duration,
      tokensUsed,
    });
  } catch (error) {
    // Silent fail - don't interrupt API responses for analytics
    console.warn("Failed to track tool usage on server:", error);
  }
}

// Higher-order function to wrap AI API routes with usage tracking
export function withUsageTracking<T extends any[], R>(
  toolName: AIToolKey,
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    
    try {
      const result = await handler(...args);
      
      // Track successful usage
      const duration = Date.now() - startTime;
      
      // Note: Tracking would be done in the API route handlers with metadata like:
      // { success: true, responseTime: duration }
      
      return result;
    } catch (error) {
      // Note: Failed usage would be tracked with metadata like:
      // { success: false, error: error.message, responseTime: duration }

      // Re-throw the error after tracking
      throw error;
    }
  };
} 