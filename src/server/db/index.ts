import { env } from "@/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as authSchema from "./schema/auth-schema";
import * as billingSchema from "./schema/billing-schema";
import * as brandVoiceSchema from "./schema/brand-voice-schema";
import * as generationsSchema from "./schema/generations-schema";
import * as postSchema from "./schema/post-schema";
import * as productsSchema from "./schema/products-schema";
import * as settingsSchema from "./schema/settings-schema";
import * as toolAnalyticsSchema from "./schema/tool-analytics-schema";
import * as usageSchema from "./schema/usage-schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const conn = globalForDb.conn ?? postgres(env.DATABASE_URL);
if (env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, {
  schema: {
    ...postSchema,
    ...authSchema,
    ...settingsSchema,
    ...productsSchema,
    ...billingSchema,
    ...usageSchema,
    ...generationsSchema,
    ...toolAnalyticsSchema,
    ...brandVoiceSchema,
  },
});
