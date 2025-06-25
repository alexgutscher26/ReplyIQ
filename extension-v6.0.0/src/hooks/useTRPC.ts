import type { AppRouter } from '@/entrypoints/background'

import { createTRPCProxyClient } from '@trpc/client'
import { chromeLink } from 'trpc-chrome/link'

interface TRPCClientManager {
  client: null | ReturnType<typeof createTRPCProxyClient<AppRouter>>
  isConnected: boolean
  port: chrome.runtime.Port | null
}

const clientManager: TRPCClientManager = {
  client: null,
  isConnected: false,
  port: null,
}

const logger = {
  debug: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug(`[tRPC Hook] ${message}`, data)
    }
  },
  error: (message: string, error?: unknown) => {
    console.error(`[tRPC Hook] ${message}`, error)
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[tRPC Hook] ${message}`, data)
  },
}

export function useTRPC() {
  try {
    return getOrCreateTRPCClient()
  }
  catch (error) {
    logger.error('Error getting tRPC client', error)

    // Return a proxy that will throw meaningful errors
    return new Proxy({} as ReturnType<typeof createTRPCProxyClient<AppRouter>>, {
      get(_target, prop) {
        throw new Error(`tRPC client unavailable. Failed to connect to background script. Property: ${String(prop)}`)
      },
    })
  }
}

// Utility function to check connection status
export function useTRPCStatus() {
  return {
    isConnected: clientManager.isConnected,
    reconnect: () => {
      logger.debug('Manual reconnection requested')
      clientManager.client = null
      clientManager.isConnected = false
      return getOrCreateTRPCClient()
    },
  }
}

function createTRPCClient(): ReturnType<typeof createTRPCProxyClient<AppRouter>> {
  try {
    // Disconnect existing port if any
    if (clientManager.port) {
      try {
        clientManager.port.disconnect()
      }
      catch (error) {
        logger.debug('Error disconnecting existing port', error)
      }
    }

    // Create new port connection
    const port = browser.runtime.connect()
    clientManager.port = port

    // Set up connection event listeners
    port.onDisconnect.addListener(() => {
      logger.debug('tRPC port disconnected')
      clientManager.isConnected = false
      clientManager.client = null
      clientManager.port = null

      if (browser.runtime.lastError) {
        logger.error('Port disconnection error', browser.runtime.lastError)
      }
    })

    port.onMessage.addListener((message) => {
      logger.debug('tRPC port message received', message)
    })

    // Create tRPC client
    const client = createTRPCProxyClient<AppRouter>({
      links: [
        chromeLink({
          port,
        }),
      ],
    })

    clientManager.client = client
    clientManager.isConnected = true

    logger.debug('tRPC client created successfully')
    return client
  }
  catch (error) {
    logger.error('Failed to create tRPC client', error)
    clientManager.isConnected = false
    clientManager.client = null
    clientManager.port = null
    throw new Error('Failed to establish tRPC connection')
  }
}

function getOrCreateTRPCClient(): ReturnType<typeof createTRPCProxyClient<AppRouter>> {
  // Return existing client if connected
  if (clientManager.client && clientManager.isConnected) {
    return clientManager.client
  }

  // Create new client if none exists or disconnected
  return createTRPCClient()
}

// Cleanup function for development
if (import.meta.env.DEV) {
  // @ts-expect-error - Adding debug utilities to global scope in development
  window.__trpcDebug = {
    getStatus: () => clientManager,
    reconnect: () => getOrCreateTRPCClient(),
  }
}
