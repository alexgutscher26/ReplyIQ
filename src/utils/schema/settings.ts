/// <reference lib="dom" />
import { z } from "zod";

export const siteSettingsSchema = z.object({
  name: z.string().trim().default("Replier"),
  title: z.string().trim().default("AI-powered social media assistant"),
  logo: z.string().trim().default(""),
});
export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export const siteSettingsFormSchema = siteSettingsSchema.extend({
  logo: z
    .custom<FileList>((v) => v instanceof FileList)
    .or(z.string().trim())
    .default(
      "https://raw.githubusercontent.com/lucide-icons/lucide/refs/heads/main/icons/gallery-vertical-end.svg",
    ),
});
export type SiteSettingsFormValues = z.infer<typeof siteSettingsFormSchema>;

export const SOCIAL_PROVIDERS = [
  "apple",
  "discord",
  "facebook",
  "github",
  "google",
  "microsoft",
  "twitch",
  "twitter",
  "dropbox",
  "linkedin",
  "gitlab",
  "reddit",
] as const;

export const socialProviderCredentialsSchema = z.object({
  clientId: z.string().default(""),
  clientSecret: z.string().default(""),
});
export type SocialProviderCredentials = z.infer<
  typeof socialProviderCredentialsSchema
>;

export const authSettingsSchema = z.object({
  enabledProviders: z.array(z.enum(SOCIAL_PROVIDERS)).default([]),
  providerCredentials: z
    .record(z.enum(SOCIAL_PROVIDERS), socialProviderCredentialsSchema)
    .default({}),
  secret: z.string().default(""),
  trustedOrigins: z.array(z.string()).default([]),
});
export type AuthSettings = z.infer<typeof authSettingsSchema>;

export const AI_MODEL_LIST = [
  { key: "gpt-4o-mini", name: "GPT-4 Omega Mini", provider: "openai" },
  {
    key: "mistral-small-latest",
    name: "Mistral Small Latest",
    provider: "mistralai",
  },
  {
    key: "gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash-Lite",
    provider: "google",
  },
] as const;
export type AiModelList = typeof AI_MODEL_LIST;
export type AIModel = (typeof AI_MODEL_LIST)[number]["key"];
export const AI_MODELS = AI_MODEL_LIST.map((model) => model.key) as [
  string,
  ...string[],
];

export const aiModelProviderSettingsSchema = z.object({
  enabledModels: z.array(z.enum(AI_MODELS)).default([]),
  apiKey: z.string().default(""),
  systemPrompt: z.string().default(""),
});
export type AIModelProviderSettings = z.infer<
  typeof aiModelProviderSettingsSchema
>;

export const AIInstanceConfigSchema = z.object({
  apiKey: z.string().trim(),
  enabledModels: z.array(z.enum(AI_MODELS)),
});
export type AIInstanceConfig = z.infer<typeof AIInstanceConfigSchema>;

export const CURRENCIES_LIST = [
  { code: "usd", name: "US Dollar" },
  { code: "eur", name: "Euro" },
  { code: "gbp", name: "British Pound" },
] as const;
export const CURRENCIES = CURRENCIES_LIST.map((currency) => currency.code) as [
  string,
  ...string[],
];

export const PAYMENT_PROVIDERS_LIST = [
  { key: "stripe", name: "Stripe" },
  { key: "paypal", name: "PayPal" },
] as const;
export const PAYMENT_PROVIDERS = PAYMENT_PROVIDERS_LIST.map(
  (provider) => provider.key,
) as [string, ...string[]];
export const paymentProviderSettingsSchema = z.object({
  enabledProviders: z.array(z.enum(PAYMENT_PROVIDERS)).default([]),
  apiKey: z.string().default(""),
  clientSecret: z.string().default("").optional(), // Add this field
  currency: z.enum(CURRENCIES).default(CURRENCIES_LIST[0].code),
});
export type PaymentProviderSettings = z.infer<
  typeof paymentProviderSettingsSchema
>;

export const PAYPAL_WEBHOOK_EVENTS = [
  {
    value: "BILLING.SUBSCRIPTION.UPDATED",
    label: "Subscription Updated",
  },
  {
    value: "BILLING.SUBSCRIPTION.CANCELLED",
    label: "Subscription Cancelled",
  },
  {
    value: "BILLING.SUBSCRIPTION.SUSPENDED",
    label: "Subscription Suspended",
  },
  {
    value: "BILLING.SUBSCRIPTION.ACTIVATED",
    label: "Subscription Activated",
  },
  {
    value: "BILLING.SUBSCRIPTION.PAYMENT.FAILED",
    label: "Payment Failed",
  },
] as const;
export type PaypalWebhookEvent = (typeof PAYPAL_WEBHOOK_EVENTS)[number];
// Extract webhook event values into a tuple
const PAYPAL_WEBHOOK_EVENT_VALUES = PAYPAL_WEBHOOK_EVENTS.map(
  (event) => event.value,
) as [string, ...string[]];

export const STRIPE_WEBHOOK_EVENTS = [
  {
    value: "payment_intent.succeeded",
    label: "Payment Intent Succeeded",
  },
  {
    value: "payment_intent.failed",
    label: "Payment Intent Failed",
  },
  {
    value: "payment_intent.canceled",
    label: "Payment Intent Canceled",
  },
  {
    value: "customer.subscription.created",
    label: "Subscription Created",
  },
  {
    value: "customer.subscription.updated",
    label: "Subscription Updated",
  },
  {
    value: "customer.subscription.deleted",
    label: "Subscription Deleted",
  },
  {
    value: "invoice.paid",
    label: "Invoice Paid",
  },
  {
    value: "invoice.payment_failed",
    label: "Invoice Payment Failed",
  },
] as const;
export type StripeWebhookEvent = (typeof STRIPE_WEBHOOK_EVENTS)[number];
// Extract webhook event values into a tuple
const STRIPE_WEBHOOK_EVENT_VALUES = STRIPE_WEBHOOK_EVENTS.map(
  (event) => event.value,
) as [string, ...string[]];

export const WEBHOOK_CONFIG_MODES = [
  { value: "auto", label: "Auto" },
  { value: "manual", label: "Manual" },
] as const;
export type WebhookConfigMode = (typeof WEBHOOK_CONFIG_MODES)[number];
export const WEBHOOK_CONFIG_MODE_VALUES = WEBHOOK_CONFIG_MODES.map(
  (mode) => mode.value,
) as [string, ...string[]];

export const webhookForPaymentProviderSchema = z.object({
  mode: z.enum(WEBHOOK_CONFIG_MODE_VALUES).default("auto"),
  endpoint: z.string().trim().url().default("").optional(),
  secret: z.string().trim().default(""),
  stripeEvents: z
    .array(
      z.object({
        value: z.enum(STRIPE_WEBHOOK_EVENT_VALUES),
        label: z.string(),
      }),
    )
    .default([
      {
        value: "customer.subscription.created",
        label: "Subscription Created",
      },
      {
        value: "customer.subscription.deleted",
        label: "Subscription Deleted",
      },
    ]),
  paypalEvents: z
    .array(
      z.object({
        value: z.enum(PAYPAL_WEBHOOK_EVENT_VALUES),
        label: z.string(),
      }),
    )
    .default([
      {
        value: "BILLING.SUBSCRIPTION.UPDATED",
        label: "Subscription Updated",
      },
      {
        value: "BILLING.SUBSCRIPTION.CANCELLED",
        label: "Subscription Cancelled",
      },
    ]),
});
export type WebhookForPaymentProvider = z.infer<
  typeof webhookForPaymentProviderSchema
>;

export const STORAGE_PROVIDERS_LIST = [
  { key: "ut", name: "UploadThing" },
  { key: "vercel", name: "Vercel" },
] as const;
export const STORAGE_PROVIDERS = STORAGE_PROVIDERS_LIST.map(
  (provider) => provider.key,
) as [string, ...string[]];
export const storageProviderSettingsSchema = z.object({
  enabledProviders: z.array(z.enum(STORAGE_PROVIDERS)).default([]),
  apiKey: z.string().default(""),
});
export type StorageProviderSettings = z.infer<
  typeof storageProviderSettingsSchema
>;

export const testConnectionSchema = z.object({
  success: z.boolean().default(false),
  message: z.string().default(""),
  logs: z.array(z.string()).default([]),
});
export type TestConnectionResult = z.infer<typeof testConnectionSchema>;

export const downloadExtensionSchema = z.object({
  chrome: z.union([z.string().url(), z.string().max(0)]).optional(),
  firefox: z.union([z.string().url(), z.string().max(0)]).optional(),
});
export type DownloadExtension = z.infer<typeof downloadExtensionSchema>;

export const mailConfigurationSchema = z.object({
  apiKey: z.string().default(""),
  fromEmail: z.string().email().default("onboarding@resend.dev"),
  toName: z.string().default("Resend Dev"),
  toEmail: z.string().email().default("hello@resend.dev"),
});
export type MailConfiguration = z.infer<typeof mailConfigurationSchema>;

// Combined schema for all settings
export const generalSettingsSchema = z.object({
  site: siteSettingsSchema.default({}).optional(),
  auth: authSettingsSchema.default({}).optional(),
  ai: aiModelProviderSettingsSchema.default({}).optional(),
  payment: paymentProviderSettingsSchema.default({}).optional(),
  webhook: webhookForPaymentProviderSchema.default({}).optional(),
  storage: storageProviderSettingsSchema.default({}).optional(),
  download: downloadExtensionSchema.default({}).optional(),
  mail: mailConfigurationSchema.default({}).optional(),
});
export type GeneralSettings = z.infer<typeof generalSettingsSchema>;

export const generalSettingsFormSchema = generalSettingsSchema.extend({
  site: siteSettingsSchema
    .extend({
      logo: z
        .custom<FileList>((v) => v instanceof FileList)
        .or(z.string())
        .optional(),
    })
    .default({}),
});
export type GeneralSettingsFormValues = z.infer<
  typeof generalSettingsFormSchema
>;

// Empty schema since we don't have fields
export const devFormSchema = z.object({
  reset: z.boolean().default(false),
  seed: z.boolean().default(false),
});
export type DevFormValues = z.infer<typeof devFormSchema>;

export const updateUserSettingsSchema = z.object({
  avatar: z.string().trim().optional(),
  name: z.string().trim().optional(),
});
export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>;

export const updateUserSettingsFormSchema = updateUserSettingsSchema.extend({
  avatar: z
    .custom<FileList>((v) => v instanceof FileList)
    .or(z.string())
    .optional(),
});
export type UpdateUserSettingsFormValues = z.infer<
  typeof updateUserSettingsFormSchema
>;

export const updateUserEmailSettingsSchema = z
  .object({
    currentEmail: z.string().email().trim(),
    newEmail: z.string().email().trim(),
  })
  .refine((data) => data.currentEmail !== data.newEmail, {
    message: "The new email cannot be the same as the current email.",
    path: ["newEmail"],
  });
export type UpdateUserEmailSettingsFormValues = z.infer<
  typeof updateUserEmailSettingsSchema
>;

export const UpdateUserPasswordSettingsSchema = z
  .object({
    currentPassword: z.string().min(8).max(64).trim(),
    newPassword: z.string().min(8).max(64).trim(),
    confirmNewPassword: z.string().min(8).max(64).trim(),
    revokeOtherSessions: z.boolean(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New password and confirmation do not match.",
    path: ["confirmNewPassword"], // Add error path
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password cannot be the same as the current password.",
    path: ["newPassword"], // Add error path
  })
  .refine((data) => data.currentPassword !== "", {
    message: "Current password cannot be empty.",
    path: ["currentPassword"], // Add error path
  });
export type UpdateUserPasswordSettingsFormValues = z.infer<
  typeof UpdateUserPasswordSettingsSchema
>;

export const TerminateActiveSessionSchema = z.object({
  terminate: z.boolean().default(false),
});
export type TerminateActiveSessionFormValues = z.infer<
  typeof TerminateActiveSessionSchema
>;

export const TerminateOtherSessionsSchema = z.object({
  terminate: z.boolean().default(false),
});
export type TerminateOtherSessionsFormValues = z.infer<
  typeof TerminateOtherSessionsSchema
>;

export const deleteAccountSchema = z
  .object({
    deleteAccount: z.boolean().default(false),
  })
  .refine((data) => data.deleteAccount === true, {
    message: "Account deletion must be confirmed.",
    path: ["deleteAccount"],
  });
export type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;

export const customPromptSchema = z.object({
  customPrompt: z.string().default(""),
});
export type CustomPromptFormValues = z.infer<typeof customPromptSchema>;

export const accountSettingsSchema = z.object({
  customPrompt: z.string().default(""),
});
export type AccountSettingsFormValues = z.infer<typeof accountSettingsSchema>;

export const supportFormSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});
export type SupportFormValues = z.infer<typeof supportFormSchema>;

export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").min(1, "Email is required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});
export type ContactFormValues = z.infer<typeof contactFormSchema>;
