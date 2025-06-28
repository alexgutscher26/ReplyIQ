import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc";
import { toolAnalytics, AI_TOOLS, type AIToolKey } from "@/server/db/schema/tool-analytics-schema";
import { user } from "@/server/db/schema/auth-schema";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, lte, desc, count, sql } from "drizzle-orm";
import { z } from "zod";

export const toolAnalyticsRouter = createTRPCRouter({
  // Track tool usage - protected for all users
  trackUsage: protectedProcedure
    .input(
      z.object({
        toolName: z.string().refine((val): val is AIToolKey => val in AI_TOOLS, {
          message: "Invalid tool name",
        }),
        metadata: z.record(z.any()).optional(),
        duration: z.number().optional(),
        tokensUsed: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tool = AI_TOOLS[input.toolName];
      
      try {
        await ctx.db.insert(toolAnalytics).values({
          userId: ctx.session.user.id,
          toolName: input.toolName,
          toolCategory: tool.category,
          actionType: "usage",
          metadata: input.metadata,
          duration: input.duration,
          tokensUsed: input.tokensUsed,
        });

        return { success: true };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to track usage",
        });
      }
    }),

  // Get tool usage statistics - admin only
  getToolUsageStats: adminProcedure
    .input(
      z.object({
        period: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
        toolName: z.string().optional(),
        userId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const periodDays = {
        "7d": 7,
        "30d": 30,
        "90d": 90,
        "1y": 365,
      };

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays[input.period]);

      // Base query conditions
      const conditions = [
        gte(toolAnalytics.createdAt, startDate),
      ];

      if (input.toolName) {
        conditions.push(eq(toolAnalytics.toolName, input.toolName));
      }

      if (input.userId) {
        conditions.push(eq(toolAnalytics.userId, input.userId));
      }

      // Get tool usage counts
      const toolUsageCounts = await ctx.db
        .select({
          toolName: toolAnalytics.toolName,
          toolCategory: toolAnalytics.toolCategory,
          count: count(),
          totalDuration: sql<number>`sum(${toolAnalytics.duration})`,
          totalTokens: sql<number>`sum(${toolAnalytics.tokensUsed})`,
          uniqueUsers: sql<number>`count(distinct ${toolAnalytics.userId})`,
        })
        .from(toolAnalytics)
        .where(and(...conditions))
        .groupBy(toolAnalytics.toolName, toolAnalytics.toolCategory)
        .orderBy(desc(count()));

      // Get daily usage trend
      const dailyUsage = await ctx.db
        .select({
          date: sql<string>`date(${toolAnalytics.createdAt})`,
          count: count(),
          uniqueUsers: sql<number>`count(distinct ${toolAnalytics.userId})`,
        })
        .from(toolAnalytics)
        .where(and(...conditions))
        .groupBy(sql`date(${toolAnalytics.createdAt})`)
        .orderBy(sql`date(${toolAnalytics.createdAt})`);

      // Get category breakdown
      const categoryBreakdown = await ctx.db
        .select({
          category: toolAnalytics.toolCategory,
          count: count(),
          uniqueUsers: sql<number>`count(distinct ${toolAnalytics.userId})`,
        })
        .from(toolAnalytics)
        .where(and(...conditions))
        .groupBy(toolAnalytics.toolCategory)
        .orderBy(desc(count()));

      // Get top users
      const topUsers = await ctx.db
        .select({
          userId: toolAnalytics.userId,
          userName: user.name,
          userEmail: user.email,
          count: count(),
          totalDuration: sql<number>`sum(${toolAnalytics.duration})`,
        })
        .from(toolAnalytics)
        .leftJoin(user, eq(toolAnalytics.userId, user.id))
        .where(and(...conditions))
        .groupBy(toolAnalytics.userId, user.name, user.email)
        .orderBy(desc(count()))
        .limit(10);

      // Calculate total statistics
      const totalUsage = toolUsageCounts.reduce((sum, tool) => sum + tool.count, 0);
      const totalUniqueUsers = await ctx.db
        .select({
          count: sql<number>`count(distinct ${toolAnalytics.userId})`,
        })
        .from(toolAnalytics)
        .where(and(...conditions));

      return {
        totalUsage,
        totalUniqueUsers: totalUniqueUsers[0]?.count ?? 0,
        toolUsageCounts: toolUsageCounts.map(tool => ({
          ...tool,
          toolDisplayName: AI_TOOLS[tool.toolName as AIToolKey]?.name ?? tool.toolName,
          percentage: totalUsage > 0 ? ((tool.count / totalUsage) * 100).toFixed(1) : "0",
        })),
        dailyUsage,
        categoryBreakdown,
        topUsers,
        period: input.period,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      };
    }),

  // Get user activity for a specific user - admin only
  getUserActivity: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        toolName: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(toolAnalytics.userId, input.userId)];

      if (input.toolName) {
        conditions.push(eq(toolAnalytics.toolName, input.toolName));
      }

      const activities = await ctx.db
        .select({
          id: toolAnalytics.id,
          toolName: toolAnalytics.toolName,
          toolCategory: toolAnalytics.toolCategory,
          actionType: toolAnalytics.actionType,
          metadata: toolAnalytics.metadata,
          duration: toolAnalytics.duration,
          tokensUsed: toolAnalytics.tokensUsed,
          createdAt: toolAnalytics.createdAt,
        })
        .from(toolAnalytics)
        .where(and(...conditions))
        .orderBy(desc(toolAnalytics.createdAt))
        .limit(input.limit);

      return activities.map(activity => ({
        ...activity,
        toolDisplayName: AI_TOOLS[activity.toolName as AIToolKey]?.name ?? activity.toolName,
      }));
    }),

  // Get tool performance metrics - admin only
  getToolPerformance: adminProcedure
    .input(
      z.object({
        period: z.enum(["7d", "30d", "90d"]).default("30d"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const periodDays = {
        "7d": 7,
        "30d": 30,
        "90d": 90,
      };

      const currentPeriodStart = new Date();
      currentPeriodStart.setDate(currentPeriodStart.getDate() - periodDays[input.period]);

      const previousPeriodStart = new Date();
      previousPeriodStart.setDate(previousPeriodStart.getDate() - (periodDays[input.period] * 2));

      // Current period stats
      const currentStats = await ctx.db
        .select({
          toolName: toolAnalytics.toolName,
          count: count(),
          avgDuration: sql<number>`avg(${toolAnalytics.duration})`,
          avgTokens: sql<number>`avg(${toolAnalytics.tokensUsed})`,
        })
        .from(toolAnalytics)
        .where(gte(toolAnalytics.createdAt, currentPeriodStart))
        .groupBy(toolAnalytics.toolName);

      // Previous period stats for comparison
      const previousStats = await ctx.db
        .select({
          toolName: toolAnalytics.toolName,
          count: count(),
        })
        .from(toolAnalytics)
        .where(
          and(
            gte(toolAnalytics.createdAt, previousPeriodStart),
            lte(toolAnalytics.createdAt, currentPeriodStart),
          ),
        )
        .groupBy(toolAnalytics.toolName);

      // Combine current and previous stats
      const performance = currentStats.map(current => {
        const previous = previousStats.find(p => p.toolName === current.toolName);
        const previousCount = previous?.count ?? 0;
        const growthRate = previousCount > 0 
          ? (((current.count - previousCount) / previousCount) * 100)
          : current.count > 0 ? 100 : 0;

        return {
          toolName: current.toolName,
          toolDisplayName: AI_TOOLS[current.toolName as AIToolKey]?.name ?? current.toolName,
          currentPeriodUsage: current.count,
          previousPeriodUsage: previousCount,
          growthRate: Math.round(growthRate * 100) / 100,
          avgDuration: Math.round((current.avgDuration ?? 0) * 100) / 100,
          avgTokens: Math.round((current.avgTokens ?? 0) * 100) / 100,
        };
      });

      return {
        performance: performance.sort((a, b) => b.currentPeriodUsage - a.currentPeriodUsage),
        period: input.period,
      };
    }),

  // Get overview stats for admin dashboard
  getOverviewStats: adminProcedure.query(async ({ ctx }) => {
    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);

    const last7d = new Date();
    last7d.setDate(last7d.getDate() - 7);

    const last30d = new Date();
    last30d.setDate(last30d.getDate() - 30);

    // Get basic counts
    const [
      totalUsageCount,
      last24hCount,
      last7dCount,
      last30dCount,
      totalUsersCount,
      activeUsersLast7d,
    ] = await Promise.all([
      ctx.db.select({ count: count() }).from(toolAnalytics),
      ctx.db.select({ count: count() }).from(toolAnalytics).where(gte(toolAnalytics.createdAt, last24h)),
      ctx.db.select({ count: count() }).from(toolAnalytics).where(gte(toolAnalytics.createdAt, last7d)),
      ctx.db.select({ count: count() }).from(toolAnalytics).where(gte(toolAnalytics.createdAt, last30d)),
      ctx.db.select({ count: sql<number>`count(distinct ${toolAnalytics.userId})` }).from(toolAnalytics),
      ctx.db.select({ count: sql<number>`count(distinct ${toolAnalytics.userId})` }).from(toolAnalytics).where(gte(toolAnalytics.createdAt, last7d)),
    ]);

    // Get most popular tool
    const popularTool = await ctx.db
      .select({
        toolName: toolAnalytics.toolName,
        count: count(),
      })
      .from(toolAnalytics)
      .where(gte(toolAnalytics.createdAt, last30d))
      .groupBy(toolAnalytics.toolName)
      .orderBy(desc(count()))
      .limit(1);

    return {
      totalUsage: totalUsageCount[0]?.count ?? 0,
      usage24h: last24hCount[0]?.count ?? 0,
      usage7d: last7dCount[0]?.count ?? 0,
      usage30d: last30dCount[0]?.count ?? 0,
      totalUsers: totalUsersCount[0]?.count ?? 0,
      activeUsers7d: activeUsersLast7d[0]?.count ?? 0,
      mostPopularTool: popularTool[0] ? {
        name: popularTool[0].toolName,
        displayName: AI_TOOLS[popularTool[0].toolName as AIToolKey]?.name ?? popularTool[0].toolName,
        usage: popularTool[0].count,
      } : null,
    };
  }),
}); 