import { z } from 'zod'

const videoSchema = z.object({
  poster: z.string().optional(),
  url: z.string(),
})

const quotedPostSchema = z.object({
  handle: z.string(),
  images: z.array(z.string()),
  text: z.string(),
  username: z.string(),
  video: videoSchema.optional(),
})

export const postSchema = z.object({
  handle: z.string().optional(),
  images: z.array(z.string()).optional(),
  quotedPost: quotedPostSchema.optional(),
  text: z.string(),
  url: z.string().optional(),
  username: z.string().optional(),
  video: videoSchema.optional(),
})

export type PostData = z.infer<typeof postSchema>
