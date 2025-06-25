import { z } from 'zod'

export const statusSchema = z.object({
  keyword: z.string().nonempty(),
  tone: z.string().nonempty(),
})

export type StatusFormData = z.infer<typeof statusSchema>
