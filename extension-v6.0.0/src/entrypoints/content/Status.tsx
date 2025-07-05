import type { SourcePlatform } from '@/schemas/source'
import type { StatusFormData } from '@/schemas/status'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Progress } from '@/components/ui/progress'
import { useContentParser } from '@/hooks/useContentParser'
import { useTRPC } from '@/hooks/useTRPC'
import { statusSchema } from '@/schemas/status'
import { tones } from '@/schemas/tone'
import { zodResolver } from '@hookform/resolvers/zod'
import { TRPCClientError } from '@trpc/client'
import { Loader2, Sparkles } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { EmojiSuggestions } from './EmojiSuggestions'

export function Status({ source }: { source: SourcePlatform }) {
  const trpc = useTRPC()
  const parser = useContentParser(source)
  const formRef = useRef<HTMLFormElement>(null)
  const [loadingTone, setLoadingTone] = useState<null | string>(null)
  const [showEmojiSuggestions, setShowEmojiSuggestions] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const MAX_CHARACTERS = 280

  const form = useForm<StatusFormData>({
    defaultValues: {
      keyword: '',
      tone: 'neutral', // Set default tone
    },
    resolver: zodResolver(statusSchema),
  })

  const onSubmit = async (formData: StatusFormData) => {
    if (formData.keyword.length > MAX_CHARACTERS) {
      form.setError('keyword', {
        message: `Status exceeds ${MAX_CHARACTERS} characters`,
        type: 'maxLength',
      })
      return
    }

    setLoadingTone(formData.tone)
    try {
      const response = await trpc.generate.mutate({
        source,
        text: formData.keyword.trim(),
        tone: formData.tone,
        type: 'status',
      })
      if (!response) {
        return
      }

      await parser.setText(response.text, formRef.current || undefined)
    }
    catch (error) {
      const errorMessage = error instanceof TRPCClientError
        ? error.message
        : 'An unexpected error occurred. Please try again.'

      form.setError('keyword', {
        message: errorMessage,
        type: 'server',
      })
      await parser.setText(errorMessage, formRef.current || undefined)
    }
    finally {
      setLoadingTone(null)
    }
  }

  const handleEmojiClick = (emoji: string) => {
    const currentValue = form.getValues('keyword')
    const newValue = `${currentValue}${emoji}`
    form.setValue('keyword', newValue)

    // Trigger form validation
    form.trigger('keyword')

    // Focus back to input after emoji selection
    const input = formRef.current?.querySelector('input[name="keyword"]') as HTMLInputElement
    if (input) {
      input.focus()
      // Set cursor to end
      setTimeout(() => {
        input.setSelectionRange(newValue.length, newValue.length)
      }, 0)
    }
  }

  const toggleEmojiSuggestions = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowEmojiSuggestions(!showEmojiSuggestions)
  }

  const currentText = form.watch('keyword', '')
  const characterCount = currentText?.length || 0
  const characterPercentage = Math.min(100, (characterCount / MAX_CHARACTERS) * 100)
  const isNearLimit = characterCount > MAX_CHARACTERS * 0.8
  const isOverLimit = characterCount > MAX_CHARACTERS

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-3 relative"
        onSubmit={form.handleSubmit(onSubmit)}
        ref={formRef}
      >
        <FormField
          control={form.control}
          name="keyword"
          render={({ field }) => (
            <FormItem className="flex-1 relative z-10">
              <div className="space-y-1">
                <FormLabel className={isOverLimit ? 'text-destructive' : ''}>
                  {isOverLimit ? 'Status exceeds character limit' : 'Compose your status'}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <textarea
                      {...field}
                      aria-describedby="character-count"
                      aria-invalid={isOverLimit}
                      className={`min-h-[80px] w-full p-2 pr-10 rounded-md border ${isFocused ? 'border-primary ring-1 ring-ring' : 'border-input'} ${isOverLimit ? 'border-destructive ring-destructive/20' : ''}`}
                      maxLength={MAX_CHARACTERS + 100} // Allow typing beyond limit but show error
                      onBlur={() => setIsFocused(false)}
                      onChange={(e) => {
                        field.onChange(e)
                        if (e.target.value.length >= 2) {
                          setShowEmojiSuggestions(true)
                        }
                        else {
                          setShowEmojiSuggestions(false)
                        }
                      }}
                      onClick={e => e.stopPropagation()}
                      onFocus={(e) => {
                        e.stopPropagation()
                        setIsFocused(true)
                        if (field.value && field.value.length >= 2) {
                          setShowEmojiSuggestions(true)
                        }
                      }}
                      placeholder="What's on your mind?"
                      value={field.value ?? ''}
                    />
                    <div className="absolute right-2 bottom-2 flex items-center gap-2">
                      <span
                        className={`text-xs ${isOverLimit ? 'text-destructive font-medium' : isNearLimit ? 'text-amber-500' : 'text-muted-foreground'}`}
                        id="character-count"
                      >
                        {characterCount}
                        /
                        {MAX_CHARACTERS}
                      </span>
                      <Button
                        className="h-8 w-8 p-1"
                        onClick={toggleEmojiSuggestions}
                        size="sm"
                        title="Toggle emoji suggestions"
                        type="button"
                        variant="ghost"
                      >
                        <Sparkles className={`h-4 w-4 ${showEmojiSuggestions ? 'text-primary' : 'text-muted-foreground'}`} />
                      </Button>
                    </div>
                  </div>
                </FormControl>
                <div className="h-1.5 w-full">
                  <Progress
                    className={`h-full ${isOverLimit ? 'bg-destructive/20' : isNearLimit ? 'bg-amber-500/20' : 'bg-muted'}`}
                    indicatorClassName={isOverLimit ? 'bg-destructive' : isNearLimit ? 'bg-amber-500' : 'bg-primary'}
                    value={characterPercentage}
                  />
                </div>
                {showEmojiSuggestions && (
                  <EmojiSuggestions
                    onEmojiClick={handleEmojiClick}
                    text={field.value ?? ''}
                  />
                )}
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tone"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <select
                  {...field}
                  className="min-w-[120px]"
                  onClick={e => e.stopPropagation()}
                  onFocus={e => e.stopPropagation()}
                  value={field.value}
                >
                  {tones.map(({ emoji, name }) => (
                    <option key={name} value={name}>
                      {emoji}
                      {' '}
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          className="min-w-[120px]"
          disabled={!form.formState.isValid || loadingTone !== null || isOverLimit}
          size="lg"
          type="submit"
        >
          {loadingTone
            ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Generating
                  {' '}
                  {loadingTone}
                  {' '}
                  response...
                </>
              )
            : 'Generate Post'}
        </Button>
      </form>
      {currentText && currentText.length >= 2 && showEmojiSuggestions && (
        <div className="px-1 text-xs text-muted-foreground flex items-center gap-1">
          <span className="text-primary">💡</span>
          <span>Click an emoji to add it, or use arrow keys + Enter to select</span>
        </div>
      )}
    </Form>
  )
}
