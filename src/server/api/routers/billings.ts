import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "@/server/api/trpc";
import { billing, type CreateBilling } from "@/server/db/schema/billing-schema";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, lte, or } from "drizzle-orm";
import type Stripe from "stripe";
import { z } from "zod";

// Common subscription shape that works for both Stripe and PayPal
const subscriptionInputSchema = z.discriminatedUnion("provider", [
  // Stripe subscription
  z.object({
    provider: z.literal("stripe"),
    subscription: z.custom<Stripe.Subscription>(),
  }),
  // PayPal subscription
  z.object({
    provider: z.literal("paypal"),
    subscription: z.object({
      id: z.string(),
      status: z.string(),
      start_time: z.string(),
      billing_info: z.object({
        next_billing_time: z.string(),
      }),
      cancel_at_period_end: z.boolean().optional(),
      canceled_at: z.string().optional(),
    }),
  }),
]);

export const billingsRouter = createTRPCRouter({
  createBilling: publicProcedure
    .input(z.custom<CreateBilling>())
    .mutation(async ({ ctx, input }) => {
      try {
        // Check for existing free plan and update its status if found
        const existingFreePlan = await ctx.db.query.billing.findFirst({
          where: (billing, { and, eq }) =>
            and(eq(billing.userId, input.userId), eq(billing.status, "active")),
          with: {
            product: true,
          },
        });

        if (existingFreePlan?.product?.isFree) {
          await ctx.db
            .update(billing)
            .set({
              status: "canceled",
              endedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(billing.id, existingFreePlan.id));
        }

        // Create new billing record
        const [result] = await ctx.db.insert(billing).values(input).returning();

        if (!result) {
          throw new Error("Failed to create billing");
        }

        return result;
      } catch (error) {
        throw new Error(
          `Failed to create billing: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }),
  updateBilling: publicProcedure
    .input(subscriptionInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // First find the billing record
        const existingBilling = await ctx.db.query.billing.findFirst({
          where: eq(billing.providerId, input.subscription.id),
        });

        if (!existingBilling) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `No billing found with providerId: ${input.subscription.id}`,
          });
        }

        // Update based on provider type
        const updateData =
          input.provider === "stripe"
            ? {
                status: input.subscription.status,
                interval:
                  input.subscription.items.data[0]?.price?.recurring?.interval,
                currentPeriodStart: new Date(
                  input.subscription.current_period_start * 1000,
                ),
                currentPeriodEnd: new Date(
                  input.subscription.current_period_end * 1000,
                ),
                cancelAtPeriodEnd: input.subscription.cancel_at_period_end,
                canceledAt: input.subscription.canceled_at
                  ? new Date(input.subscription.canceled_at * 1000)
                  : null,
              }
            : {
                status: input.subscription.status.toLowerCase(),
                interval: "month", // PayPal default
                currentPeriodStart: new Date(input.subscription.start_time),
                currentPeriodEnd: new Date(
                  input.subscription.billing_info.next_billing_time,
                ),
                cancelAtPeriodEnd:
                  input.subscription.cancel_at_period_end ?? false,
                canceledAt: input.subscription.canceled_at
                  ? new Date(input.subscription.canceled_at)
                  : null,
              };

        const [result] = await ctx.db
          .update(billing)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(billing.providerId, input.subscription.id))
          .returning();

        if (!result) {
          throw new Error("Failed to update billing");
        }

        return result;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error; // Re-throw TRPC errors
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update billing: ${error instanceof Error ? error.message : String(error)}`,
          cause: error,
        });
      }
    }),
  getTotalSales: adminProcedure
    .input(
      z
        .object({
          from: z.date().optional(),
          to: z.date().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const baseQuery = ctx.db
        .select({
          amount: billing.amount,
          createdAt: billing.createdAt,
        })
        .from(billing)
        .where(
          input?.from && input?.to
            ? and(
                gte(billing.createdAt, input.from),
                lte(billing.createdAt, input.to),
              )
            : undefined,
        );

      const results = await baseQuery;

      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      // Calculate totals
      const total = results.reduce((sum, row) => sum + Number(row.amount), 0);

      const previousTotal = results.reduce(
        (sum, row) =>
          sum +
          ((row.createdAt ?? new Date()) < oneMonthAgo
            ? Number(row.amount)
            : 0),
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
        count: results.length,
        percentageChange,
      };
    }),
  getTotalSubscriptions: adminProcedure
    .input(
      z
        .object({
          from: z.date().optional(),
          to: z.date().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const baseQuery = ctx.db
        .select({
          status: billing.status,
          createdAt: billing.createdAt,
        })
        .from(billing)
        .where(
          and(
            or(eq(billing.status, "active"), eq(billing.status, "APPROVED")),
            input?.from && input?.to
              ? and(
                  gte(billing.createdAt, input.from),
                  lte(billing.createdAt, input.to),
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
  getPaidUsers: adminProcedure
    .input(
      z
        .object({
          from: z.date().optional(),
          to: z.date().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const baseQuery = ctx.db
        .select({
          userId: billing.userId,
          createdAt: billing.createdAt,
        })
        .from(billing)
        .where(
          input?.from && input?.to
            ? and(
                gte(billing.createdAt, input.from),
                lte(billing.createdAt, input.to),
              )
            : undefined,
        );

      const results = await baseQuery;

      // Get unique user IDs
      const uniqueUsers = [...new Set(results.map((r) => r.userId))];
      const total = uniqueUsers.length;

      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      // Count unique users from previous month
      const previousUsers = [
        ...new Set(
          results
            .filter((row) => (row.createdAt ?? new Date()) < oneMonthAgo)
            .map((r) => r.userId),
        ),
      ];
      const previousTotal = previousUsers.length;

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
  getRevenueOverview: adminProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1); // January 1st of current year

    const results = await ctx.db
      .select({
        amount: billing.amount,
        createdAt: billing.createdAt,
      })
      .from(billing)
      .where(gte(billing.createdAt, startOfYear));

    // Initialize all months with 0
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      name: new Date(0, i).toLocaleString("default", { month: "short" }),
      total: 0,
    }));

    // Aggregate results by month
    results.forEach((row) => {
      if (row.createdAt) {
        const month = row.createdAt.getMonth();
        if (month >= 0 && month < 12) {
          monthlyData[month]!.total += Number(row.amount ?? 0);
        }
      }
    });

    return monthlyData;
  }),
  getRecentSales: adminProcedure.query(async ({ ctx }) => {
    const results = await ctx.db.query.billing.findMany({
      with: {
        user: true,
      },
      where: (billing, { eq }) =>
        or(eq(billing.status, "active"), eq(billing.status, "APPROVED")),
      orderBy: (billing, { desc }) => [desc(billing.createdAt)],
      limit: 5,
    });

    return results.map((sale) => ({
      id: sale.id,
      amount: Number(sale.amount),
      email: sale.user.email,
      name: sale.user.name,
      image: sale.user.image,
      createdAt: sale.createdAt,
    }));
  }),
  getActiveBillingsByProduct: publicProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.billing.findMany({
        where: and(
          eq(billing.productId, input.productId),
          or(eq(billing.status, "active"), eq(billing.status, "APPROVED")),
        ),
      });
    }),
});
