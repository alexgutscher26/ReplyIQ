import { postSchema } from '@/schemas/post'
import { generationTypeSchema, sourceSchema } from '@/schemas/source'
import { createTRPCReact } from '@trpc/react-query'
import { initTRPC, TRPCError } from '@trpc/server'
import { observable } from '@trpc/server/observable'
import mitt from 'mitt'
import { createChromeHandler } from 'trpc-chrome/adapter'
import z from 'zod'

type Events = Record<string, unknown> & {
  greeting: string
  updateTimestamp: number
}

const ee = mitt<Events>()

const t = initTRPC.create({
  allowOutsideOfServer: true,
  isServer: false,
})

// Enhanced logging utility
const logger = {
  debug: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug(`[Extension Background] ${message}`, data)
    }
  },
  error: (message: string, error?: unknown) => {
    console.error(`[Extension Background] ${message}`, error)
  },
  info: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info(`[Extension Background] ${message}`, data)
    }
  },
}

// API request utility with retry logic and offline support
async function makeAPIRequest(endpoint: string, data: unknown, retries = 2): Promise<Response> {
  const url = new URL(endpoint, import.meta.env.WXT_SITE_URL).href
  const _cacheKey = `${endpoint}-${JSON.stringify(data)}` // For future offline caching

  // Check if we're offline
  if (!navigator.onLine) {
    logger.debug('Offline - cannot make API request', { endpoint })
    throw new Error('You are currently offline. Please check your internet connection.')
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      logger.debug(`Making API request to ${endpoint}`, { attempt, data })

      const response = await fetch(url, {
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Extension/1.0',
        },
        method: 'POST',
      })

      if (response.ok) {
        logger.debug(`API request successful to ${endpoint}`)
        return response
      }

      if (!response.ok) {
        const errorText = await response.text()
        logger.error(`API request failed with status ${response.status}`, {
          attempt,
          endpoint,
          errorText,
          status: response.status,
          statusText: response.statusText,
        })

        // If this is the last attempt, throw the error
        if (attempt === retries) {
          // If we're offline, provide a more helpful error message
          if (!navigator.onLine) {
            throw new Error('You are currently offline. Please check your internet connection.')
          }

          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }

        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = 1000 * 2 ** attempt
        logger.debug(`Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
    } catch (error) {
      logger.error(`API request error on attempt ${attempt + 1}`, error)

      if (attempt === retries) {
        throw error
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2 ** attempt * 1000))
    }
  }

  throw new Error('All retry attempts failed')
}

// Content processing utility
function processContentForAI(input: {
  handle?: string
  images?: string[]
  quotedPost?: {
    handle: string
    images: string[]
    text: string
    video?: { poster?: string; url: string }
  }
  text: string
  username?: string
  video?: { poster?: string; url: string }
}) {
  const { handle, images, quotedPost, text, username, video } = input
  let fullText = text

  // Add images information with URLs
  if (images && images.length > 0) {
    fullText += '\n\nImages:'
    images.forEach((imageUrl, index) => {
      fullText += `\n${index + 1}. ${imageUrl}`
    })
  }

  // Add video information with poster
  if (video) {
    fullText += '\n\nVideo:'
    fullText += `\nURL: ${video.url}`
    if (video.poster) {
      fullText += `\nThumbnail: ${video.poster}`
    }
  }

  // Add quoted post information with media
  if (quotedPost) {
    fullText += '\n\nQuoted post:'
    fullText += `\n@${quotedPost.handle}: ${quotedPost.text}`

    if (quotedPost.images.length > 0) {
      fullText += '\nQuoted post images:'
      quotedPost.images.forEach((imageUrl, index) => {
        fullText += `\n${index + 1}. ${imageUrl}`
      })
    }

    if (quotedPost.video) {
      fullText += '\nQuoted post video:'
      fullText += `\nURL: ${quotedPost.video.url}`
      if (quotedPost.video.poster) {
        fullText += `\nThumbnail: ${quotedPost.video.poster}`
      }
    }
  }

  return {
    author: username ?? handle,
    post: fullText,
  }
}

// Validation schemas
const emojiInputSchema = z.object({
  text: z.string().min(1, 'Text is required').max(1000, 'Text too long'),
})

const generateInputSchema = postSchema.extend({
  source: sourceSchema,
  tone: z.string().min(1, 'Tone is required'),
  type: generationTypeSchema,
})

// Router definition
const router = t.router({
  emojis: t.procedure
    .input(emojiInputSchema)
    .output(z.object({ emojis: z.array(z.string()) }))
    .query(async ({ input }) => {
      const { text } = input

      try {
        const response = await makeAPIRequest('/api/ai/emojis', { text })
        const data = await response.json()

        if (!response.ok) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Error fetching emoji suggestions: ${data.error || 'Unknown error'}`,
          })
        }

        logger.debug('Emoji suggestions fetched successfully', {
          emojiCount: data.emojis?.length || 0,
          textLength: text.length,
        })

        return data
      } catch (error) {
        logger.error('Failed to fetch emoji suggestions', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch emoji suggestions',
        })
      }
    }),

  generate: t.procedure
    .input(generateInputSchema)
    .output(z.object({ remainingUsage: z.number(), text: z.string() }))
    .mutation(async ({ input }) => {
      const { source, tone, type, url, ...contentData } = input

      try {
        const processedContent = processContentForAI(contentData)

        const response = await makeAPIRequest('/api/ai', {
          link: url,
          source,
          tone,
          type,
          ...processedContent,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new TRPCError({
            code: response.status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_SERVER_ERROR',
            message: `Error generating content: ${data.error || 'Unknown error'}`,
          })
        }

        logger.info('Content generated successfully', {
          remainingUsage: data.remainingUsage,
          source,
          textLength: data.text?.length || 0,
          tone,
          type,
        })

        return data
      } catch (error) {
        logger.error('Failed to generate content', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate content',
        })
      }
    }),

  greeting: t.procedure.input(z.object({ name: z.string() })).query(req => {
    const { input } = req
    ee.emit('greeting', `Greeted ${input.name}`)
    logger.debug('Greeting sent', { name: input.name })
    return `Hello ${input.name}` as const
  }),

  onGreeting: t.procedure.subscription(() => {
    return observable(emit => {
      function onGreet(hello: string) {
        emit.next(hello)
      }

      ee.on('greeting', onGreet)

      return () => {
        ee.off('greeting', onGreet)
      }
    })
  }),

  usage: t.procedure.query(async () => {
    try {
      const response = await makeAPIRequest('/api/usage', {})
      const data = await response.json()

      if (!response.ok) {
        throw new Error(`Error fetching usage data: ${data.message || 'Unknown error'}`)
      }

      logger.debug('Usage data fetched successfully', data)
      return data
    } catch (error) {
      logger.error('Failed to fetch usage data', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch usage data',
      })
    }
  }),
})

export type AppRouter = typeof router
export const trpcReact = createTRPCReact<AppRouter>()

// Listen for online/offline events and notify the UI
function handleOnlineStatusChange() {
  const status = navigator.onLine ? 'online' : 'offline'
  logger.info(`Network status changed: ${status}`)

  // Notify all tabs about the status change
  chrome.tabs.query({}, tabs => {
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { status, type: 'NETWORK_STATUS' })
      }
    }
  })
}

// Initialize network status listeners
function initNetworkListeners() {
  // Use chrome.runtime for extension context instead of window
  chrome.runtime.onStartup.addListener(handleOnlineStatusChange)
  chrome.runtime.onInstalled.addListener(handleOnlineStatusChange)

  // Initial status check
  handleOnlineStatusChange()
}

export default defineBackground({
  main() {
    // Initialize network status listeners
    initNetworkListeners()
    logger.info('Background script starting')

    createChromeHandler({
      createContext: undefined,
      onError: (opts: { error: any; path: any; type: any }) => {
        logger.error('tRPC error occurred', {
          error: opts.error,
          path: opts.path,
          type: opts.type,
        })
      },
      router,
    })

    logger.info('Background script initialized successfully')
  },
  type: 'module',
})
