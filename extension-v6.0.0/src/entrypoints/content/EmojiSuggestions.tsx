import { Button } from '@/components/ui/button'
import { useTRPC } from '@/hooks/useTRPC'
import * as React from 'react'

interface EmojiSuggestionsProps {
  onEmojiClick: (emoji: string) => void
  text: string
}

// Constants for better maintainability
const DEBOUNCE_DELAY = 500
const MIN_TEXT_LENGTH = 2
const MAX_SUGGESTIONS_WIDTH = 320

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
    resetSuggestions()
  }, [onEmojiClick, resetSuggestions])

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
      if (!isVisible || suggestions.length === 0)
        return

      switch (event.key) {
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
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVisible, suggestions, selectedIndex, handleEmojiSelect, resetSuggestions])

  // Click outside handler with improved performance
  React.useEffect(() => {
    if (!isVisible)
      return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        resetSuggestions()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isVisible, resetSuggestions])

  // Loading state component
  if (loading) {
    return (
      <div
        aria-live="polite"
        className="absolute left-0 top-full mt-2 flex items-center gap-2 rounded-md border bg-card p-3 shadow-lg z-20 animate-in fade-in-0 slide-in-from-top-2"
        data-testid="emoji-suggestions-loading"
        ref={containerRef}
        role="status"
      >
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span className="text-sm text-muted-foreground">Finding emojis...</span>
      </div>
    )
  }

  // Error state component with better styling
  if (error) {
    return (
      <div
        className="absolute left-0 top-full mt-2 flex items-center gap-2 rounded-md border border-destructive/20 bg-card p-3 shadow-lg z-20 animate-in fade-in-0 slide-in-from-top-2"
        data-testid="emoji-suggestions-error"
        ref={containerRef}
        role="alert"
      >
        <span className="text-sm text-destructive flex items-center gap-1">
          <span aria-label="Warning" role="img">⚠️</span>
          {error}
        </span>
        <Button
          className="h-6 px-2 text-xs hover:bg-destructive/10"
          onClick={handleRetry}
          size="sm"
          variant="ghost"
        >
          Retry
        </Button>
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
