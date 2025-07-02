/// <reference no-default-lib="true"/>
/// <reference lib="es2022" />
/// <reference lib="WebWorker" />

// Import our custom type definitions
import './types/service-worker'

// This file is a Service Worker that will be bundled with your extension.
// Learn more about service workers: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

const CACHE_NAME = 'replier-cache-v1'
const OFFLINE_URL = '/offline.html'

// Use globalThis instead of self for better compatibility
declare const globalThis: ServiceWorkerGlobalScope

// Files to cache
const CACHE_FILES = ['/', '/assets/*', '/manifest.json', OFFLINE_URL]

// Install event - cache essential assets
globalThis.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Use console.error instead of console.log as per lint rules
      console.error('Service Worker: Opened cache')
      return cache.addAll(CACHE_FILES)
    })
  )
})

// Activate event - clean up old caches
globalThis.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames =>
        Promise.all(cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name)))
      )
  )
})

// Fetch event - serve from cache, falling back to network
globalThis.addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(
    (async () => {
      // Try to get response from cache first
      const cachedResponse = await caches.match(event.request)
      if (cachedResponse) {
        return cachedResponse
      }

      try {
        // Clone the request
        const fetchRequest = event.request.clone()
        const response = await fetch(fetchRequest)

        // Check if we received a valid response
        if (response && response.status === 200 && response.type === 'basic') {
          // Clone the response
          const responseToCache = response.clone()

          // Cache the response in the background
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache))
        }

        return response
      } catch {
        // Network request failed, return offline page or error response
        if (event.request.headers.get('accept')?.includes('text/html')) {
          const offlineResponse = await caches.match(OFFLINE_URL)
          if (offlineResponse) {
            return offlineResponse
          }
        }

        return new Response('No internet connection', {
          headers: { 'Content-Type': 'text/plain' },
          status: 408,
        })
      }
    })()
  )
})

// Listen for messages from the main thread
globalThis.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SKIP_WAITING') {
    void globalThis.skipWaiting()
  }
})
