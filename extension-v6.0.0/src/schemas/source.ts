import { z } from 'zod'

export const sourceSchema = z.enum(['x', 'facebook', 'linkedin', 'instagram', 'youtube'])
export type SourcePlatform = z.infer<typeof sourceSchema>

export const generationTypeSchema = z.enum(['reply', 'status'])
export type GenerationType = z.infer<typeof generationTypeSchema>
