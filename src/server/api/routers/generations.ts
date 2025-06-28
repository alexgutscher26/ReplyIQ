import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { billing } from "@/server/db/schema/billing-schema";
import { generations } from "@/server/db/schema/generations-schema";
import { usage } from "@/server/db/schema/usage-schema";
import { getAIInstance } from "@/server/utils";
import { generationsSchema } from "@/utils/schema/generations";
import { TRPCError } from "@trpc/server";
import { generateText } from "ai";
import { and, count, eq, gte, lte, or } from "drizzle-orm";
import { z } from "zod";

export const generationRouter = createTRPCRouter({
  generate: protectedProcedure
    .input(generationsSchema)
    .mutation(async ({ ctx, input }) => {
      // Get active subscription
      const activeBilling = await ctx.db.query.billing.findFirst({
        where: and(
          eq(billing.userId, ctx.session.user.id),
          or(eq(billing.status, "active"), eq(billing.status, "APPROVED")),
        ),
        with: {
          product: true,
        },
      });

      if (!activeBilling?.product) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "No active subscription found",
        });
      }

      // Get current usage
      const currentUsage = await ctx.db.query.usage.findFirst({
        where: and(
          eq(usage.userId, ctx.session.user.id),
          eq(usage.productId, activeBilling.productId),
        ),
      });

      const usageCount = currentUsage?.used ?? 0;
      const usageLimit = activeBilling.product.limit ?? 0;

      // Check if user has exceeded their limit (skip for admins)
      if (ctx.session.user.role !== "admin" && usageCount >= usageLimit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Usage limit exceeded for current billing period",
        });
      }

      // Get AI settings and generate response
      const settings = await ctx.db.query.settings.findFirst();
      const ai = settings?.general?.ai;
      const enabledModels = ai?.enabledModels ?? [];

      const customPrompt = settings?.account?.customPrompt?.trim()
        ? settings.account.customPrompt
        : "[NO CUSTOM PROMPT]";

      const defaultPrompt = `You are an AI social media manager designed to craft engaging and human-like social media content for various platforms (Twitter, Facebook, LinkedIn).

For "reply" type:
- Analyze the original post carefully and craft a contextually relevant response
- Consider the author's perspective and the conversation context
- Use the provided tone while maintaining natural dialogue

For "status" type:
- Create an original post about the given topic/keyword
- Format appropriately for the specified platform
- Use the provided tone to shape the message's style

General Guidelines:
- Adapt content style by platform (Twitter: concise, Facebook: moderate, LinkedIn: professional)
- Keep responses natural and authentic, avoiding robotic language
- Use appropriate emojis and casual language when it fits the context
- Match the specified tone while maintaining engagement
- Respond in the same language as the input content
- Follow any additional custom instructions provided
Custom Prompt: ${customPrompt}`;

      const system = ai?.systemPrompt?.trim() ? ai.systemPrompt : defaultPrompt;

      const post = `
        - type: ${input.type}
        - source: ${input.source}
        - link: ${input.link ?? "[NO LINK]"}
        - author: ${input.author ?? "[NO AUTHOR]"}
        - tone: ${input.tone}
        - post: ${input.post}
        ${ai?.systemPrompt?.trim() ? `- customPrompt: ${customPrompt}` : ""}
        `;

      const { instance } = await getAIInstance({
        apiKey: ai?.apiKey ?? "",
        enabledModels,
      });

      const result = await generateText({
        model: instance,
        system,
        prompt: post,
      });

      // Store the generation data
      await ctx.db.insert(generations).values({
        userId: ctx.session.user.id,
        productId: activeBilling.productId,
        source: input.source,
        link: input.link,
        post: input.post,
        reply: result.text,
        author: input.author,
      });

      // Increment usage
      if (currentUsage) {
        await ctx.db
          .update(usage)
          .set({
            used: currentUsage.used + 1,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(usage.userId, ctx.session.user.id),
              eq(usage.productId, activeBilling.productId),
            ),
          );
      } else {
        await ctx.db.insert(usage).values({
          userId: ctx.session.user.id,
          productId: activeBilling.productId,
          used: 1,
        });
      }

      return {
        text: result.text,
        remainingUsage: usageLimit - (usageCount + 1),
      };
    }),

  getFacebookStats: protectedProcedure
    .input(
      z
        .object({
          from: z.date().optional(),
          to: z.date().optional(),
          isSiteWide: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const baseQuery = ctx.db
        .select({
          id: generations.id,
          createdAt: generations.createdAt,
        })
        .from(generations)
        .where(
          and(
            eq(generations.source, "facebook"),
            input?.isSiteWide
              ? undefined
              : eq(generations.userId, ctx.session.user.id),
            input?.from && input?.to
              ? and(
                  gte(generations.createdAt, input.from),
                  lte(generations.createdAt, input.to),
                )
              : undefined,
          ),
        );

      const results = await baseQuery;

      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      // Calculate totals
      const total = results.length;

      const previousTotal = results.filter(
        (row) => (row.createdAt ?? new Date()) < oneMonthAgo,
      ).length;

      const percentageChange =
        total === 0 && previousTotal === 0
          ? 0
          : previousTotal === 0
            ? 100
            : ((total - previousTotal) / previousTotal) * 100;

      return {
        total,
        percentageChange,
      };
    }),

  getTwitterStats: protectedProcedure
    .input(
      z
        .object({
          from: z.date().optional(),
          to: z.date().optional(),
          isSiteWide: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const baseQuery = ctx.db
        .select({
          id: generations.id,
          createdAt: generations.createdAt,
        })
        .from(generations)
        .where(
          and(
            eq(generations.source, "twitter"),
            input?.isSiteWide
              ? undefined
              : eq(generations.userId, ctx.session.user.id),
            input?.from && input?.to
              ? and(
                  gte(generations.createdAt, input.from),
                  lte(generations.createdAt, input.to),
                )
              : undefined,
          ),
        );

      const results = await baseQuery;

      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const total = results.length;
      const previousTotal = results.filter(
        (row) => (row.createdAt ?? new Date()) < oneMonthAgo,
      ).length;

      const percentageChange =
        total === 0 && previousTotal === 0
          ? 0
          : previousTotal === 0
            ? 100
            : ((total - previousTotal) / previousTotal) * 100;

      return {
        total,
        percentageChange,
      };
    }),

  getLinkedinStats: protectedProcedure
    .input(
      z
        .object({
          from: z.date().optional(),
          to: z.date().optional(),
          isSiteWide: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const baseQuery = ctx.db
        .select({
          id: generations.id,
          createdAt: generations.createdAt,
        })
        .from(generations)
        .where(
          and(
            eq(generations.source, "linkedin"),
            input?.isSiteWide
              ? undefined
              : eq(generations.userId, ctx.session.user.id),
            input?.from && input?.to
              ? and(
                  gte(generations.createdAt, input.from),
                  lte(generations.createdAt, input.to),
                )
              : undefined,
          ),
        );

      const results = await baseQuery;

      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const total = results.length;
      const previousTotal = results.filter(
        (row) => (row.createdAt ?? new Date()) < oneMonthAgo,
      ).length;

      const percentageChange =
        total === 0 && previousTotal === 0
          ? 0
          : previousTotal === 0
            ? 100
            : ((total - previousTotal) / previousTotal) * 100;

      return {
        total,
        percentageChange,
      };
    }),

  getSourcesOverview: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1); // January 1st of current year

    const results = await ctx.db
      .select({
        source: generations.source,
        createdAt: generations.createdAt,
      })
      .from(generations)
      .where(
        and(
          eq(generations.userId, ctx.session.user.id),
          gte(generations.createdAt, startOfYear),
        ),
      );

    // Initialize all months with 0 for each source
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      name: new Date(0, i).toLocaleString("default", { month: "short" }),
      facebook: 0,
      instagram: 0,
      twitter: 0,
      linkedin: 0,
      total: 0,
    }));

    // Aggregate results by month and source
    results.forEach((row) => {
      if (row.createdAt) {
        const month = row.createdAt.getMonth();
        if (month >= 0 && month < 12) {
          if (row.source === "facebook") monthlyData[month]!.facebook++;
          if (row.source === "instagram") monthlyData[month]!.instagram++;
          if (row.source === "twitter") monthlyData[month]!.twitter++;
          if (row.source === "linkedin") monthlyData[month]!.linkedin++;
          monthlyData[month]!.total++;
        }
      }
    });

    return monthlyData;
  }),

  getDailyStats: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(30),
        isSiteWide: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const results = await ctx.db
        .select({
          source: generations.source,
          createdAt: generations.createdAt,
        })
        .from(generations)
        .where(
          and(
            input?.isSiteWide
              ? undefined
              : eq(generations.userId, ctx.session.user.id),
            gte(generations.createdAt, startDate),
          ),
        );

      interface DailyStats {
        date: string;
        facebook: number;
        twitter: number;
        linkedin: number;
        total: number;
      }

      // Create a map of dates
      const dateMap = new Map<string, DailyStats>();
      for (let i = 0; i < input.days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0]!;
        dateMap.set(dateStr, {
          date: dateStr,
          facebook: 0,
          twitter: 0,
          linkedin: 0,
          total: 0,
        });
      }

      // Aggregate results by date and source
      results.forEach((row) => {
        if (row.createdAt) {
          const dateStr = row.createdAt.toISOString().split("T")[0] ?? "";
          const data = dateMap.get(dateStr);
          if (data) {
            if (row.source === "facebook") data.facebook++;
            if (row.source === "twitter") data.twitter++;
            if (row.source === "linkedin") data.linkedin++;
            data.total++;
          }
        }
      });

      return Array.from(dateMap.values()).reverse();
    }),

  getSourceTotals: protectedProcedure
    .input(
      z.object({
        isSiteWide: z.boolean().optional(),
        userId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = input?.userId ?? ctx.session.user.id;

      // Get active subscription to determine the limit
      const activeBilling = input.isSiteWide
        ? null
        : await ctx.db.query.billing.findFirst({
            where: and(
              eq(billing.userId, userId),
              or(eq(billing.status, "active"), eq(billing.status, "APPROVED")),
            ),
            with: {
              product: true,
            },
          });

      // Get current month's usage for calendar month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      const monthlyUsage = await ctx.db
        .select({
          count: count(),
        })
        .from(generations)
        .where(
          and(
            input?.isSiteWide ? undefined : eq(generations.userId, userId),
            gte(generations.createdAt, startOfMonth),
            lte(generations.createdAt, endOfMonth),
          ),
        );

      const currentMonthTotal = Number(monthlyUsage[0]?.count ?? 0);

      // Get all entries grouped by source with counts
      const results = await ctx.db
        .select({
          source: generations.source,
          total: count(),
        })
        .from(generations)
        .where(input?.isSiteWide ? undefined : eq(generations.userId, userId))
        .groupBy(generations.source);

      const sources = results.map((result) => ({
        source: result.source,
        total: Number(result.total ?? 0),
      }));

      // Ensure all platforms are represented
      const allPlatforms = ['x', 'facebook', 'linkedin', 'instagram', 'youtube'] as const
      const completeData = allPlatforms.map(platform => {
        const existing = sources.find(item => item.source === platform)
        return existing ?? { source: platform, total: 0 }
      })

      return {
        sources: completeData,
        planLimit: activeBilling?.product?.limit ?? 0,
        currentMonthTotal,
        currentMonth: now.toLocaleString("default", { month: "long" }),
      };
    }),
});
