import type { AppRouter } from '@/entrypoints/background'

import { createTRPCProxyClient } from '@trpc/client'
import { chromeLink } from 'trpc-chrome/link'

let trpcClient: null | ReturnType<typeof createTRPCProxyClient<AppRouter>> = null

export function useTRPC() {
  if (!trpcClient) {
    const port = browser.runtime.connect()

    trpcClient = createTRPCProxyClient<AppRouter>({
      links: [chromeLink({ port })],
    })
  }

  return trpcClient
}
