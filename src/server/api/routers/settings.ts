import {
  adminPaymentProcedure,
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { getAuthSettingsFromDB } from "@/server/auth/creds";
import { db } from "@/server/db";
import { user } from "@/server/db/schema/auth-schema";
import { settings } from "@/server/db/schema/settings-schema";
import { getAIInstance, getSession, getStorageInstance } from "@/server/utils";
import { getBaseUrl } from "@/utils";
import {
  accountSettingsSchema,
  type AIModel,
  AI_MODEL_LIST,
  aiModelProviderSettingsSchema,
  authSettingsSchema,
  contactFormSchema,
  downloadExtensionSchema,
  generalSettingsSchema,
  mailConfigurationSchema,
  paymentProviderSettingsSchema,
  siteSettingsSchema,
  type SOCIAL_PROVIDERS,
  storageProviderSettingsSchema,
  supportFormSchema,
  testConnectionSchema,
  webhookForPaymentProviderSchema,
} from "@/utils/schema/settings";
import { TRPCError } from "@trpc/server";
import { generateText } from "ai";
import { eq } from "drizzle-orm";
import { reset, seed } from "drizzle-seed";
import { Resend } from "resend";

export const settingsRouter = createTRPCRouter({
  account: protectedProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.query.settings.findFirst();
    // Parse with accountSettingsSchema to ensure default values are set
    return accountSettingsSchema.parse(settings?.account ?? {});
  }),
  updateAccount: protectedProcedure
    .input(accountSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const existingSettings =
        (await ctx.db.query.settings.findFirst()) ??
        (await ctx.db.insert(settings).values({}).returning())[0];

      const result = await ctx.db
        .update(settings)
        .set({
          account: input,
        })
        .where(eq(settings.id, existingSettings!.id));

      return result;
    }),
  general: adminProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.query.settings.findFirst();

    return generalSettingsSchema.parse(settings?.general ?? {});
  }),
  updateGeneral: adminProcedure
    .input(generalSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const existingSettings =
        (await ctx.db.query.settings.findFirst()) ??
        (await ctx.db.insert(settings).values({}).returning())[0];

      const result = await ctx.db
        .update(settings)
        .set({
          general: {
            ...input,
          },
        })
        .where(eq(settings.id, existingSettings!.id));

      return result;
    }),
  site: publicProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.query.settings.findFirst();

    return siteSettingsSchema.parse(settings?.general?.site ?? {});
  }),
  updateSite: adminProcedure
    .input(siteSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const existingSettings =
        (await ctx.db.query.settings.findFirst()) ??
        (await ctx.db.insert(settings).values({}).returning())[0];

      const result = await ctx.db
        .update(settings)
        .set({
          general: {
            ...existingSettings?.general,
            site: input,
          },
        })
        .where(eq(settings.id, existingSettings!.id));

      return result;
    }),
  socialAuthProviders: publicProcedure.query(async ({
    ctx,
  }): Promise<(typeof SOCIAL_PROVIDERS)[number][]> => {
    try {
      const settings = await ctx.db.query.settings.findFirst();
      const auth = authSettingsSchema.parse(settings?.general?.auth ?? {});
      return auth.enabledProviders;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch social auth providers: ${error instanceof Error ? error.message : String(error)}`,
        cause: error,
      });
    }
  }),
  socialAuth: publicProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.query.settings.findFirst();

    return authSettingsSchema.parse(settings?.general?.auth ?? {});
  }),
  updateSocialAuth: adminProcedure
    .input(authSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const existingSettings =
        (await ctx.db.query.settings.findFirst()) ??
        (await ctx.db.insert(settings).values({}).returning())[0];

      const result = await ctx.db
        .update(settings)
        .set({
          general: {
            ...existingSettings?.general,
            auth: input,
          },
        })
        .where(eq(settings.id, existingSettings!.id));

      // Refresh the config store after update
      await getAuthSettingsFromDB();

      return result;
    }),
  aiModel: adminProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.query.settings.findFirst();

    return aiModelProviderSettingsSchema.parse(settings?.general?.ai ?? {});
  }),
  updateAiModel: adminProcedure
    .input(aiModelProviderSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const existingSettings =
        (await ctx.db.query.settings.findFirst()) ??
        (await ctx.db.insert(settings).values({}).returning())[0];

      const result = await ctx.db
        .update(settings)
        .set({
          general: {
            ...existingSettings?.general,
            ai: input,
          },
        })
        .where(eq(settings.id, existingSettings!.id));

      return result;
    }),
  paymentProvider: adminProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.query.settings.findFirst();

    return paymentProviderSettingsSchema.parse(
      settings?.general?.payment ?? {},
    );
  }),
  currency: publicProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.query.settings.findFirst();

    return settings?.general?.payment?.currency ?? "USD";
  }),
  updatePaymentProvider: adminProcedure
    .input(paymentProviderSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const existingSettings =
        (await ctx.db.query.settings.findFirst()) ??
        (await ctx.db.insert(settings).values({}).returning())[0];

      const result = await ctx.db
        .update(settings)
        .set({
          general: {
            ...existingSettings?.general,
            payment: input,
          },
        })
        .where(eq(settings.id, existingSettings!.id));

      return result;
    }),
  webhookSecretForPaymentProvider: publicProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.query.settings.findFirst();

    return settings?.general?.webhook?.secret;
  }),
  webhookForPaymentProvider: adminProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.query.settings.findFirst();

    return webhookForPaymentProviderSchema.parse(
      settings?.general?.webhook ?? {},
    );
  }),
  updateWebhookForPaymentProvider: adminPaymentProcedure
    .input(webhookForPaymentProviderSchema)
    .mutation(async ({ ctx, input }) => {
      const existingSettings =
        (await ctx.db.query.settings.findFirst()) ??
        (await ctx.db.insert(settings).values({}).returning())[0];

      input.endpoint =
        ctx.payments.provider.key === "stripe"
          ? `${getBaseUrl()}/api/webhook/stripe`
          : `${getBaseUrl()}/api/webhook/paypal`;

      if (input.mode === "auto") {
        const webhook = await ctx.payments.instance.createWebhook({
          endpoint: input.endpoint ?? "",
          events:
            ctx.payments.provider.key === "stripe"
              ? (input.stripeEvents?.map((event) => event.value) ?? [])
              : (input.paypalEvents?.map((event) => event.value) ?? []),
        });

        input.secret = webhook.secret;
        input.endpoint = webhook.url;
      }

      const result = await ctx.db
        .update(settings)
        .set({
          general: {
            ...existingSettings?.general,
            webhook: input,
          },
        })
        .where(eq(settings.id, existingSettings!.id));

      return result;
    }),
  storageProvider: adminProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.query.settings.findFirst();

    return storageProviderSettingsSchema.parse(
      settings?.general?.storage ?? {},
    );
  }),
  updateStorageProvider: adminProcedure
    .input(storageProviderSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const existingSettings =
        (await ctx.db.query.settings.findFirst()) ??
        (await ctx.db.insert(settings).values({}).returning())[0];

      const result = await ctx.db
        .update(settings)
        .set({
          general: {
            ...existingSettings?.general,
            storage: input,
          },
        })
        .where(eq(settings.id, existingSettings!.id));

      return result;
    }),
  storageProviderKey: publicProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.query.settings.findFirst();
    return settings?.general?.storage?.apiKey ?? null;
  }),
  downloadExtension: publicProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.query.settings.findFirst();

    return settings?.general?.download ?? {};
  }),
  updateDownloadExtension: adminProcedure
    .input(downloadExtensionSchema)
    .mutation(async ({ ctx, input }) => {
      const existingSettings =
        (await ctx.db.query.settings.findFirst()) ??
        (await ctx.db.insert(settings).values({}).returning())[0];

      const result = await ctx.db
        .update(settings)
        .set({
          general: {
            ...existingSettings?.general,
            download: input,
          },
        })
        .where(eq(settings.id, existingSettings!.id));

      return result;
    }),
  mailConfiguration: adminProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.query.settings.findFirst();

    return mailConfigurationSchema.parse(settings?.general?.mail ?? {});
  }),
  updateMailConfiguration: adminProcedure
    .input(mailConfigurationSchema)
    .mutation(async ({ ctx, input }) => {
      const existingSettings =
        (await ctx.db.query.settings.findFirst()) ??
        (await ctx.db.insert(settings).values({}).returning())[0];

      const result = await ctx.db
        .update(settings)
        .set({
          general: {
            ...existingSettings?.general,
            mail: input,
          },
        })
        .where(eq(settings.id, existingSettings!.id));

      return result;
    }),
  testAiConnection: adminProcedure
    .input(testConnectionSchema)
    .output(testConnectionSchema)
    .mutation(async ({ ctx }) => {
      const logs: string[] = [];
      const ai = (await ctx.db.query.settings.findFirst())?.general?.ai;
      const enabledModels: AIModel[] = (ai?.enabledModels ?? []) as AIModel[];

      try {
        const { instance, model } = await getAIInstance({
          apiKey: ai?.apiKey ?? "",
          enabledModels,
        });

        logs.push(`Testing connection to ${model.name} (${model.provider})...`);

        const result = await generateText({
          model: instance,
          prompt: "Hello, world!",
        });

        logs.push(`Request: ${result.request.body}`);
        logs.push(`Response: ${result.text}`);

        return {
          success: true,
          message: `Successfully connected to ${model.name}`,
          logs,
        };
      } catch (error) {
        logs.push(
          `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
        );

        return {
          success: false,
          message: "Failed to connect to AI provider",
          logs,
        };
      }
    }),
  testPaymentProviderConnection: adminPaymentProcedure
    .input(testConnectionSchema)
    .output(testConnectionSchema)
    .mutation(async ({ ctx }) => {
      const logs: string[] = [];

      try {
        logs.push(`Testing connection to ${ctx.payments.provider.name}...`);

        const balance = await ctx.payments.instance.getBalance();
        logs.push(`Balance: ${JSON.stringify(balance)}`);

        return {
          success: true,
          message: `Successfully connected to ${ctx.payments.provider.name}`,
          logs,
        };
      } catch (error) {
        logs.push(
          `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
        );

        return {
          success: false,
          message: "Failed to connect to payment provider",
          logs,
        };
      }
    }),
  testStorageProviderConnection: adminProcedure
    .input(testConnectionSchema)
    .output(testConnectionSchema)
    .mutation(async ({ ctx }) => {
      const storageProvider = (await ctx.db.query.settings.findFirst())?.general
        ?.storage;
      const logs: string[] = [];

      try {
        const { instance, provider } = await getStorageInstance({
          apiKey: storageProvider?.apiKey ?? "",
          enabledProviders: storageProvider?.enabledProviders ?? [],
        });

        logs.push(`Testing connection to ${provider?.name}...`);

        if (provider.key === "ut") {
          const usageInfo = await instance.getUsageInfo();
          logs.push(`Usage info: ${JSON.stringify(usageInfo)}`);
        }

        return {
          success: true,
          message: "Successfully connected to storage provider",
          logs,
        };
      } catch (error) {
        logs.push(
          `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
        );

        return {
          success: false,
          message: "Failed to connect to storage provider",
          logs,
        };
      }
    }),
  testMailConfiguration: adminProcedure
    .input(testConnectionSchema)
    .output(testConnectionSchema)
    .mutation(async ({ ctx }) => {
      const siteSettings = (await ctx.db.query.settings.findFirst())?.general
        ?.site;
      const mailConfiguration = (await ctx.db.query.settings.findFirst())
        ?.general?.mail;
      const resend = new Resend(mailConfiguration?.apiKey);
      const logs: string[] = [];

      try {
        logs.push(`Testing connection to mail provider...`);

        const { data, error } = await resend.emails.send({
          from: `${siteSettings?.name} <${mailConfiguration?.fromEmail}>`,
          to: `${mailConfiguration?.toName} <${mailConfiguration?.toEmail}>`,
          subject: "Test email",
          text: "This is a test email",
        });

        if (error) {
          logs.push(`Error: ${JSON.stringify(error)}`);

          throw new Error(JSON.stringify(error));
        }

        logs.push(`Response: ${JSON.stringify(data)}`);
        logs.push(`Email successfully sent to ${mailConfiguration?.toEmail}`);

        return {
          success: true,
          message: "Successfully connected to mail provider",
          logs,
        };
      } catch (error) {
        logs.push(
          `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
        );

        return {
          success: false,
          message: "Failed to connect to mail provider",
          logs,
        };
      }
    }),
  sendSupportMail: protectedProcedure
    .input(supportFormSchema)
    .mutation(async ({ input }) => {
      const siteSettings = await db.query.settings.findFirst();
      const mailConfiguration = siteSettings?.general?.mail;
      const session = await getSession();

      const resend = new Resend(mailConfiguration?.apiKey);

      const { data, error } = await resend.emails.send({
        from: `${siteSettings?.general?.site?.name} <${mailConfiguration?.fromEmail}>`,
        to: `${mailConfiguration?.toName} <${mailConfiguration?.toEmail}>`,
        replyTo: `${session?.user?.name} <${session?.user?.email}>`,
        subject: input.subject,
        text: input.message,
      });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return {
        success: true,
        message: `Support email sent successfully. Reference ID: ${data?.id}`,
      };
    }),
  sendContactMail: publicProcedure
    .input(contactFormSchema)
    .mutation(async ({ input }) => {
      const siteSettings = await db.query.settings.findFirst();
      const mailConfiguration = siteSettings?.general?.mail;

      const resend = new Resend(mailConfiguration?.apiKey);

      const { data, error } = await resend.emails.send({
        from: `${siteSettings?.general?.site?.name} <${mailConfiguration?.fromEmail}>`,
        to: `${mailConfiguration?.toName} <${mailConfiguration?.toEmail}>`,
        replyTo: `${input.name} <${input.email}>`,
        subject: input.subject,
        text: input.message,
      });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return {
        success: true,
        message: `Contact email sent successfully. Reference ID: ${data?.id}`,
      };
    }),

  reset: adminProcedure.mutation(async () => {
    await reset(db, [user]);
  }),
  seed: adminProcedure.mutation(async () => {
    await seed(db, [user], { count: 20 });
  }),
  cleanupInvalidAIModels: adminProcedure.mutation(async ({ ctx }) => {
    // Get all valid AI model keys
    const validModels = AI_MODEL_LIST.map(model => model.key);
    
    // Find existing settings
    const existingSettings = await ctx.db.query.settings.findFirst();
    
    if (!existingSettings?.general?.ai?.enabledModels) {
      return { message: "No AI models to clean up", cleanedModels: [] };
    }
    
    // Filter out invalid models and keep only valid ones
    const currentModels = existingSettings.general.ai.enabledModels;
    const cleanedModels = currentModels.filter((model: string) => 
      validModels.includes(model as AIModel)
    );
    
    // If any invalid models were found, update the settings
    if (cleanedModels.length !== currentModels.length) {
      const invalidModels = currentModels.filter((model: string) => 
        !validModels.includes(model as AIModel)
      );
      
      // If no valid models remain, set a default
      const finalModels = cleanedModels.length > 0 ? cleanedModels : ['gpt-4o-mini'];
      
      await ctx.db
        .update(settings)
        .set({
          general: {
            ...existingSettings.general,
            ai: {
              ...existingSettings.general.ai,
              enabledModels: finalModels,
            },
          },
        })
        .where(eq(settings.id, existingSettings.id));
      
      return { 
        message: `Cleaned up ${invalidModels.length} invalid AI models`, 
        cleanedModels: invalidModels,
        newModels: finalModels
      };
    }
    
    return { message: "All AI models are valid", cleanedModels: [] };
  }),
});
