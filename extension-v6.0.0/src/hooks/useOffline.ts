import { useEffect, useState } from 'react'
import { toast } from 'sonner'

declare const window: typeof globalThis & Window
declare const navigator: Navigator & {
  onLine: boolean
}

/**
 * Hook to get the current network status and a function to check if a feature is available offline
 * @returns {object} Network status and availability checker
 */
export function useNetworkStatus() {
  const isOffline = useOffline()

  /**
   * Check if a feature is available offline
   * @param {string} feature - The feature to check
   * @returns {boolean} True if the feature is available offline, false otherwise
   */
  const isFeatureAvailable = (feature: string): boolean => {
    // Define which features are available offline
    const offlineFeatures: Record<string, boolean> = {
      useCachedData: true,
      viewHistory: true,
      viewSavedReplies: true,
      // Add more features as needed
    }

    return offlineFeatures[feature] === true
  }

  return {
    isFeatureAvailable,
    isOffline,
    isOnline: !isOffline,
  }
}

/**
 * Hook to check if the application is currently offline
 * @returns {boolean} True if offline, false if online
 */
export function useOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [wasOffline, setWasOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      if (wasOffline) {
        toast.success('Back online', {
          description: 'Your connection has been restored.',
          duration: 3000,
        })
        setWasOffline(false)
      }
    }

    const handleOffline = () => {
      setIsOffline(true)
      setWasOffline(true)
      toast.warning('You are offline', {
        description: 'Some features may be limited.',
        duration: 5000,
      })
    }

    // Set up event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial check
    if (navigator.onLine) {
      handleOnline()
    } else {
      handleOffline()
    }

    // Clean up
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])

  return isOffline
}

/**
 * Hook to check if the application is currently online
 * @returns {boolean} True if online, false if offline
 */
export function useOnline() {
  return !useOffline()
}
