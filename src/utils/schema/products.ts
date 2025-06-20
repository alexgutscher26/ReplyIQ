import { z } from "zod";

export const productModeEnum = z.enum(["subscription", "payment"]); // https://docs.stripe.com/api/checkout/sessions/object#checkout_session_object-mode
export const productTypeEnum = z.enum(["month", "year"]);
export const productStatusEnum = z.enum(["active", "inactive", "archived"]);

export const productFormSchema = z
  .object({
    name: z.string().default("New Product"),
    description: z.string().default(""),
    isFree: z.boolean().default(false),
    price: z.number().nonnegative().default(5),
    type: productTypeEnum.default("month"),
    mode: productModeEnum.default("subscription"),
    limit: z.number().int().default(5),
    hasTrial: z.boolean().default(false),
    trialDuration: z.number().int().default(1),
    trialUsageLimit: z.number().int().default(5),
    marketingTaglines: z
      .array(z.object({ values: z.string() }))
      .default([{ values: "" }]),
    status: productStatusEnum.default("active"),
  })
  .refine(
    (data) => {
      if (data.isFree) {
        return data.price === 0;
      }
      return data.price > 0;
    },
    {
      message:
        "Free products must have a price of 0, and paid products must have a price greater than 0",
      path: ["price"],
    },
  )
  .refine(
    (data) => {
      if (data.isFree) {
        return !data.hasTrial;
      }
      return true;
    },
    {
      message: "Free products cannot have a trial period",
      path: ["hasTrial"],
    },
  );

export type ProductType = z.infer<typeof productFormSchema>;
