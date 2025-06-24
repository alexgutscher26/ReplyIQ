import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { type User } from "@/server/auth/types";
import { user } from "@/server/db/schema/auth-schema";
import { and, count, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";

export const userRouter = createTRPCRouter({
  total: protectedProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.select({ count: count() }).from(user);

    return users[0]?.count ?? 0;
  }),
  getAuser: publicProcedure
    .input(z.string())
    .output(z.custom<User>())
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.user.findFirst({
        where: (user) => eq(user.id, input),
      });

      if (!user) throw new Error("User not found");
      return {
        ...user,
        role: user.role ?? "user",
      };
    }),
  getTotalUsers: publicProcedure
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
          id: user.id,
          createdAt: user.createdAt,
        })
        .from(user)
        .where(
          input?.from && input?.to
            ? and(
                gte(user.createdAt, input.from),
                lte(user.createdAt, input.to),
              )
            : undefined,
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
});
