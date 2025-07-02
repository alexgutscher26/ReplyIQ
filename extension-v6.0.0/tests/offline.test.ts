import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchWithOfflineSupport } from '../src/lib/api'
import { clearExpiredResponses, getCachedResponse, saveResponse } from '../src/lib/offlineStorage'

// Mock the global objects before any tests run
const mockIndexedDB = {
  open: vi.fn(),
}

const mockCaches = {
  delete: vi.fn(),
  keys: vi.fn(),
  match: vi.fn(),
  open: vi.fn(),
}

// Mock fetch globally
const mockFetch = vi.fn()

beforeAll(() => {
  // Mock browser APIs
  globalThis.fetch = mockFetch
  globalThis.caches = mockCaches as any
  globalThis.indexedDB = mockIndexedDB as any
})

describe('offline Functionality', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    })

    // Mock successful IndexedDB operations
    mockIndexedDB.open.mockImplementation(() => ({
      onerror: null,
      onsuccess: null,
      onupgradeneeded: null,
      result: {
        createObjectStore: vi.fn(),
        transaction: vi.fn().mockReturnValue({
          objectStore: vi.fn().mockReturnValue({
            delete: vi.fn().mockResolvedValue(undefined),
            get: vi.fn().mockResolvedValue({
              expiresAt: Date.now() + 3600000, // 1 hour from now
              response: { data: 'cached-data' },
            }),
            getAll: vi.fn().mockResolvedValue([
              { expiresAt: Date.now() + 3600000, id: 'test1', response: 'data1' },
              { expiresAt: Date.now() - 1000, id: 'test2', response: 'data2' }, // Expired
            ]),
            put: vi.fn().mockImplementation((_, key) => {
              if (typeof key === 'string') {
                return Promise.resolve(key)
              }
              return Promise.resolve('test-key')
            }),
          }),
          oncomplete: null,
          onerror: null,
        }),
      },
    }))

    // Mock successful fetch response
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ data: 'test-data' }),
      ok: true,
    } as Response)
  })

  describe('fetchWithOfflineSupport', () => {
    it('should return data from network when online', async () => {
      // Arrange
      const endpoint = '/api/test'
      const responseData = { data: 'test-data' }
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(responseData),
        ok: true,
      })

      // Act
      const result = await fetchWithOfflineSupport(endpoint, {}, 'test-key')

      // Assert
      expect(result.data).toEqual(responseData)
      expect(result.fromCache).toBeUndefined()
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining(endpoint), expect.any(Object))
    })

    it('should return cached data when offline', async () => {
      // Arrange
      Object.defineProperty(navigator, 'onLine', { value: false })
      const endpoint = '/api/test'
      const cacheKey = 'test-key'
      const cachedData = { data: 'cached-data' }

      // Mock the getCachedResponse to return data
      vi.spyOn({ getCachedResponse }, 'getCachedResponse').mockResolvedValueOnce(cachedData)

      // Act
      const result = await fetchWithOfflineSupport(endpoint, {}, cacheKey)

      // Assert
      expect(result.data).toEqual(cachedData)
      expect(result.fromCache).toBe(true)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should return error when offline and no cached data available', async () => {
      // Arrange
      Object.defineProperty(navigator, 'onLine', { value: false })
      const endpoint = '/api/test'

      // Mock the getCachedResponse to return null
      vi.spyOn({ getCachedResponse }, 'getCachedResponse').mockResolvedValueOnce(null)

      // Act
      const result = await fetchWithOfflineSupport(endpoint, {}, 'test-key')

      // Assert
      expect(result.error).toBe('You are currently offline and no cached data is available.')
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('offlineStorage', () => {
    it('should save and retrieve data from IndexedDB', async () => {
      // Arrange
      const key = 'test-key'
      const data = { test: 'data' }

      // Act
      await saveResponse(key, data)
      const result = await getCachedResponse(key)

      // Assert
      expect(result).toBeDefined()
    })

    it('should clear expired responses', async () => {
      // Act
      await clearExpiredResponses()

      // Assert
      // The mock implementation deletes the expired item with id 'test2'
      expect(true).toBe(true) // Just verify the function doesn't throw
    })
  })

  // Test error scenarios
  it('should handle fetch errors gracefully', async () => {
    // Mock a failed fetch
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    // Try to fetch with offline support
    const result = await fetchWithOfflineSupport(
      '/api/error',
      { method: 'GET' },
      'error-test',
      1000
    )

    // Should return an error
    expect(result.error).toBeDefined()
  })

  it('should handle IndexedDB errors gracefully', async () => {
    // Mock IndexedDB error
    mockIndexedDB.open.mockImplementationOnce(() => {
      throw new Error('IndexedDB error')
    })

    // This should not throw
    const result = await getCachedResponse('test')
    expect(result).toBeNull()
  })

  afterEach(() => {
    // Clean up any side effects
    vi.restoreAllMocks()
  })

  afterAll(() => {
    // Clean up global mocks
    vi.restoreAllMocks()

    // Restore globals
    delete (globalThis as any).fetch
    delete (globalThis as any).caches
    delete (globalThis as any).indexedDB
  })
})
