import type { ContentParser } from '@/lib/content-parser'
import type { SourcePlatform } from '@/schemas/source'

import { FacebookParser } from '@/lib/facebook-parser'
import { InstagramParser } from '@/lib/instagram-parser'
import { LinkedInParser } from '@/lib/linkedin-parser'
import { TwitterParser } from '@/lib/tweet-parser'
import { YouTubeParser } from '@/lib/youtube-parser'
import { useMemo } from 'react'

export function useContentParser(source: SourcePlatform): ContentParser {
  return useMemo(() => {
    switch (source) {
      case 'facebook':
        return new FacebookParser()
      case 'instagram':
        return new InstagramParser()
      case 'linkedin':
        return new LinkedInParser()
      case 'x':
        return new TwitterParser()
      case 'youtube':
        return new YouTubeParser()
      default:
        throw new Error(`Unsupported platform: ${source}`)
    }
  }, [source])
}
