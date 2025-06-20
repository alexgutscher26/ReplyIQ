import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { billing } from "@/server/db/schema/billing-schema";
import { usage } from "@/server/db/schema/usage-schema";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, lte, or } from "drizzle-orm";
import { z } from "zod";

export const usageRouter = createTRPCRouter({
  getCurrentUsage: protectedProcedure.query(async ({ ctx }) => {
    // Get the active billing subscription for the user
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
        code: "NOT_FOUND",
        message: "No active subscription found",
      });
    }

    // Get usage for the current billing period
    const currentUsage = await ctx.db.query.usage.findFirst({
      where: and(
        eq(usage.userId, ctx.session.user.id),
        eq(usage.productId, activeBilling.productId),
      ),
    });

    return {
      used: currentUsage?.used ?? 0,
      limit: activeBilling.product.limit ?? 0,
      productId: activeBilling.productId,
      periodStart: activeBilling.currentPeriodStart,
      periodEnd: activeBilling.currentPeriodEnd,
    };
  }),

  incrementUsage: protectedProcedure
    .input(
      z.object({
        productId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingUsage = await ctx.db.query.usage.findFirst({
        where: and(
          eq(usage.userId, ctx.session.user.id),
          eq(usage.productId, input.productId),
        ),
      });

      if (existingUsage) {
        return await ctx.db
          .update(usage)
          .set({
            used: existingUsage.used + 1,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(usage.userId, ctx.session.user.id),
              eq(usage.productId, input.productId),
            ),
          );
      }

      return await ctx.db.insert(usage).values({
        userId: ctx.session.user.id,
        productId: input.productId,
        used: 1,
      });
    }),

  getTotalUsage: protectedProcedure
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
          used: usage.used,
          createdAt: usage.createdAt,
        })
        .from(usage)
        .where(
          and(
            // Only filter by user ID if not site-wide
            input?.isSiteWide
              ? undefined
              : eq(usage.userId, ctx.session.user.id),
            // Date range filter if provided
            input?.from && input?.to
              ? and(
                  gte(usage.createdAt, input.from),
                  lte(usage.createdAt, input.to),
                )
              : undefined,
          ),
        );

      const results = await baseQuery;

      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      // Calculate totals
      const total = results.reduce((sum, row) => sum + (row.used ?? 0), 0);

      const previousTotal = results.reduce(
        (sum, row) =>
          sum +
          ((row.createdAt ?? new Date()) < oneMonthAgo ? (row.used ?? 0) : 0),
        0,
      );

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
});
