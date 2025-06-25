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

// Uncomment below eslint comments to temporarily turn off object sorting
// /* eslint-disable perfectionist/sort-objects */
const router = t.router({
  emojis: t.procedure.input(z.object({
    text: z.string().min(1, 'Text is required'),
  })).output(z.object({ emojis: z.array(z.string()) })).query(async ({ input }) => {
    const { text } = input

    const res = await fetch(new URL('/api/ai/emojis', import.meta.env.WXT_SITE_URL).href, {
      body: JSON.stringify({ text }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
    const data = await res.json()

    if (!res.ok) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Error fetching emoji suggestions: ${data.error || 'Unknown error'}`,
      })
    }

    return data
  }),
  generate: t.procedure.input(postSchema.extend({
    source: sourceSchema,
    tone: z.string(),
    type: generationTypeSchema,
  })).output(z.object({ remainingUsage: z.number(), text: z.string() })).mutation(async ({ input }) => {
    const { handle, images, quotedPost, source, text, tone, type, url, username, video } = input

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

    const res = await fetch(new URL('/api/ai', import.meta.env.WXT_SITE_URL).href, {
      body: JSON.stringify({ author: username ?? handle, link: url, post: fullText, source, tone, type }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
    const data = await res.json()

    if (!res.ok) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: `Error fetching data: ${data.error || 'Unknown error'}`,
      })
    }

    return data
  }),
  greeting: t.procedure.input(z.object({ name: z.string() })).query((req) => {
    const { input } = req
    ee.emit('greeting', `Greeted ${input.name}`)

    return `Hello ${input.name}` as const
  }),
  onGreeting: t.procedure.subscription(() => {
    return observable((emit) => {
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
    const res = await fetch(new URL('/api/usage', import.meta.env.WXT_SITE_URL).href, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
    const data = await res.json()

    if (!res.ok) {
      throw new Error(`Error fetching data: ${data.message || 'Unknown error'}`)
    }
    return data
  }),
})
// /* eslint-enable perfectionist/sort-objects */

export type AppRouter = typeof router
export const trpcReact = createTRPCReact<AppRouter>()

export default defineBackground({
  main() {
    createChromeHandler({
      createContext: undefined,
      onError: undefined,
      router,
    })
  },
  type: 'module',
})
