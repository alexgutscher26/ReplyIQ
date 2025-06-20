import { billingsRouter } from "@/server/api/routers/billings";
import { generationRouter } from "@/server/api/routers/generations";
import { paymentsRouter } from "@/server/api/routers/payments";
import { productsRouter } from "@/server/api/routers/products";
import { settingsRouter } from "@/server/api/routers/settings";
import { usageRouter } from "@/server/api/routers/usage";
import { userRouter } from "@/server/api/routers/user";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  settings: settingsRouter,
  payments: paymentsRouter,
  products: productsRouter,
  billings: billingsRouter,
  usage: usageRouter,
  generations: generationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
