import { useEffect, useState } from 'react'

declare const window: typeof globalThis & Window
declare const navigator: Navigator & {
  onLine: boolean
}

// Hook to track online/offline status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(checkOnlineStatus())

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  return isOnline
}

// Check if the browser is online
function checkOnlineStatus() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

// Export the online status check
export const isOnline = checkOnlineStatus

// Wrapper for API calls with offline support
export async function withOfflineSupport<T>(
  fn: () => Promise<T>,
  onOffline: () => Promise<T> | T
): Promise<T> {
  if (!isOnline()) {
    return onOffline()
  }

  try {
    return await fn()
  } catch (error) {
    if (!isOnline()) {
      return onOffline()
    }
    throw error
  }
}
