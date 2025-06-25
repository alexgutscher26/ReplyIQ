import { Button } from '@/components/ui/button'
import { useTRPC } from '@/hooks/useTRPC'
import * as React from 'react'

interface EmojiSuggestionsProps {
  onEmojiClick: (emoji: string) => void
  text: string
}

export const EmojiSuggestions: React.FC<EmojiSuggestionsProps> = ({ onEmojiClick, text }) => {
  const trpc = useTRPC()
  const [suggestions, setSuggestions] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<null | string>(null)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [isVisible, setIsVisible] = React.useState(false)
  const lastTextRef = React.useRef('')
  const debounceTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Emoji selection handler
  const handleEmojiSelect = React.useCallback((emoji: string) => {
    onEmojiClick(emoji)
    setIsVisible(false)
    setSelectedIndex(0)
  }, [onEmojiClick])

  // Debounced fetch function
  const fetchSuggestions = React.useCallback(async (inputText: string) => {
    if (!inputText || inputText.trim().length < 2) {
      setSuggestions([])
      setIsVisible(false)
      return
    }

    // Only fetch if text has meaningful content (not just spaces or punctuation)
    const meaningfulText = inputText.replace(/[^\w\s]/g, '').trim()
    if (meaningfulText.length < 2) {
      setSuggestions([])
      setIsVisible(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.warn('Fetching emoji suggestions for text:', inputText)
      const data = await trpc.emojis.query({ text: inputText })
      console.warn('Emoji suggestions received:', data)
      if (data.emojis && data.emojis.length > 0) {
        setSuggestions(data.emojis)
        setSelectedIndex(0)
        setIsVisible(true)
      }
      else {
        setSuggestions([])
        setIsVisible(false)
      }
    }
    catch (err) {
      console.error('Error fetching emoji suggestions:', err)
      setError('Failed to load emoji suggestions')
      setSuggestions([])
      setIsVisible(false)
    }
    finally {
      setLoading(false)
    }
  }, [trpc])

  // Debounced effect for text changes
  React.useEffect(() => {
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Skip if text hasn't changed
    if (text === lastTextRef.current) {
      return
    }

    lastTextRef.current = text

    // Hide suggestions immediately if text is too short
    if (!text || text.trim().length < 2) {
      setSuggestions([])
      setIsVisible(false)
      setLoading(false)
      return
    }

    // Debounce the API call
    debounceTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(text)
    }, 500) // 500ms debounce

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [text, fetchSuggestions])

  // Keyboard navigation
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
          event.preventDefault()
          if (suggestions[selectedIndex]) {
            handleEmojiSelect(suggestions[selectedIndex])
          }
          break
        case 'Escape':
          event.preventDefault()
          setIsVisible(false)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, suggestions, selectedIndex, handleEmojiSelect])

  // Click outside to close
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsVisible(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Show loading state
  if (loading) {
    return (
      <div
        className="absolute left-0 top-full mt-2 flex items-center gap-2 rounded-md border bg-card p-3 shadow-sm z-20"
        data-slot="emoji-suggestions"
        ref={containerRef}
      >
        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
        <span className="text-sm text-muted-foreground">Finding emojis...</span>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div
        className="absolute left-0 top-full mt-2 flex items-center gap-2 rounded-md border bg-card p-3 shadow-sm z-20 text-destructive"
        data-slot="emoji-suggestions"
        ref={containerRef}
      >
        <span className="text-sm">
          ⚠️
          {error}
        </span>
        <Button
          className="h-6 px-2 text-xs"
          onClick={() => fetchSuggestions(text)}
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
      className="absolute left-0 top-full mt-2 flex flex-wrap gap-1 rounded-md border bg-card p-2 shadow-lg z-20 max-w-xs"
      data-slot="emoji-suggestions"
      ref={containerRef}
      style={{ minHeight: 40 }}
    >
      <div className="w-full mb-1">
        <span className="text-xs text-muted-foreground">
          Press ↑↓ to navigate, Enter to select, Esc to close
        </span>
      </div>
      {suggestions.map((emoji, index) => (
        <Button
          aria-label={`Insert emoji ${emoji}`}
          className={`transition-colors ${
            index === selectedIndex
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
          key={`${emoji}-${index}`}
          onClick={() => handleEmojiSelect(emoji)}
          onMouseEnter={() => setSelectedIndex(index)}
          size="sm"
          type="button"
          variant={index === selectedIndex ? 'default' : 'ghost'}
        >
          {emoji}
        </Button>
      ))}
    </div>
  )
}
