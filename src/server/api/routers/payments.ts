import {
  createTRPCRouter,
  paymentProcedure,
  protectedProcedure,
  publicPaymentProcedure,
} from "@/server/api/trpc";
import { type User } from "@/server/auth/types";
import { billing } from "@/server/db/schema/billing-schema";
import { products } from "@/server/db/schema/products-schema"; // Add this import
import { getBaseUrl } from "@/utils";
import { TRPCError } from "@trpc/server";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";

export const paymentsRouter = createTRPCRouter({
  createSubscription: paymentProcedure
    .input(
      z.object({
        priceId: z.string(),
        customerId: z.string(),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.payments.instance.createSubscription(input),
    ),

  getBalance: paymentProcedure.query(({ ctx }) =>
    ctx.payments.instance.getBalance(),
  ),

  createCheckout: paymentProcedure
    .input(
      z.object({
        productId: z.string(),
      }),
    )
    .output(z.object({ url: z.string(), type: z.enum(["free", "paid"]) }))
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.query.products.findFirst({
        where: (products, { eq }) => eq(products.id, input.productId),
      });

      if (!product) throw new Error("Product not found");

      // Handle free products directly
      if (product.isFree) {
        // Create a free billing record
        await ctx.db.insert(billing).values({
          userId: ctx.session?.user.id ?? "",
          productId: product.id,
          status: "active",
          provider: "free",
          providerId: `free_${Date.now()}`,
          providerTransactionId: `free_${Date.now()}`,
          customerId: ctx.session?.user.id ?? "",
          amount: "0",
          currency: "usd",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        });

        return {
          url: `${getBaseUrl()}/dashboard`,
          type: "free" as const,
        };
      }

      const currency =
        (await ctx.db.query.settings.findFirst())?.general?.payment?.currency ??
        "usd";

      // Determine success URL based on payment provider
      const successUrl =
        ctx.payments.provider.key === "paypal"
          ? `${getBaseUrl()}/api/checkout/paypal` // Simple base URL without token
          : `${getBaseUrl()}/api/checkout/stripe?session_id={CHECKOUT_SESSION_ID}`;

      const { url } = await ctx.payments.instance.createCheckoutSession({
        currency,
        product,
        user: ctx.session?.user as User,
        successUrl,
        cancelUrl: `${getBaseUrl()}/dashboard/settings/account`,
      });

      return {
        url,
        type: "paid" as const,
      };
    }),

  manageBilling: paymentProcedure.mutation(async ({ ctx }) => {
    // Get user's active billing records with products
    const activeBillings = await ctx.db.query.billing.findMany({
      where: (billing, { and, eq }) =>
        and(
          eq(billing.userId, ctx.session?.user.id ?? ""),
          eq(billing.status, "active"),
        ),
    });

    if (!activeBillings.length || !activeBillings[0]?.customerId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No active billing record found",
      });
    }

    // Create billing portal session with filtered products
    return await ctx.payments.instance.manageBillingPortal(
      activeBillings[0].customerId,
    );
  }),

  getSession: publicPaymentProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.payments.instance.getSession(input.sessionId),
    ),

  getSubscription: publicPaymentProcedure
    .input(z.object({ subscriptionId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.payments.instance.getSubscription(input.subscriptionId);
    }),

  getCurrentBilling: protectedProcedure.query(async ({ ctx }) => {
    const activeBilling = await ctx.db.query.billing.findFirst({
      where: and(
        eq(billing.userId, ctx.session.user.id),
        or(eq(billing.status, "active"), eq(billing.status, "APPROVED")),
      ),
      with: {
        product: true,
      },
    });

    if (!activeBilling) {
      return null;
    }

    return {
      id: activeBilling.id,
      providerId: activeBilling.providerId,
      productId: activeBilling.productId,
      product: activeBilling.product,
      status: activeBilling.status,
      currentPeriodEnd: activeBilling.currentPeriodEnd,
    };
  }),

  changePlan: paymentProcedure
    .input(
      z.object({
        newProductId: z.string(),
        subscriptionId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get the product to get its price ID
        const product = await ctx.db.query.products.findFirst({
          where: eq(products.id, input.newProductId),
        });

        if (!product?.priceId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product price not found",
          });
        }

        const result = await ctx.payments.instance.updateSubscription({
          subscriptionId: input.subscriptionId,
          priceId: product.priceId, // Use the stored Stripe price ID
        });

        // Update billing with new product ID
        await ctx.db
          .update(billing)
          .set({
            productId: input.newProductId,
            updatedAt: new Date(),
          })
          .where(eq(billing.providerId, input.subscriptionId));

        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to update subscription",
        });
      }
    }),
  cancelSubscription: paymentProcedure
    .input(z.object({ subscriptionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.payments.instance.cancelSubscription(
          input.subscriptionId,
        );

        // Update billing record
        await ctx.db
          .update(billing)
          .set({
            status: "canceled",
            endedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(billing.providerId, input.subscriptionId));

        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to cancel subscription",
        });
      }
    }),
});
