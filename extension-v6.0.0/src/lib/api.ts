import { toast } from 'sonner'

import { getCachedResponse, saveResponse } from './offlineStorage'

declare const window: typeof globalThis & Window
declare const navigator: Navigator & {
  onLine: boolean
}

interface ApiResponse<T> {
  data?: T
  error?: string
  fromCache?: boolean
}

/**
 * Creates a mutation function with offline support for React Query
 */
export function createOfflineMutation<T, V = void>(
  endpoint: string,
  method: 'DELETE' | 'PATCH' | 'POST' | 'PUT' = 'POST',
  cacheKey?: string,
  ttl = 24 * 60 * 60 * 1000 // 1 day
) {
  return async (data: V): Promise<T> => {
    const result = await fetchWithOfflineSupport<T>(
      endpoint,
      {
        body: JSON.stringify(data),
        method,
      },
      cacheKey || `${endpoint}-${Date.now()}`,
      ttl
    )

    if (result.error) {
      throw new Error(result.error)
    }

    return result.data!
  }
}

/**
 * Creates a query function with offline support for React Query
 */
export function createOfflineQuery<T>(
  queryKey: string,
  endpoint: string,
  options: RequestInit = {},
  ttl = 24 * 60 * 60 * 1000 // 1 day
) {
  return async (): Promise<T> => {
    const result = await fetchWithOfflineSupport<T>(endpoint, options, queryKey, ttl)

    if (result.error) {
      throw new Error(result.error)
    }

    return result.data!
  }
}

/**
 * Wrapper for API calls with offline support
 * @param endpoint - API endpoint (e.g., '/api/endpoint')
 * @param options - Fetch options
 * @param cacheKey - Unique key for caching the response
 * @param ttl - Time to live for cached data in milliseconds (default: 1 day)
 * @returns Promise with the API response
 */
export async function fetchWithOfflineSupport<T>(
  endpoint: string,
  options: RequestInit = {},
  cacheKey: string,
  ttl = 24 * 60 * 60 * 1000 // 1 day
): Promise<ApiResponse<T>> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  const url = new URL(endpoint, baseUrl).toString()

  // Try to get cached data first if offline
  if (!isOnline) {
    const cachedData = await getCachedResponse<T>(cacheKey)
    if (cachedData) {
      return { data: cachedData, fromCache: true }
    }
    return { error: 'You are currently offline and no cached data is available.' }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as T

    // Cache the successful response
    await saveResponse(cacheKey, data, ttl)

    return { data }
  } catch (error) {
    // If online but request failed, try to return cached data if available
    if (isOnline) {
      const cachedData = await getCachedResponse<T>(cacheKey)
      if (cachedData) {
        toast.warning('Using cached data due to network issues')
        return { data: cachedData, fromCache: true }
      }
    }

    console.error('API request failed:', error)
    return {
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
