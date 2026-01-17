/**
 * In-Memory Cache with TTL
 *
 * Provides:
 * - LRU-like eviction based on TTL
 * - Stale-while-revalidate pattern
 * - Cache key generators for common patterns
 * - Redis adapter interface for production scaling
 *
 * Note: In serverless (Vercel), this cache is per-invocation only.
 * For persistent caching across requests, use Redis via REDIS_URL env var.
 */

import { logger } from './logger'

// =============================================================================
// Types
// =============================================================================

interface CacheEntry<T> {
  value: T
  expiresAt: number
  staleAt?: number
}

interface CacheOptions {
  /** Time to live in seconds */
  ttlSec: number
  /** Stale-while-revalidate window in seconds */
  staleWhileRevalidateSec?: number
}

interface CacheStats {
  hits: number
  misses: number
  staleHits: number
  size: number
}

type CacheStore = Map<string, CacheEntry<unknown>>

// =============================================================================
// Configuration
// =============================================================================

/** Default TTL (5 minutes) */
const DEFAULT_TTL_SEC = 300

/** Max cache entries - conservative for serverless memory */
const MAX_ENTRIES = 1000

/** Cleanup interval (1 minute) */
const CLEANUP_INTERVAL_MS = 60_000

// =============================================================================
// In-Memory Cache Implementation
// =============================================================================

class MemoryCache {
  private store: CacheStore = new Map()
  private stats: CacheStats = { hits: 0, misses: 0, staleHits: 0, size: 0 }
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Start cleanup interval (only in long-running processes)
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
      this.startCleanup()
    }
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): { value: T; isStale: boolean } | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined
    const now = Date.now()

    if (!entry) {
      this.stats.misses++
      return null
    }

    // Check if completely expired
    if (entry.expiresAt < now) {
      this.store.delete(key)
      this.stats.size = this.store.size
      this.stats.misses++
      return null
    }

    // Check if stale
    const isStale = entry.staleAt !== undefined && entry.staleAt < now

    if (isStale) {
      this.stats.staleHits++
    } else {
      this.stats.hits++
    }

    return { value: entry.value, isStale }
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, options?: CacheOptions): void {
    const ttlSec = options?.ttlSec ?? DEFAULT_TTL_SEC
    const now = Date.now()

    const entry: CacheEntry<T> = {
      value,
      expiresAt: now + ttlSec * 1000,
    }

    // Add stale-while-revalidate window
    if (options?.staleWhileRevalidateSec) {
      entry.staleAt = now + ttlSec * 1000
      entry.expiresAt = now + (ttlSec + options.staleWhileRevalidateSec) * 1000
    }

    this.store.set(key, entry)
    this.stats.size = this.store.size

    // Cleanup if too large
    if (this.store.size > MAX_ENTRIES) {
      this.cleanup()
    }
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    const result = this.store.delete(key)
    this.stats.size = this.store.size
    return result
  }

  /**
   * Delete all keys matching a pattern
   */
  deletePattern(pattern: string): number {
    let deleted = 0
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key)
        deleted++
      }
    }

    this.stats.size = this.store.size
    return deleted
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.store.clear()
    this.stats = { hits: 0, misses: 0, staleHits: 0, size: 0 }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.store.get(key)
    if (!entry) return false
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key)
      this.stats.size = this.store.size
      return false
    }
    return true
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.store) {
      if (entry.expiresAt < now) {
        this.store.delete(key)
        cleaned++
      }
    }

    this.stats.size = this.store.size

    if (cleaned > 0) {
      logger.debug('Cache cleanup completed', { cleaned, remaining: this.store.size })
    }
  }

  /**
   * Start periodic cleanup
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS)
    // Don't keep process alive just for cache cleanup
    this.cleanupInterval.unref?.()
  }

  /**
   * Stop periodic cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

// =============================================================================
// Cache Key Generators
// =============================================================================

/**
 * Cache key patterns for different data types
 */
export const CACHE_KEYS = {
  /** Dashboard stats for an organization */
  dashboardStats: (orgId: string) => `dashboard:stats:${orgId}`,

  /** Dashboard quick summary */
  dashboardSummary: (orgId: string) => `dashboard:summary:${orgId}`,

  /** Regulation list with filters hash */
  regulationsList: (orgId: string, filterHash: string) => `regulations:list:${orgId}:${filterHash}`,

  /** Single regulation */
  regulation: (orgId: string, regId: string) => `regulations:detail:${orgId}:${regId}`,

  /** Systems list */
  systemsList: (orgId: string) => `systems:list:${orgId}`,

  /** System impact overview */
  systemImpactOverview: (orgId: string) => `systems:impact:${orgId}`,

  /** Alert counts */
  alertCounts: (orgId: string) => `alerts:counts:${orgId}`,

  /** Compliance by regulation */
  complianceByRegulation: (orgId: string) => `compliance:by-regulation:${orgId}`,

  /** User's organizations */
  userOrgs: (userId: string) => `user:orgs:${userId}`,

  /** Organization members */
  orgMembers: (orgId: string) => `org:members:${orgId}`,

  /** Available jurisdictions */
  jurisdictions: (orgId: string) => `meta:jurisdictions:${orgId}`,

  /** Available frameworks */
  frameworks: (orgId: string) => `meta:frameworks:${orgId}`,
} as const

/**
 * Create a hash of filter/query parameters for cache keying
 */
export function hashParams(params: Record<string, unknown>): string {
  // Simple but fast hash for cache keys
  const str = JSON.stringify(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .sort(([a], [b]) => a.localeCompare(b))
  )

  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

// =============================================================================
// Cache Instance
// =============================================================================

/** In-memory cache instance (used as fallback or in dev) */
const memoryCache = new MemoryCache()

/**
 * Cache interface that works with both memory and Redis adapters
 */
interface SyncCache {
  get<T>(key: string): { value: T; isStale: boolean } | null
  set<T>(key: string, value: T, options?: CacheOptions): void
  delete(key: string): boolean
  deletePattern(pattern: string): number
  clear(): void
  getStats(): CacheStats
  has(key: string): boolean
}

/** Singleton cache instance - memory in dev, Redis in prod if available */
export const cache: SyncCache = memoryCache

/** Redis adapter for production (initialized lazily) */
let redisAdapter: CacheAdapter | null = null
let redisInitialized = false

/**
 * Get Redis adapter if available (for async operations)
 * Falls back to memory cache if Redis not configured
 */
async function getRedisAdapter(): Promise<CacheAdapter | null> {
  if (!redisInitialized) {
    redisInitialized = true
    redisAdapter = await createRedisCacheAdapter()
  }
  return redisAdapter
}

// =============================================================================
// Cache Helpers
// =============================================================================

/**
 * Get or set pattern - fetch from cache or compute and cache
 * Uses Redis in production if REDIS_URL is configured, otherwise memory cache
 */
export async function cached<T>(key: string, fetchFn: () => Promise<T>, options?: CacheOptions): Promise<T> {
  // Try Redis first in production
  const redis = await getRedisAdapter()

  if (redis) {
    const existing = await redis.get<T>(key)

    if (existing && !existing.isStale) {
      return existing.value
    }

    if (existing?.isStale) {
      fetchFn()
        .then((value) => redis.set(key, value, options))
        .catch((error) => logger.warn('Background cache refresh failed', { key, error }))
      return existing.value
    }

    const value = await fetchFn()
    await redis.set(key, value, options)
    return value
  }

  // Fallback to memory cache
  const existing = cache.get<T>(key)

  // Return cached value if fresh
  if (existing && !existing.isStale) {
    return existing.value
  }

  // If stale, return stale and refresh in background
  if (existing?.isStale) {
    // Fire and forget background refresh
    fetchFn()
      .then((value) => cache.set(key, value, options))
      .catch((error) => logger.warn('Background cache refresh failed', { key, error }))

    return existing.value
  }

  // No cached value - fetch and cache
  const value = await fetchFn()
  cache.set(key, value, options)
  return value
}

/**
 * Invalidate cache for an organization (use after mutations)
 */
export function invalidateOrgCache(orgId: string): void {
  cache.deletePattern(`*:${orgId}`)
  cache.deletePattern(`*:${orgId}:*`)
}

/**
 * Invalidate specific cache patterns
 */
export const invalidate = {
  dashboard: (orgId: string) => {
    cache.delete(CACHE_KEYS.dashboardStats(orgId))
    cache.delete(CACHE_KEYS.dashboardSummary(orgId))
    cache.delete(CACHE_KEYS.complianceByRegulation(orgId))
  },

  alerts: (orgId: string) => {
    cache.delete(CACHE_KEYS.alertCounts(orgId))
    cache.delete(CACHE_KEYS.dashboardStats(orgId))
  },

  regulations: (orgId: string) => {
    cache.deletePattern(`regulations:*:${orgId}*`)
    cache.delete(CACHE_KEYS.complianceByRegulation(orgId))
    cache.delete(CACHE_KEYS.dashboardStats(orgId))
  },

  systems: (orgId: string) => {
    cache.delete(CACHE_KEYS.systemsList(orgId))
    cache.delete(CACHE_KEYS.systemImpactOverview(orgId))
    cache.delete(CACHE_KEYS.dashboardStats(orgId))
  },

  organization: (orgId: string) => {
    invalidateOrgCache(orgId)
  },
}

// =============================================================================
// TTL Presets
// =============================================================================

/** Common TTL configurations */
export const TTL = {
  /** Dashboard stats - short TTL, frequently changing */
  dashboard: { ttlSec: 30, staleWhileRevalidateSec: 30 },

  /** Lists - medium TTL */
  list: { ttlSec: 60, staleWhileRevalidateSec: 60 },

  /** Single entity - longer TTL */
  entity: { ttlSec: 300, staleWhileRevalidateSec: 120 },

  /** Metadata (jurisdictions, frameworks) - long TTL */
  metadata: { ttlSec: 3600 },

  /** User data - medium TTL */
  user: { ttlSec: 300, staleWhileRevalidateSec: 60 },
} as const

// =============================================================================
// Redis Adapter Interface (for production)
// =============================================================================

/**
 * Cache adapter interface for swapping implementations
 */
export interface CacheAdapter {
  get<T>(key: string): Promise<{ value: T; isStale: boolean } | null>
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>
  delete(key: string): Promise<boolean>
  deletePattern(pattern: string): Promise<number>
  clear(): Promise<void>
}

/**
 * Redis cache adapter for production use.
 * Set REDIS_URL environment variable to enable.
 * Requires: npm install ioredis @types/ioredis
 */
export async function createRedisCacheAdapter(): Promise<CacheAdapter | null> {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return null

  try {
    // Dynamic import - ioredis is optional
    // @ts-expect-error - ioredis is an optional dependency
    const Redis = await import('ioredis').then((m) => m.default)
    const client = new Redis(redisUrl)

    return {
      async get<T>(key: string) {
        const raw = await client.get(key)
        if (!raw) return null
        const entry = JSON.parse(raw) as CacheEntry<T>
        const now = Date.now()
        if (entry.expiresAt < now) {
          await client.del(key)
          return null
        }
        const isStale = entry.staleAt !== undefined && entry.staleAt < now
        return { value: entry.value, isStale }
      },

      async set<T>(key: string, value: T, options?: CacheOptions) {
        const ttlSec = options?.ttlSec ?? DEFAULT_TTL_SEC
        const now = Date.now()
        const entry: CacheEntry<T> = {
          value,
          expiresAt: now + ttlSec * 1000,
        }
        if (options?.staleWhileRevalidateSec) {
          entry.staleAt = now + ttlSec * 1000
          entry.expiresAt = now + (ttlSec + options.staleWhileRevalidateSec) * 1000
        }
        const totalTtl = options?.staleWhileRevalidateSec ? ttlSec + options.staleWhileRevalidateSec : ttlSec
        await client.setex(key, totalTtl, JSON.stringify(entry))
      },

      async delete(key: string) {
        const result = await client.del(key)
        return result > 0
      },

      async deletePattern(pattern: string) {
        const keys = await client.keys(pattern.replace(/\*/g, '*'))
        if (keys.length === 0) return 0
        return await client.del(...keys)
      },

      async clear() {
        await client.flushdb()
      },
    }
  } catch {
    logger.warn('Redis not available, using in-memory cache')
    return null
  }
}
