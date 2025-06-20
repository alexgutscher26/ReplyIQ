import {
  adminPaymentProcedure,
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { billing } from "@/server/db/schema/billing-schema";
import {
  products,
  type SelectProduct,
} from "@/server/db/schema/products-schema";
import { productFormSchema } from "@/utils/schema/products";
import { TRPCError } from "@trpc/server";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";

export const productsRouter = createTRPCRouter({
  all: adminProcedure
    .output(z.array(z.custom<SelectProduct>()))
    .query(async ({ ctx }) => {
      try {
        return await ctx.db.query.products.findMany();
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch products: ${error instanceof Error ? error.message : String(error)}`,
          cause: error,
        });
      }
    }),
  active: publicProcedure
    .output(z.array(z.custom<SelectProduct>()))
    .query(async ({ ctx }) => {
      try {
        return await ctx.db.query.products.findMany({
          where: (products, { eq }) => eq(products.status, "active"),
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch active products: ${error instanceof Error ? error.message : String(error)}`,
          cause: error,
        });
      }
    }),
  createProduct: adminPaymentProcedure
    .input(productFormSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        let priceId: string | undefined;

        // Only create payment provider price for non-free products
        if (!input.isFree) {
          const settings = await ctx.db.query.settings.findFirst();
          const currency = settings?.general?.payment?.currency ?? "usd";

          // Create price in payment provider (PayPal or Stripe)
          const price = await ctx.payments.instance.createPrice({
            unit_amount: Math.round(Number(input.price) * 100),
            currency,
            product_data: {
              name: input.name,
              ...(input.description && { description: input.description }),
            },
            ...(input.mode === "subscription" && {
              recurring: {
                interval: input.type,
              },
            }),
          });
          priceId = price.id;
        }

        const [result] = await ctx.db
          .insert(products)
          .values({
            ...input,
            price: String(input.price),
            priceId,
          })
          .returning();

        if (!result) {
          throw new Error("Failed to create product");
        }

        return result;
      } catch (error) {
        throw new Error(
          `Failed to create product: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }),
  getAproduct: protectedProcedure
    .input(z.string())
    .output(z.custom<SelectProduct>())
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.query.products.findFirst({
        where: (products, { eq }) => eq(products.id, input),
      });

      if (!product) {
        throw new Error("Product not found");
      }

      return product;
    }),
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean(), message: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const product = await ctx.db.query.products.findFirst({
          where: (products, { eq }) => eq(products.id, input.id),
        });

        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }

        await ctx.db.delete(products).where(eq(products.id, input.id));

        return {
          success: true,
          message: "Product deleted successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete product: ${
            error instanceof Error ? error.message : String(error)
          }`,
        });
      }
    }),
  update: adminPaymentProcedure
    .input(
      z.object({
        id: z.string(),
        data: productFormSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const existing = await ctx.db.query.products.findFirst({
          where: eq(products.id, input.id),
        });

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }

        let priceId = undefined;

        // Only handle Stripe price for non-free products
        if (!input.data.isFree) {
          const settings = await ctx.db.query.settings.findFirst();
          const currency = settings?.general?.payment?.currency ?? "usd";

          // Deactivate existing price if it exists
          if (existing.priceId) {
            await ctx.payments.instance.updatePrice(existing.priceId, {
              active: false,
            });
          }

          const price = await ctx.payments.instance.createPrice({
            unit_amount: Math.round(Number(input.data.price) * 100),
            currency,
            product_data: {
              name: input.data.name,
              description: input.data.description,
            },
            ...(input.data.mode === "subscription" && {
              recurring: {
                interval: input.data.type,
              },
            }),
          });
          priceId = price.id;
        }

        const [result] = await ctx.db
          .update(products)
          .set({
            ...input.data,
            price: String(input.data.price),
            priceId,
          })
          .where(eq(products.id, input.id))
          .returning();

        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }

        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update product: ${
            error instanceof Error ? error.message : String(error)
          }`,
        });
      }
    }),
  subscriber: protectedProcedure
    .input(z.string())
    .output(z.number())
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          count: count(billing.userId).mapWith(Number),
        })
        .from(billing)
        .where(and(eq(billing.productId, input), eq(billing.status, "active")));

      return result[0]?.count ?? 0;
    }),
});
