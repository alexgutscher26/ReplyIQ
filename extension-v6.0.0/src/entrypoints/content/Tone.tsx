import type { SourcePlatform } from '@/schemas/source'

import { Button } from '@/components/ui/button'
import { useContentParser } from '@/hooks/useContentParser'
import { useTRPC } from '@/hooks/useTRPC'
import { tones } from '@/schemas/tone'
import { TRPCClientError } from '@trpc/client'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface ToneProps {
  source: SourcePlatform
}

export function Tone({ source }: ToneProps) {
  const trpc = useTRPC()
  const parser = useContentParser(source)
  const [loadingTone, setLoadingTone] = useState<null | string>(null)
  const [error, setError] = useState<null | string>(null)
  const [lastUsedTone, setLastUsedTone] = useState<null | string>(null)

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const tone = tones.find(({ emoji }) => emoji === e.currentTarget.dataset.emoji)
    if (!tone) {
      return
    }

    setLoadingTone(tone.emoji)
    setError(null)

    try {
      const content = parser.getContent(e.currentTarget)
      if (!content) {
        setError('No content found to reply to')
        return
      }

      const response = await trpc.generate.mutate({
        source,
        tone: tone.name,
        type: 'reply',
        ...content,
      })

      if (!response) {
        setError('Failed to generate response')
        return
      }

      await parser.setText(response.text)
      setLastUsedTone(tone.emoji)
      setError(null)
    }
    catch (error) {
      const errorMessage = error instanceof TRPCClientError
        ? error.message
        : 'An unexpected error occurred'

      setError(errorMessage)
      await parser.setText(`Error: ${errorMessage}`)
    }
    finally {
      setLoadingTone(null)
    }
  }

  const getToneVariant = (emoji: string) => {
    if (loadingTone === emoji) {
      return 'default'
    }
    if (lastUsedTone === emoji) {
      return 'secondary'
    }
    return 'ghost'
  }

  const getToneClassName = (emoji: string) => {
    const baseClasses = 'transition-all duration-200'
    if (lastUsedTone === emoji) {
      return `${baseClasses} ring-2 ring-primary/20 bg-primary/10`
    }
    return `${baseClasses} hover:scale-105`
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {tones.map(({ emoji, name }) => (
          <Button
            aria-label={`Reply with ${name} tone`}
            className={getToneClassName(emoji)}
            data-emoji={emoji}
            disabled={loadingTone !== null}
            key={name}
            onClick={handleClick}
            size="icon"
            title={`${name.charAt(0).toUpperCase() + name.slice(1)} tone`}
            variant={getToneVariant(emoji)}
          >
            {loadingTone === emoji
              ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )
              : (
                  <span className="text-lg">{emoji}</span>
                )}
          </Button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
        </div>
      )}

      {lastUsedTone && !error && (
        <div className="text-xs text-muted-foreground">
          Last used:
          {' '}
          {tones.find(t => t.emoji === lastUsedTone)?.name}
          {' '}
          tone
        </div>
      )}
    </div>
  )
}
