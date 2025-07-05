/// <reference lib="dom" />

import * as React from 'react'
import { useLocalStorage } from 'usehooks-ts'

import { Button } from '../../components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip'
import { useTRPC } from '../../hooks/useTRPC'

interface EmojiSuggestionsProps {
  onEmojiClick: (emoji: string) => void
  text: string
}

// Constants for better maintainability
const DEBOUNCE_DELAY = 300
const MIN_TEXT_LENGTH = 1
const MAX_SUGGESTIONS_WIDTH = 360
const MAX_HISTORY_ITEMS = 10
const EMOJI_HISTORY_KEY = 'emojiSearchHistory'

export const EmojiSuggestions: React.FC<EmojiSuggestionsProps> = ({
  onEmojiClick,
  text,
}) => {
  const trpc = useTRPC()
  const [suggestions, setSuggestions] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<null | string>(null)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [isVisible, setIsVisible] = React.useState(false)
  const [searchHistory, setSearchHistory] = useLocalStorage<string[]>(EMOJI_HISTORY_KEY, [])
  // eslint-disable-next-line no-empty-pattern
  const [] = React.useState<null | string>(null)

  // Refs for optimization and DOM access
  const lastTextRef = React.useRef('')
  const debounceTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Helper function to check if text is meaningful
  const isMeaningfulText = React.useCallback((inputText: string): boolean => {
    if (!inputText || inputText.trim().length < MIN_TEXT_LENGTH)
      return false

    const meaningfulText = inputText.replace(/[^\w\s]/g, '').trim()
    return meaningfulText.length >= MIN_TEXT_LENGTH
  }, [])

  // Reset suggestions state
  const resetSuggestions = React.useCallback(() => {
    setSuggestions([])
    setIsVisible(false)
    setSelectedIndex(0)
    setError(null)
  }, [])

  // Emoji selection handler with improved UX
  const handleEmojiSelect = React.useCallback((emoji: string) => {
    onEmojiClick(emoji)
    // Update search history
    setSearchHistory((prev: any[]) => {
      const newHistory = [emoji, ...prev.filter(e => e !== emoji)].slice(0, MAX_HISTORY_ITEMS)
      return newHistory
    })
    resetSuggestions()
  }, [onEmojiClick, resetSuggestions, setSearchHistory])

  // Optimized fetch function with better error handling
  const fetchSuggestions = React.useCallback(async (inputText: string) => {
    if (!isMeaningfulText(inputText)) {
      resetSuggestions()
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await trpc.emojis.query({ text: inputText })

      if (data?.emojis?.length > 0) {
        setSuggestions(data.emojis)
        setSelectedIndex(0)
        setIsVisible(true)
      }
      else {
        resetSuggestions()
      }
    }
    catch (err) {
      console.error('Error fetching emoji suggestions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load emoji suggestions')
      setSuggestions([])
      setIsVisible(false)
    }
    finally {
      setLoading(false)
    }
  }, [trpc, isMeaningfulText, resetSuggestions])

  // Retry handler
  const handleRetry = React.useCallback(() => {
    if (text) {
      fetchSuggestions(text)
    }
  }, [text, fetchSuggestions])

  // Optimized debounced effect for text changes
  React.useEffect(() => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Skip if text hasn't changed
    if (text === lastTextRef.current)
      return
    lastTextRef.current = text

    // Reset immediately if text is too short
    if (!isMeaningfulText(text)) {
      resetSuggestions()
      setLoading(false)
      return
    }

    // Debounce the API call
    debounceTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(text)
    }, DEBOUNCE_DELAY)

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [text, fetchSuggestions, isMeaningfulText, resetSuggestions])

  // Enhanced keyboard navigation with better UX
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isVisible || suggestions.length === 0) {
        return
      }

      switch (event.code) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex(prev => (prev + 1) % suggestions.length)
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
          break
        case 'Enter':
        { event.preventDefault()
          const selectedEmoji = suggestions[selectedIndex]
          if (selectedEmoji) {
            handleEmojiSelect(selectedEmoji)
          }
          break }
        case 'Escape':
          event.preventDefault()
          resetSuggestions()
          break
        case 'Tab':
          // Allow tab to close suggestions for better accessibility
          resetSuggestions()
          break
        default:
          break
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isVisible, suggestions, selectedIndex, handleEmojiSelect, resetSuggestions])

  // Click outside handler with improved performance
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && event.target instanceof Node
        && !(containerRef.current as HTMLDivElement).contains(event.target)) {
        resetSuggestions()
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isVisible, resetSuggestions])

  // Loading state component with history preview
  if (loading) {
    return (
      <TooltipProvider delayDuration={300}>
        <div
          aria-label="Emoji suggestions"
          className="absolute left-0 top-full mt-2 w-max max-w-[360px] rounded-md border bg-card shadow-lg z-20 animate-in fade-in-0 slide-in-from-top-2 overflow-hidden"
          ref={containerRef}
          role="listbox"
        >
          <div className="max-h-[300px] overflow-y-auto p-1">
            {suggestions.length > 0
              ? (
                  suggestions.map((emoji, index) => (
                    <Tooltip content={emoji} key={`${emoji}-${index}`}>
                      <TooltipTrigger asChild>
                        <button
                          aria-selected={selectedIndex === index}
                          className={`flex w-full items-center gap-3 rounded-md p-2 text-left text-sm transition-colors ${selectedIndex === index ? 'bg-muted' : 'hover:bg-muted/50'}`}
                          onClick={() => handleEmojiSelect(emoji)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          type="button"
                        >
                          <span className="text-xl">{emoji}</span>
                          <span className="text-muted-foreground">{emoji}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={10}>
                        <span className="text-sm">{emoji}</span>
                      </TooltipContent>
                    </Tooltip>
                  ))
                )
              : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No emojis found. Try a different search.
                  </div>
                )}
          </div>

          <div className="border-t px-3 py-1.5 text-xs text-muted-foreground bg-muted/20">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Enter</kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Esc</kbd>
                <span>Close</span>
              </div>
              {searchHistory.length > 0 && (
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border">Tab</kbd>
                  <span>History</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </TooltipProvider>
    )
  }

  // Error state component with better styling and history fallback
  if (error || (suggestions.length === 0 && isVisible)) {
    return (
      <div
        className="absolute left-0 top-full mt-2 rounded-md border border-destructive/20 bg-card shadow-lg z-20 animate-in fade-in-0 slide-in-from-top-2 overflow-hidden"
        data-testid="emoji-suggestions-error"
        ref={containerRef}
        role="alert"
      >
        <div className="p-3 flex items-center gap-2 border-b">
          <div className="text-destructive">
            <svg
              fill="none"
              height="16"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">No emojis found</p>
            <p className="text-xs text-muted-foreground">Try a different search term</p>
          </div>
          {error && (
            <Button
              className="text-primary hover:bg-primary/10 h-8 px-2 text-xs"
              onClick={handleRetry}
              size="sm"
              variant="ghost"
            >
              Retry
            </Button>
          )}
        </div>

        {searchHistory.length > 0 && (
          <div className="p-2 bg-muted/20">
            <div className="text-xs text-muted-foreground mb-1 px-2">Recent emojis</div>
            <div className="flex flex-wrap gap-1">
              {searchHistory.map((emoji, index) => (
                <button
                  aria-label={`Select emoji ${emoji}`}
                  className="text-2xl p-1.5 rounded-md hover:bg-muted transition-colors"
                  key={`history-${emoji}-${index}`}
                  onClick={() => handleEmojiSelect(emoji)}
                  title={`Use ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Don't render if not visible or no suggestions
  if (!isVisible || suggestions.length === 0) {
    return null
  }

  return (
    <div
      aria-label="Emoji suggestions"
      className="absolute left-0 top-full mt-2 flex flex-wrap gap-1 rounded-md border bg-card p-3 shadow-lg z-20 animate-in fade-in-0 slide-in-from-top-2"
      data-testid="emoji-suggestions"
      ref={containerRef}
      role="listbox"
      style={{ maxWidth: MAX_SUGGESTIONS_WIDTH, minHeight: 60 }}
    >
      <div className="w-full mb-2 border-b border-border pb-2">
        <span className="text-xs text-muted-foreground">
          Use ↑↓ to navigate • Enter to select • Esc to close
        </span>
      </div>

      <div className="flex flex-wrap gap-1 w-full">
        {suggestions.map((emoji, index) => (
          <Button
            aria-label={`Insert emoji ${emoji}`}
            aria-selected={index === selectedIndex}
            className={`
              text-base transition-all duration-150 hover:scale-105 focus:scale-105
              ${index === selectedIndex
            ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20'
            : 'hover:bg-muted'
          }
            `}
            key={`${emoji}-${index}`}
            onClick={() => handleEmojiSelect(emoji)}
            onMouseEnter={() => setSelectedIndex(index)}
            role="option"
            size="sm"
            type="button"
            variant={index === selectedIndex ? 'default' : 'ghost'}
          >
            {emoji}
          </Button>
        ))}
      </div>
    </div>
  )
}
