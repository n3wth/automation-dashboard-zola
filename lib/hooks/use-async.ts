import { useCallback, useState } from 'react'

interface UseAsyncOptions {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

interface UseAsyncReturn<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  execute: (...args: any[]) => Promise<T | undefined>
  reset: () => void
}

/**
 * Standardized async operation hook
 * Provides consistent loading, error, and success handling
 */
export function useAsync<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: UseAsyncOptions = {}
): UseAsyncReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(
    async (...args: any[]) => {
      try {
        setIsLoading(true)
        setError(null)

        const result = await asyncFunction(...args)
        setData(result)

        options.onSuccess?.(result)
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        options.onError?.(err as Error)
      } finally {
        setIsLoading(false)
      }
    },
    [asyncFunction, options]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return { data, isLoading, error, execute, reset }
}