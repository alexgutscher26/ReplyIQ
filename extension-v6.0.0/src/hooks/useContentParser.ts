import type { ContentParser } from '@/lib/content-parser'
import type { SourcePlatform } from '@/schemas/source'

import { FacebookParser } from '@/lib/facebook-parser'
import { LinkedInParser } from '@/lib/linkedin-parser'
import { TwitterParser } from '@/lib/tweet-parser'
import { useMemo } from 'react'

export function useContentParser(source: SourcePlatform): ContentParser {
  return useMemo(() => {
    switch (source) {
      case 'facebook':
        return new FacebookParser()
      case 'linkedin':
        return new LinkedInParser()
      case 'x':
        return new TwitterParser()
      default:
        throw new Error(`Unsupported platform: ${source}`)
    }
  }, [source])
}
