import type { SourcePlatform } from '@/schemas/source'
import type { KeyboardEvent } from 'react'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useContentParser } from '@/hooks/useContentParser'
import { useTRPC } from '@/hooks/useTRPC'
import { cn } from '@/lib/utils'
import { tones } from '@/schemas/tone'
import { TRPCClientError } from '@trpc/client'
import { AlertCircle, Check, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'

interface ToneProps {
  source: SourcePlatform
}

export function Tone({ source }: ToneProps) {
  const trpc = useTRPC()
  const parser = useContentParser(source)
  const [loadingTone, setLoadingTone] = useState<null | string>(null)
  const [error, setError] = useState<null | string>(null)
  const [lastUsedTone, setLastUsedTone] = useState<null | string>(null)
  const [focusedIndex, setFocusedIndex] = useState<null | number>(null)
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([])

  const handleToneAction = async (emoji: string) => {
    const tone = tones.find(t => t.emoji === emoji)
    if (!tone || loadingTone) {
      return
    }

    setLoadingTone(emoji)
    setError(null)

    try {
      const content = await parser.getContent()
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
      setLastUsedTone(emoji)
      setError(null)
    }
    catch (error) {
      const errorMessage = error instanceof TRPCClientError
        ? error.message
        : 'An unexpected error occurred. Please try again.'

      setError(errorMessage)
      await parser.setText(`Error: ${errorMessage}`)
    }
    finally {
      setLoadingTone(null)
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const emoji = e.currentTarget.dataset.emoji
    if (emoji)
      handleToneAction(emoji)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const emoji = e.currentTarget.dataset.emoji
      if (emoji) {
        handleToneAction(emoji)
      }
    }
    else if (e.key === 'ArrowRight') {
      e.preventDefault()
      const nextIndex = (index + 1) % tones.length
      buttonsRef.current[nextIndex]?.focus()
      setFocusedIndex(nextIndex)
    }
    else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prevIndex = (index - 1 + tones.length) % tones.length
      buttonsRef.current[prevIndex]?.focus()
      setFocusedIndex(prevIndex)
    }
    else if (e.key === 'Home') {
      e.preventDefault()
      buttonsRef.current[0]?.focus()
      setFocusedIndex(0)
    }
    else if (e.key === 'End') {
      e.preventDefault()
      buttonsRef.current[tones.length - 1]?.focus()
      setFocusedIndex(tones.length - 1)
    }
  }

  const getToneVariant = (emoji: string) => {
    if (loadingTone === emoji) {
      return 'secondary'
    }
    if (lastUsedTone === emoji) {
      return 'default'
    }
    return 'outline'
  }

  const getToneClassName = (emoji: string, index: number) => {
    return cn(
      'relative h-10 w-10 p-0 transition-all duration-200',
      'hover:scale-110 hover:shadow-md',
      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'active:scale-95',
      {
        'bg-primary/10': lastUsedTone === emoji,
        'opacity-50': loadingTone !== null && loadingTone !== emoji,
        'ring-2 ring-primary/50 shadow-md': lastUsedTone === emoji,
        'ring-2 ring-ring': focusedIndex === index && focusedIndex !== null,
      },
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <div
          aria-label="Select tone"
          className="flex flex-wrap gap-2"
          role="toolbar"
        >
          {tones.map(({ emoji, name }, index) => (
            <Tooltip content={`${name.charAt(0).toUpperCase() + name.slice(1)} tone`}>
              <TooltipTrigger asChild>
                <Button
                  aria-label={`${name.charAt(0).toUpperCase() + name.slice(1)} tone`}
                  className={getToneClassName(emoji, index)}
                  data-emoji={emoji}
                  disabled={loadingTone !== null}
                  onClick={handleClick}
                  onFocus={() => setFocusedIndex(index)}
                  onKeyDown={e => handleKeyDown(e, index)}
                  ref={(el) => {
                    buttonsRef.current[index] = el
                  }}
                  size="icon"
                  variant={getToneVariant(emoji)}
                >
                  {loadingTone === emoji
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : (
                        <span className="text-lg">
                          {emoji}
                          {lastUsedTone === emoji && (
                            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                        </span>
                      )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="capitalize">
                  {name}
                  {' '}
                  tone
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {error && (
          <div
            aria-live="polite"
            className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 p-2 text-destructive"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {lastUsedTone && !error && (
          <div
            aria-live="polite"
            className="text-xs text-muted-foreground transition-opacity duration-200"
          >
            Last used:
            {' '}
            <span className="font-medium">
              {tones.find(t => t.emoji === lastUsedTone)?.name}
            </span>
            {' '}
            tone
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
