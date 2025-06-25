import type { SourcePlatform } from '@/schemas/source'
import type { StatusFormData } from '@/schemas/status'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
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

  const form = useForm<StatusFormData>({
    defaultValues: {
      keyword: '',
      tone: 'neutral', // Set default tone
    },
    resolver: zodResolver(statusSchema),
  })

  const onSubmit = async (formData: StatusFormData) => {
    setLoadingTone(formData.tone)
    try {
      const response = await trpc.generate.mutate({
        source,
        text: formData.keyword,
        tone: formData.tone,
        type: 'status',
      })
      if (!response)
        return

      await parser.setText(response.text, formRef.current || undefined)
    }
    catch (error) {
      await parser.setText(error instanceof TRPCClientError ? error.message : 'Error: Unknown error', formRef.current || undefined)
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

  const toggleEmojiSuggestions = () => {
    setShowEmojiSuggestions(!showEmojiSuggestions)
  }

  const currentText = form.watch('keyword')

  return (
    <Form {...form}>
      <form
        className="flex gap-2 relative"
        onSubmit={form.handleSubmit(onSubmit)}
        ref={formRef}
      >
        <FormField
          control={form.control}
          name="keyword"
          render={({ field }) => (
            <FormItem className="flex-1 relative z-10">
              <FormControl>
                <div className="relative">
                  <input
                    placeholder="Enter keywords to inspire your tweet ..."
                    {...field}
                    className="pr-10"
                    onChange={(e) => {
                      field.onChange(e)
                      // Auto-show suggestions when typing meaningful content
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
                      if (field.value && field.value.length >= 2) {
                        setShowEmojiSuggestions(true)
                      }
                    }}
                    value={field.value ?? ''}
                  />
                  <Button
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-1"
                    onClick={(e) => {
                      e.preventDefault()
                      toggleEmojiSuggestions()
                    }}
                    size="sm"
                    title="Toggle emoji suggestions"
                    type="button"
                    variant="ghost"
                  >
                    <Sparkles className={`h-4 w-4 ${showEmojiSuggestions ? 'text-primary' : 'text-muted-foreground'}`} />
                  </Button>
                </div>
              </FormControl>
              {showEmojiSuggestions && (
                <EmojiSuggestions
                  onEmojiClick={handleEmojiClick}
                  text={field.value ?? ''}
                />
              )}
              <FormMessage />
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
          className="min-w-[100px]"
          disabled={!form.formState.isValid || loadingTone !== null}
          type="submit"
        >
          {loadingTone
            ? (
                <>
                  <Loader2 className="animate-spin mr-1" />
                  Generating
                </>
              )
            : (
                'Generate'
              )}
        </Button>
      </form>
      {currentText && currentText.length >= 2 && showEmojiSuggestions && (
        <div className="mt-1 text-xs text-muted-foreground">
          💡 Tip: Click an emoji to add it to your text, or use keyboard arrows to navigate
        </div>
      )}
    </Form>
  )
}
