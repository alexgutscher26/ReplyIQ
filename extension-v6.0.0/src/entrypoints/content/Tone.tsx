import type { SourcePlatform } from '@/schemas/source'

import { Button } from '@/components/ui/button'
import { useContentParser } from '@/hooks/useContentParser'
import { useTRPC } from '@/hooks/useTRPC'
import { tones } from '@/schemas/tone'
import { TRPCClientError } from '@trpc/client'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

export function Tone({ source }: { source: SourcePlatform }) {
  const trpc = useTRPC()
  const parser = useContentParser(source)
  const [loadingTone, setLoadingTone] = useState<null | string>(null)

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const tone = tones.find(({ emoji }) => emoji === e.currentTarget.textContent)
    if (!tone)
      return

    setLoadingTone(tone.emoji)
    try {
      const content = parser.getContent(e.currentTarget)
      if (!content) {
        await parser.setText('Error: No content found')
        return
      }

      const response = await trpc.generate.mutate({ source, tone: tone.name, type: 'reply', ...content })
      if (!response)
        return

      await parser.setText(response.text)
    }
    catch (error) {
      await parser.setText(error instanceof TRPCClientError ? error.message : 'Error: Unknown error')
    }
    finally {
      setLoadingTone(null)
    }
  }

  return (
    <div className="flex">
      {tones.map(({ emoji, name }) => (
        <Button
          disabled={loadingTone !== null}
          key={name}
          onClick={handleClick}
          size="icon"
          variant="ghost"
        >
          {loadingTone === emoji
            ? (
                <Loader2 className="animate-spin" />
              )
            : (
                emoji
              )}
        </Button>
      ))}
    </div>
  )
}
