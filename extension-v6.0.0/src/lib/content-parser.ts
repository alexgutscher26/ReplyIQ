import type { PostData } from '@/schemas/post'

export interface ContentParser {
  getContent: (element?: HTMLElement) => null | PostData
  setText: (text: string, target?: Element) => Promise<void>
}
