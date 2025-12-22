'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// =============================================================================
// Types
// =============================================================================

interface UsePollingOptions<T> {
  /** Polling interval in milliseconds */
  interval: number
  /** Enable/disable polling */
  enabled?: boolean
  /** Callback when data updates */
  onUpdate?: (data: T) => void
  /** Callback on error */
  onError?: (error: Error) => void
  /** Retry on error with exponential backoff */
  retryOnError?: boolean
  /** Max retries before giving up */
  maxRetries?: number
  /** Initial backoff delay in ms */
  initialBackoff?: number
  /** Max backoff delay in ms */
  maxBackoff?: number
  /** Stop polling when window is not visible */
  pauseOnHidden?: boolean
}

interface UsePollingReturn<T> {
  /** Latest data */
  data: T | undefined
  /** Loading state */
  isLoading: boolean
  /** Error state */
  error: Error | null
  /** Whether currently polling */
  isPolling: boolean
  /** Last successful update timestamp */
  lastUpdated: Date | null
  /** Manually trigger a refresh */
  refresh: () => Promise<void>
  /** Start polling */
  start: () => void
  /** Stop polling */
  stop: () => void
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Polling hook with exponential backoff and visibility awareness
 *
 * Features:
 * - Configurable interval
 * - Exponential backoff on errors
 * - Pauses when tab is hidden
 * - Manual refresh
 * - Last updated timestamp
 *
 * @example
 * ```tsx
 * const { data, lastUpdated, refresh, isPolling } = usePolling(
 *   () => fetch('/api/data').then(r => r.json()),
 *   {
 *     interval: 30000,
 *     enabled: true,
 *     pauseOnHidden: true,
 *   }
 * )
 * ```
 */
export function usePolling<T>(fetchFn: () => Promise<T>, options: UsePollingOptions<T>): UsePollingReturn<T> {
  const {
    interval,
    enabled = true,
    onUpdate,
    onError,
    retryOnError = true,
    maxRetries = 3,
    initialBackoff = 1000,
    maxBackoff = 30000,
    pauseOnHidden = true,
  } = options

  const [data, setData] = useState<T | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isPolling, setIsPolling] = useState(enabled)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const currentBackoffRef = useRef(initialBackoff)
  const isVisibleRef = useRef(true)
  const isMountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const doFetch = useCallback(async () => {
    if (!isMountedRef.current) return
    if (pauseOnHidden && !isVisibleRef.current) return

    setIsLoading(true)

    try {
      const result = await fetchFn()

      if (!isMountedRef.current) return

      setData(result)
      setError(null)
      setLastUpdated(new Date())
      retryCountRef.current = 0
      currentBackoffRef.current = initialBackoff

      onUpdate?.(result)
    } catch (err) {
      if (!isMountedRef.current) return

      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      onError?.(error)

      // Handle retry with backoff
      if (retryOnError && retryCountRef.current < maxRetries) {
        retryCountRef.current++
        currentBackoffRef.current = Math.min(currentBackoffRef.current * 2, maxBackoff)
        // Don't clear - will retry on next poll
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [fetchFn, onUpdate, onError, retryOnError, maxRetries, initialBackoff, maxBackoff, pauseOnHidden])

  // Track visibility - pause polling when tab is hidden
  useEffect(() => {
    if (!pauseOnHidden) return

    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible'
      // Resume polling immediately when becoming visible
      if (isVisibleRef.current && isPolling) {
        doFetch()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [pauseOnHidden, isPolling, doFetch])

  // Schedule next poll
  const scheduleNextPoll = useCallback(() => {
    if (!isPolling || !isMountedRef.current) return

    const delay = error && retryOnError ? currentBackoffRef.current : interval

    timeoutRef.current = setTimeout(() => {
      doFetch().then(scheduleNextPoll)
    }, delay)
  }, [isPolling, interval, error, retryOnError, doFetch])

  // Start polling
  useEffect(() => {
    if (!enabled) {
      setIsPolling(false)
      return
    }

    setIsPolling(true)

    // Initial fetch
    doFetch().then(scheduleNextPoll)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, doFetch, scheduleNextPoll])

  const refresh = useCallback(async () => {
    // Clear scheduled poll
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    await doFetch()

    // Reschedule
    if (isPolling) {
      scheduleNextPoll()
    }
  }, [doFetch, isPolling, scheduleNextPoll])

  const start = useCallback(() => {
    setIsPolling(true)
    doFetch().then(scheduleNextPoll)
  }, [doFetch, scheduleNextPoll])

  const stop = useCallback(() => {
    setIsPolling(false)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  return {
    data,
    isLoading,
    error,
    isPolling,
    lastUpdated,
    refresh,
    start,
    stop,
  }
}

// =============================================================================
// Format Helpers
// =============================================================================

/**
 * Format last updated timestamp for display
 */
export function formatLastUpdated(date: Date | null): string {
  if (!date) return 'Never'

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)

  if (diffSec < 10) return 'Just now'
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffMin < 60) return `${diffMin}m ago`

  return date.toLocaleTimeString()
}

// =============================================================================
// Convenience Hook for tRPC
// =============================================================================

interface UseTRPCPollingOptions {
  /** Polling interval in milliseconds */
  interval?: number
  /** Enable/disable polling */
  enabled?: boolean
  /** Pause when tab is hidden */
  pauseOnHidden?: boolean
}

/**
 * Hook to add polling to tRPC queries
 * Use with TanStack Query's refetchInterval for simpler cases
 *
 * For complex cases (backoff, visibility), use usePolling directly
 */
export function useTRPCPollingOptions(options: UseTRPCPollingOptions = {}) {
  const { interval = 30000, enabled = true, pauseOnHidden = true } = options
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (!pauseOnHidden) return

    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [pauseOnHidden])

  // TanStack Query v5: refetchInterval must be number | false (not boolean)
  const refetchInterval: number | false = enabled && isVisible ? interval : false

  return {
    refetchInterval,
    refetchIntervalInBackground: !pauseOnHidden,
  } as const
}
