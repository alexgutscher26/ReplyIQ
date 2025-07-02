# Offline Support

This document outlines the offline functionality implemented in the AI Social
Reply Generator extension.

## Features

- **Offline Detection**: Automatically detects when the user is offline and
  adjusts functionality accordingly.
- **Cached Responses**: Stores API responses in IndexedDB for offline access.
- **Service Worker**: Caches essential assets for offline use.
- **UI Feedback**: Shows appropriate UI indicators when offline.
- **Automatic Sync**: Automatically syncs data when back online.

## How It Works

### 1. Offline Detection

The extension uses the following methods to detect offline status:

- `navigator.onLine` API
- `online`/`offline` events
- Background script monitoring

### 2. Caching Strategy

- **API Responses**: Cached in IndexedDB with TTL (Time To Live)
- **Assets**: Cached using the Service Worker (CSS, JS, images)
- **User Data**: Locally stored data is available offline

### 3. Service Worker

The service worker (`sw.js`) handles:

- Asset caching
- Offline fallback pages
- Background sync (future)

## Usage

### Checking Online Status

```typescript
import { useNetworkStatus, useOffline, useOnline } from '@/hooks/useOffline'

function MyComponent() {
  const isOffline = useOffline()
  const isOnline = useOnline()
  const { isFeatureAvailable, isOffline: isOffline2 } = useNetworkStatus()

  // Check if a feature is available offline
  const canViewHistory = isFeatureAvailable('viewHistory')

  // ...
}
```

### Making Offline-First API Calls

```typescript
import { fetchWithOfflineSupport } from '@/lib/api'

async function fetchData() {
  const result = await fetchWithOfflineSupport(
    '/api/data',
    { method: 'GET' },
    'data-cache-key',
    3600000 // 1 hour TTL
  )

  if (result.error) {
    // Handle error
    console.error(result.error)
    return
  }

  // Use result.data
  console.log('Data:', result.data)

  // Check if data came from cache
  if (result.fromCache) {
    console.log('Using cached data')
  }
}
```

### React Query Integration

```typescript
import { createOfflineQuery } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

function DataComponent() {
  const { data, error, isLoading } = useQuery({
    queryFn: createOfflineQuery<DataType>(
      'data-query',
      '/api/data',
      { method: 'GET' },
      3600000 // 1 hour TTL
    ),
    queryKey: ['data'],
  })

  // ...
}
```

## Testing Offline Mode

1. **Manual Testing**:

   - Open Chrome DevTools
   - Go to the Network tab
   - Check the "Offline" checkbox to simulate offline mode
   - Test the extension's functionality

2. **Automated Tests**:

   ```bash
   # Run the test suite
   npm test

   # Run tests in watch mode
   npm test -- --watch
   ```

## Limitations

1. **Storage Limits**:

   - Browsers typically limit IndexedDB storage to a percentage of available
     disk space
   - The extension implements automatic cleanup of expired cache entries

2. **Offline Features**:

   - Some features require an internet connection (e.g., AI generation)
   - The UI clearly indicates which features are available offline

3. **Syncing**:
   - Data is synced when the connection is restored
   - Conflicts are resolved using a "last write wins" strategy

## Troubleshooting

### Clearing Cache

To clear all cached data:

1. Open Chrome Extensions (`chrome://extensions/`)
2. Find the AI Social Reply Generator
3. Click "Remove" and reinstall the extension

### Debugging

1. **Service Worker**:

   - Open Chrome DevTools
   - Go to Application > Service Workers
   - Check "Offline" and "Update on reload"

2. **IndexedDB**:
   - Open Chrome DevTools
   - Go to Application > IndexedDB
   - Inspect the `replierOfflineDB` database

## Future Improvements

1. **Background Sync**: Implement background sync for pending operations
2. **Conflict Resolution**: Add more sophisticated conflict resolution
3. **Progressive Enhancement**: Enhance offline capabilities based on user needs
