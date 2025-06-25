import { z } from 'zod'

const TONES = {
  congratulatory: '🎉',
  informative: 'ℹ️',
  negative: '👎',
  neutral: '🤷',
  positive: '👍',
  questionary: '❓',
  trending: '📈',
  viral: '🔥',
} as const

const _ToneSchema = z.object({
  emoji: z.enum(Object.values(TONES) as [string, ...string[]]),
  name: z.enum([...Object.keys(TONES) as [string, ...string[]]]),
})

export const tones = Object.entries(TONES).map(([name, emoji]) => ({
  emoji,
  name,
})) satisfies readonly z.infer<typeof _ToneSchema>[]

export type Tone = typeof tones[number]
