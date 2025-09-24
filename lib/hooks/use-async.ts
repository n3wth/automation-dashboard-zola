import { useCallback, useState } from 'react'

interface UseAsyncOptions<TArgs extends unknown[], TResult> {
  onSuccess?: (data: TResult, args: TArgs) => void
  onError?: (error: Error, args: TArgs) => void
}

interface UseAsyncReturn<TResult, TArgs extends unknown[]> {
  data: TResult | null
  isLoading: boolean
  error: string | null
  execute: (...args: TArgs) => Promise<TResult | undefined>
  reset: () => void
}

/**
 * Standardized async operation hook
 * Provides consistent loading, error, and success handling
 */
export function useAsync<TResult, TArgs extends unknown[]>(
  asyncFunction: (...args: TArgs) => Promise<TResult>,
  options: UseAsyncOptions<TArgs, TResult> = {}
): UseAsyncReturn<TResult, TArgs> {
  const [data, setData] = useState<TResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(
    async (...args: TArgs) => {
      try {
        setIsLoading(true)
        setError(null)

        const result = await asyncFunction(...args)
        setData(result)

        options.onSuccess?.(result, args)
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        if (err instanceof Error) {
          options.onError?.(err, args)
        } else {
          options.onError?.(new Error(errorMessage), args)
        }
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
