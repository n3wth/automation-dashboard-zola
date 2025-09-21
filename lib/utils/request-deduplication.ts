// Request deduplication to prevent duplicate API calls
const pendingRequests = new Map<string, Promise<any>>()

export function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  // Check if there's already a pending request for this key
  const pending = pendingRequests.get(key)
  if (pending) {
    return pending as Promise<T>
  }

  // Create new request and store it
  const request = requestFn()
    .then((result) => {
      // Clean up after success
      pendingRequests.delete(key)
      return result
    })
    .catch((error) => {
      // Clean up after error
      pendingRequests.delete(key)
      throw error
    })

  pendingRequests.set(key, request)
  return request
}

// Cache with TTL for API responses
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<any>>()
const DEFAULT_TTL = 5000 // 5 seconds

export function cacheWithTTL<T>(
  key: string,
  requestFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  // Check cache first
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < ttl) {
    return Promise.resolve(cached.data as T)
  }

  // Use deduplication for the actual request
  return deduplicateRequest(key, async () => {
    const result = await requestFn()
    cache.set(key, { data: result, timestamp: Date.now() })
    return result
  })
}

// Clear cache for a specific key
export function clearCache(key: string) {
  cache.delete(key)
  pendingRequests.delete(key)
}

// Clear all caches
export function clearAllCaches() {
  cache.clear()
  pendingRequests.clear()
}