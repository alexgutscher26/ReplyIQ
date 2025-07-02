interface OfflineResponse {
  expiresAt: number // TTL in milliseconds (7 days)
  id: string
  response: unknown
  timestamp: number
  url: string
}

const DB_NAME = 'replierOfflineDB'
const STORE_NAME = 'responses'
const DB_VERSION = 1

export async function clearExpiredResponses(): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('expiresAt')
    const request = index.openCursor(IDBKeyRange.upperBound(Date.now()))

    request.onsuccess = event => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
      if (cursor) {
        store.delete(cursor.primaryKey)
        cursor.continue()
      }
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    console.error('Failed to clear expired responses:', error)
  }
}

export async function getCachedResponse<T>(url: string): Promise<null | T> {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('url')
    const request = index.getAll(url)

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const responses = request.result as OfflineResponse[]
        if (responses.length === 0) {
          resolve(null)
          return
        }

        // Get the most recent response
        const mostRecent = responses.reduce((latest, current) =>
          current.timestamp > latest.timestamp ? current : latest
        )

        // Check if the response is still valid
        if (mostRecent.expiresAt > Date.now()) {
          resolve(mostRecent.response as T)
        } else {
          // Clean up expired response
          const deleteTransaction = db.transaction(STORE_NAME, 'readwrite')
          const deleteStore = deleteTransaction.objectStore(STORE_NAME)
          deleteStore.delete(mostRecent.id)
          resolve(null)
        }
      }

      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error('Failed to get cached response:', error)
    return null
  }
}

export async function saveResponse(
  url: string,
  response: unknown,
  ttl = 7 * 24 * 60 * 60 * 1000
): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const item: OfflineResponse = {
      expiresAt: Date.now() + ttl,
      id: `${url}-${Date.now()}`,
      response,
      timestamp: Date.now(),
      url,
    }

    store.put(item)

    // Clean up old entries
    const index = store.index('timestamp')
    const request = index.openCursor()

    request.onsuccess = event => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result
      if (cursor) {
        if (cursor.value.expiresAt < Date.now()) {
          store.delete(cursor.primaryKey)
        }
        cursor.continue()
      }
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  } catch (error) {
    console.error('Failed to save response to offline storage:', error)
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(new Error('Failed to open database'))
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('url', 'url', { unique: false })
      }
    }
  })
}
