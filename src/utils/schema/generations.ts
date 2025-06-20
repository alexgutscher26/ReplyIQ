import { z } from "zod";

export const generationsSchema = z.object({
  source: z.string(),
  link: z.string().optional(),
  post: z.string(),
  tone: z.string(),
  type: z.enum(["reply", "status"]),
  author: z.string().optional(),
});
export type GenerationsType = z.infer<typeof generationsSchema>;
