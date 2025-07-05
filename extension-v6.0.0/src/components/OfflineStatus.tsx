import { useOnlineStatus } from '@/lib/offline'
import { AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'

interface OfflineStatusProps {
  className?: string
}

export function OfflineAlert() {
  const isOnline = useOnlineStatus()

  if (isOnline)
    return null

  return (
    <div className="flex items-center gap-2 p-3 mb-4 text-sm rounded-md bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <div>
        <p className="font-medium">Limited functionality</p>
        <p className="text-xs opacity-80">
          You're currently offline. Some features may not be available until you're back online.
        </p>
      </div>
    </div>
  )
}

export function OfflineStatus({ className = '' }: OfflineStatusProps) {
  const isOnline = useOnlineStatus()
  const [showOfflineBanner, setShowOfflineBanner] = useState(false)
  const [wasOffline, setWasOffline] = useState(!navigator.onLine)

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true)
      setShowOfflineBanner(true)

      // Auto-hide the banner after 5 seconds
      const timer = setTimeout(() => {
        setShowOfflineBanner(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
    else if (wasOffline) {
      // Show reconnected message briefly
      setShowOfflineBanner(true)

      const timer = setTimeout(() => {
        setShowOfflineBanner(false)
        setWasOffline(false)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isOnline, wasOffline])

  if (!showOfflineBanner)
    return null

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-md shadow-lg ${
          isOnline
            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
        }`}
      >
        {isOnline
          ? (
              <>
                <Wifi className="w-4 h-4" />
                <span>Back online. Syncing data...</span>
              </>
            )
          : (
              <>
                <WifiOff className="w-4 h-4" />
                <span>You're offline. Some features may be limited.</span>
              </>
            )}
      </div>
    </div>
  )
}
