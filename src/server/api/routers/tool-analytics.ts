import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
} from "@/server/api/trpc";
import {
  toolAnalytics,
  AI_TOOLS,
  type AIToolKey,
} from "@/server/db/schema/tool-analytics-schema";
import { user } from "@/server/db/schema/auth-schema";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, lte, desc, count, sql } from "drizzle-orm";
import { z } from "zod";

// Declare global type for alert cache
declare global {
  // eslint-disable-next-line no-var
  var __performanceAlertCache: Record<string, number> | undefined;
}

export const toolAnalyticsRouter = createTRPCRouter({
  // Track tool usage - protected for all users
  trackUsage: protectedProcedure
    .input(
      z.object({
        toolName: z
          .string()
          .refine((val): val is AIToolKey => val in AI_TOOLS, {
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
      const conditions = [gte(toolAnalytics.createdAt, startDate)];

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
      const totalUsage = toolUsageCounts.reduce(
        (sum, tool) => sum + tool.count,
        0,
      );
      const totalUniqueUsers = await ctx.db
        .select({
          count: sql<number>`count(distinct ${toolAnalytics.userId})`,
        })
        .from(toolAnalytics)
        .where(and(...conditions));

      return {
        totalUsage,
        totalUniqueUsers: totalUniqueUsers[0]?.count ?? 0,
        toolUsageCounts: toolUsageCounts.map((tool) => ({
          ...tool,
          toolDisplayName:
            AI_TOOLS[tool.toolName as AIToolKey]?.name ?? tool.toolName,
          percentage:
            totalUsage > 0 ? ((tool.count / totalUsage) * 100).toFixed(1) : "0",
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

      return activities.map((activity) => ({
        ...activity,
        toolDisplayName:
          AI_TOOLS[activity.toolName as AIToolKey]?.name ?? activity.toolName,
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
      currentPeriodStart.setDate(
        currentPeriodStart.getDate() - periodDays[input.period],
      );

      const previousPeriodStart = new Date();
      previousPeriodStart.setDate(
        previousPeriodStart.getDate() - periodDays[input.period] * 2,
      );

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
      const performance = currentStats.map((current) => {
        const previous = previousStats.find(
          (p) => p.toolName === current.toolName,
        );
        const previousCount = previous?.count ?? 0;
        const growthRate =
          previousCount > 0
            ? ((current.count - previousCount) / previousCount) * 100
            : current.count > 0
              ? 100
              : 0;

        return {
          toolName: current.toolName,
          toolDisplayName:
            AI_TOOLS[current.toolName as AIToolKey]?.name ?? current.toolName,
          currentPeriodUsage: current.count,
          previousPeriodUsage: previousCount,
          growthRate: Math.round(growthRate * 100) / 100,
          avgDuration: Math.round((current.avgDuration ?? 0) * 100) / 100,
          avgTokens: Math.round((current.avgTokens ?? 0) * 100) / 100,
        };
      });

      return {
        performance: performance.sort(
          (a, b) => b.currentPeriodUsage - a.currentPeriodUsage,
        ),
        period: input.period,
      };
    }),

  // Get overview stats for admin dashboard
  getOverviewStats: adminProcedure.query(async ({ ctx }) => {
    // In-memory alert cache to prevent spamming (per process)
    const globalWithCache = globalThis as typeof globalThis & {
      __performanceAlertCache?: Record<string, number>;
    };
    globalWithCache.__performanceAlertCache ??= {};
    const alertCache = globalWithCache.__performanceAlertCache;

    // Fetch performance alert settings
    const settingsRow = await ctx.db.query.settings.findFirst();
    const performanceAlerts = settingsRow?.general?.performanceAlerts ?? {
      enabled: true,
      successRateThreshold: 85,
      growthThreshold: -10,
      errorRateThreshold: 5,
    };
    const alertsEnabled = performanceAlerts.enabled !== false;

    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);

    const last7d = new Date();
    last7d.setDate(last7d.getDate() - 7);

    const last30d = new Date();
    last30d.setDate(last30d.getDate() - 30);

    // Previous period dates for comparison
    const prev24h = new Date();
    prev24h.setHours(prev24h.getHours() - 48);
    const prev24hStart = new Date();
    prev24hStart.setHours(prev24hStart.getHours() - 24);

    const prev7d = new Date();
    prev7d.setDate(prev7d.getDate() - 14);

    const prev30d = new Date();
    prev30d.setDate(prev30d.getDate() - 60);

    // Get basic counts
    const [
      totalUsageCount,
      last24hCount,
      last7dCount,
      last30dCount,
      totalUsersCount,
      activeUsersLast7d,
      // Previous period counts for comparison
      prev24hCount,
      prev7dCount,
      prev30dCount,
      prevActiveUsers7d,
    ] = await Promise.all([
      ctx.db.select({ count: count() }).from(toolAnalytics),
      ctx.db
        .select({ count: count() })
        .from(toolAnalytics)
        .where(gte(toolAnalytics.createdAt, last24h)),
      ctx.db
        .select({ count: count() })
        .from(toolAnalytics)
        .where(gte(toolAnalytics.createdAt, last7d)),
      ctx.db
        .select({ count: count() })
        .from(toolAnalytics)
        .where(gte(toolAnalytics.createdAt, last30d)),
      ctx.db
        .select({ count: sql<number>`count(distinct ${toolAnalytics.userId})` })
        .from(toolAnalytics),
      ctx.db
        .select({ count: sql<number>`count(distinct ${toolAnalytics.userId})` })
        .from(toolAnalytics)
        .where(gte(toolAnalytics.createdAt, last7d)),
      // Previous periods
      ctx.db
        .select({ count: count() })
        .from(toolAnalytics)
        .where(
          and(
            gte(toolAnalytics.createdAt, prev24h),
            lte(toolAnalytics.createdAt, prev24hStart),
          ),
        ),
      ctx.db
        .select({ count: count() })
        .from(toolAnalytics)
        .where(
          and(
            gte(toolAnalytics.createdAt, prev7d),
            lte(toolAnalytics.createdAt, last7d),
          ),
        ),
      ctx.db
        .select({ count: count() })
        .from(toolAnalytics)
        .where(
          and(
            gte(toolAnalytics.createdAt, prev30d),
            lte(toolAnalytics.createdAt, last30d),
          ),
        ),
      ctx.db
        .select({ count: sql<number>`count(distinct ${toolAnalytics.userId})` })
        .from(toolAnalytics)
        .where(
          and(
            gte(toolAnalytics.createdAt, prev7d),
            lte(toolAnalytics.createdAt, last7d),
          ),
        ),
    ]);

    // Calculate trend percentages with robust error handling
    const calculateTrend = (current: number, previous: number): number => {
      // Convert to numbers and handle null/undefined
      const curr = Number(current) || 0;
      const prev = Number(previous) || 0;

      // Handle edge cases
      if (!isFinite(curr) || !isFinite(prev)) return 0;
      if (isNaN(curr) || isNaN(prev)) return 0;
      if (prev === 0 && curr === 0) return 0;
      if (prev === 0 && curr > 0) return 100;
      if (prev === 0 && curr < 0) return -100;

      // Calculate percentage change
      const percentage = ((curr - prev) / prev) * 100;

      // Ensure result is finite and reasonable
      if (!isFinite(percentage) || isNaN(percentage)) return 0;

      // Cap at reasonable limits to prevent display issues
      const cappedPercentage = Math.max(-999, Math.min(999, percentage));

      return Math.round(cappedPercentage * 100) / 100;
    };

    // Get success rate (all actions vs error actions in last 30 days)
    const [allActions, errorActions] = await Promise.all([
      ctx.db
        .select({ count: count() })
        .from(toolAnalytics)
        .where(gte(toolAnalytics.createdAt, last30d)),
      ctx.db
        .select({ count: count() })
        .from(toolAnalytics)
        .where(
          and(
            gte(toolAnalytics.createdAt, last30d),
            eq(toolAnalytics.actionType, "error"),
          ),
        ),
    ]);

    const totalCurrentActions = allActions[0]?.count ?? 0;
    const errorCurrentActions = errorActions[0]?.count ?? 0;
    const currentSuccessRate =
      totalCurrentActions > 0
        ? ((totalCurrentActions - errorCurrentActions) / totalCurrentActions) *
          100
        : 95;

    // Previous success rate for comparison
    const [prevAllActions, prevErrorActions] = await Promise.all([
      ctx.db
        .select({ count: count() })
        .from(toolAnalytics)
        .where(
          and(
            gte(toolAnalytics.createdAt, prev30d),
            lte(toolAnalytics.createdAt, last30d),
          ),
        ),
      ctx.db
        .select({ count: count() })
        .from(toolAnalytics)
        .where(
          and(
            gte(toolAnalytics.createdAt, prev30d),
            lte(toolAnalytics.createdAt, last30d),
            eq(toolAnalytics.actionType, "error"),
          ),
        ),
    ]);

    const totalPrevActions = prevAllActions[0]?.count ?? 0;
    const errorPrevActions = prevErrorActions[0]?.count ?? 0;
    const prevSuccessRate =
      totalPrevActions > 0
        ? ((totalPrevActions - errorPrevActions) / totalPrevActions) * 100
        : 95;

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

    // Current values with safety checks
    const totalUsage = Number(totalUsageCount[0]?.count ?? 0);
    const usage24h = Number(last24hCount[0]?.count ?? 0);
    const usage7d = Number(last7dCount[0]?.count ?? 0);
    const usage30d = Number(last30dCount[0]?.count ?? 0);
    const totalUsers = Number(totalUsersCount[0]?.count ?? 0);
    const activeUsers7d = Number(activeUsersLast7d[0]?.count ?? 0);

    // Previous values with extra safety checks
    const prevUsage24h = Number(prev24hCount[0]?.count ?? 0);
    const prevUsage7d = Number(prev7dCount[0]?.count ?? 0);
    const prevUsage30d = Number(prev30dCount[0]?.count ?? 0);
    const prevActiveUsers7dCount = Number(prevActiveUsers7d[0]?.count ?? 0);

    // Calculate error rate for last 30 days
    const errorRate =
      totalCurrentActions > 0
        ? (errorCurrentActions / totalCurrentActions) * 100
        : 0;
    // Calculate usage growth (last 30d vs prev 30d)
    const usageGrowth = calculateTrend(usage30d, prevUsage30d);

    // Helper to send alert if not sent in last 24h
    async function maybeSendAlert(
      metric: string,
      value: number,
      threshold: number,
      direction: "below" | "above",
      period: string,
      extra?: string,
    ) {
      if (!alertsEnabled) return;
      const cacheKey = `${metric}-${direction}`;
      const now = Date.now();
      const lastSent = alertCache[cacheKey] ?? 0;
      if (now - lastSent < 24 * 60 * 60 * 1000) return; // 24h
      alertCache[cacheKey] = now;
      // Compose email
      const siteName = settingsRow?.general?.site?.name ?? "AI Social Replier";
      const mailConfiguration = settingsRow?.general?.mail;
      if (!mailConfiguration?.apiKey) return;
      const resend = new (await import("resend")).Resend(
        mailConfiguration.apiKey,
      );
      const subject = `[${siteName}] Performance Alert: ${metric} ${direction === "below" ? "Below" : "Above"} Threshold`;
      const text = `Performance Alert for ${siteName}\n\nMetric: ${metric}\nCurrent Value: ${value.toFixed(2)}%\nThreshold: ${threshold}% (${direction})\nPeriod: ${period}\n${extra ? `\n${extra}\n` : ""}\nThis alert was generated automatically by the analytics system.`;
      await resend.emails.send({
        from: `${siteName} <${mailConfiguration.fromEmail}>`,
        to: `${mailConfiguration.toName} <${mailConfiguration.toEmail}>`,
        subject,
        text,
      });
    }

    // Check thresholds and send alerts if needed
    if (alertsEnabled) {
      if (currentSuccessRate < performanceAlerts.successRateThreshold) {
        await maybeSendAlert(
          "Success Rate",
          currentSuccessRate,
          performanceAlerts.successRateThreshold,
          "below",
          "last 30 days",
          "The success rate has dropped below the configured threshold.",
        );
      }
      if (usageGrowth < performanceAlerts.growthThreshold) {
        await maybeSendAlert(
          "Usage Growth",
          usageGrowth,
          performanceAlerts.growthThreshold,
          "below",
          "last 30 days",
          "Usage growth is negative and below the configured threshold.",
        );
      }
      if (errorRate > performanceAlerts.errorRateThreshold) {
        await maybeSendAlert(
          "Error Rate",
          errorRate,
          performanceAlerts.errorRateThreshold,
          "above",
          "last 30 days",
          "The error rate has exceeded the configured threshold.",
        );
      }
    }

    return {
      totalUsage,
      usage24h,
      usage7d,
      usage30d,
      totalUsers,
      activeUsers7d,
      successRate: Math.round(currentSuccessRate * 100) / 100,
      // Trend calculations
      trends: {
        totalUsage: calculateTrend(usage30d, prevUsage30d), // Last 30 days vs previous 30 days
        activeUsers7d: calculateTrend(activeUsers7d, prevActiveUsers7dCount),
        usage7d: calculateTrend(usage7d, prevUsage7d),
        usage24h: calculateTrend(usage24h, prevUsage24h),
        successRate: calculateTrend(currentSuccessRate, prevSuccessRate),
      },
      mostPopularTool: popularTool[0]
        ? {
            name: popularTool[0].toolName,
            displayName:
              AI_TOOLS[popularTool[0].toolName as AIToolKey]?.name ??
              popularTool[0].toolName,
            usage: popularTool[0].count,
          }
        : null,
    };
  }),

  // Send performance alert email - admin only
  sendPerformanceAlert: adminProcedure
    .input(
      z.object({
        type: z.string(), // e.g., 'success-rate', 'growth', 'error-rate'
        message: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch mail configuration from settings
      const siteSettings = await ctx.db.query.settings.findFirst();
      const mailConfiguration = siteSettings?.general?.mail;
      if (!mailConfiguration?.apiKey) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Mail configuration is missing or incomplete.",
        });
      }
      const resend = new (await import("resend")).Resend(
        mailConfiguration.apiKey,
      );
      const alertTypeMap: Record<string, string> = {
        "success-rate": "Success Rate Threshold Exceeded",
        growth: "Usage Growth Alert",
        "error-rate": "Error Rate Alert",
      };
      const subject =
        alertTypeMap[input.type] ?? `Performance Alert: ${input.type}`;
      const text =
        input.message ?? `A performance alert was triggered: ${subject}`;
      const from = `${siteSettings?.general?.site?.name ?? "AI Social Replier"} <${mailConfiguration.fromEmail}>`;
      const to = `${mailConfiguration.toName} <${mailConfiguration.toEmail}>`;
      try {
        const { data, error } = await resend.emails.send({
          from,
          to,
          subject,
          text,
        });
        if (error) {
          throw new Error(error.message ?? "Unknown error from Resend");
        }
        return {
          success: true,
          message: `Performance alert sent successfully. Reference ID: ${data?.id}`,
        };
      } catch (error: unknown) {
        let message = "Failed to send performance alert.";
        if (
          typeof error === "object" &&
          error &&
          "message" in error &&
          typeof (error as { message?: unknown }).message === "string"
        ) {
          message = (error as { message: string }).message;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message,
        });
      }
    }),
});
