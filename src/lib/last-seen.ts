/**
 * Last-Seen Tracker
 *
 * Tracks when users last viewed certain content areas to show
 * notification badges for new items.
 *
 * Uses localStorage for persistence across sessions.
 */

// =============================================================================
// Types
// =============================================================================

export type LastSeenKey = 'alerts' | 'regulatoryChanges' | 'obligations' | 'evidencePacks'

interface LastSeenState {
  alerts: string | null
  regulatoryChanges: string | null
  obligations: string | null
  evidencePacks: string | null
}

// =============================================================================
// Storage
// =============================================================================

const STORAGE_KEY = 'cindral:last-seen'

function getStoredState(): LastSeenState {
  if (typeof window === 'undefined') {
    return {
      alerts: null,
      regulatoryChanges: null,
      obligations: null,
      evidencePacks: null,
    }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as LastSeenState
    }
  } catch {
    // Ignore parse errors
  }

  return {
    alerts: null,
    regulatoryChanges: null,
    obligations: null,
    evidencePacks: null,
  }
}

function saveState(state: LastSeenState): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage errors (quota exceeded, private mode, etc.)
  }
}

// =============================================================================
// API
// =============================================================================

/**
 * Get the last-seen timestamp for a content area
 */
export function getLastSeen(key: LastSeenKey): Date | null {
  const state = getStoredState()
  const timestamp = state[key]
  return timestamp ? new Date(timestamp) : null
}

/**
 * Mark a content area as seen (now)
 */
export function markAsSeen(key: LastSeenKey): void {
  const state = getStoredState()
  state[key] = new Date().toISOString()
  saveState(state)
}

/**
 * Mark a content area as seen at a specific time
 */
export function markAsSeenAt(key: LastSeenKey, date: Date): void {
  const state = getStoredState()
  state[key] = date.toISOString()
  saveState(state)
}

/**
 * Check if there are new items since last seen
 * Returns the count of new items
 */
export function countNewSince<T extends { createdAt: Date | string }>(key: LastSeenKey, items: T[]): number {
  const lastSeen = getLastSeen(key)

  if (!lastSeen) {
    // Never seen - all items are "new" up to a reasonable limit
    return Math.min(items.length, 99)
  }

  return items.filter((item) => {
    const itemDate = typeof item.createdAt === 'string' ? new Date(item.createdAt) : item.createdAt
    return itemDate > lastSeen
  }).length
}

/**
 * Check if any items are newer than last seen
 */
export function hasNewSince<T extends { createdAt: Date | string }>(key: LastSeenKey, items: T[]): boolean {
  return countNewSince(key, items) > 0
}

/**
 * Get all last-seen timestamps
 */
export function getAllLastSeen(): LastSeenState {
  return getStoredState()
}

/**
 * Clear all last-seen data
 */
export function clearAllLastSeen(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Clear last-seen for a specific key
 */
export function clearLastSeen(key: LastSeenKey): void {
  const state = getStoredState()
  state[key] = null
  saveState(state)
}

// =============================================================================
// React Hook
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react'

interface UseLastSeenReturn {
  lastSeen: Date | null
  markSeen: () => void
  markSeenAt: (date: Date) => void
  clear: () => void
}

/**
 * Hook for tracking last-seen status of a content area
 */
export function useLastSeen(key: LastSeenKey): UseLastSeenReturn {
  const [lastSeen, setLastSeen] = useState<Date | null>(null)

  // Load initial state
  useEffect(() => {
    setLastSeen(getLastSeen(key))
  }, [key])

  const markSeen = useCallback(() => {
    markAsSeen(key)
    setLastSeen(new Date())
  }, [key])

  const markSeenAt = useCallback(
    (date: Date) => {
      markAsSeenAt(key, date)
      setLastSeen(date)
    },
    [key]
  )

  const clear = useCallback(() => {
    clearLastSeen(key)
    setLastSeen(null)
  }, [key])

  return { lastSeen, markSeen, markSeenAt, clear }
}

/**
 * Hook for counting new items since last seen
 */
export function useNewItemsCount<T extends { createdAt: Date | string }>(key: LastSeenKey, items: T[]): number {
  const { lastSeen } = useLastSeen(key)

  // Use useMemo instead of useEffect + useState to avoid the setState-in-effect issue
  const count = useMemo(() => {
    if (!lastSeen) {
      return Math.min(items.length, 99)
    }

    return items.filter((item) => {
      const itemDate = typeof item.createdAt === 'string' ? new Date(item.createdAt) : item.createdAt
      return itemDate > lastSeen
    }).length
  }, [items, lastSeen])

  return count
}
