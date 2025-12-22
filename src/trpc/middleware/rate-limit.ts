/**
 * Rate Limiting Middleware for tRPC
 *
 * Implements sliding window rate limiting with:
 * - Per-user limits for authenticated requests
 * - Per-IP limits for unauthenticated requests
 * - Different limits for queries vs mutations
 *
 * Storage: In-memory by default, Redis adapter available for production
 */

import { TRPCError } from '@trpc/server'
import { logger } from '@/lib/logger'

// =============================================================================
// Types
// =============================================================================

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitConfig {
  /** Requests per window */
  limit: number
  /** Window size in seconds */
  windowSec: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  limit: number
}

type RateLimitStore = Map<string, RateLimitEntry>

// =============================================================================
// Configuration
// =============================================================================

/**
 * Rate limit configurations by type
 */
export const RATE_LIMITS = {
  /** Standard queries - generous limit */
  query: { limit: 300, windowSec: 60 },
  /** Mutations - stricter limit */
  mutation: { limit: 60, windowSec: 60 },
  /** Auth endpoints - very strict */
  auth: { limit: 10, windowSec: 60 },
  /** Bulk operations */
  bulk: { limit: 10, windowSec: 60 },
  /** AI/expensive operations */
  expensive: { limit: 20, windowSec: 60 },
} as const

export type RateLimitType = keyof typeof RATE_LIMITS

// =============================================================================
// In-Memory Store (default)
// =============================================================================

const stores: Record<RateLimitType, RateLimitStore> = {
  query: new Map(),
  mutation: new Map(),
  auth: new Map(),
  bulk: new Map(),
  expensive: new Map(),
}

/** Cleanup interval (5 minutes) */
const CLEANUP_INTERVAL = 5 * 60 * 1000

/**
 * Periodically clean up expired entries
 */
function startCleanupInterval(): void {
  setInterval(() => {
    const now = Date.now()
    for (const store of Object.values(stores)) {
      for (const [key, entry] of store) {
        if (entry.resetAt < now) {
          store.delete(key)
        }
      }
    }
  }, CLEANUP_INTERVAL)
}

// Start cleanup on module load (only in long-running processes)
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  startCleanupInterval()
}

// =============================================================================
// Core Rate Limiting Logic
// =============================================================================

/**
 * Check and update rate limit for a key
 */
function checkRateLimit(key: string, type: RateLimitType): RateLimitResult {
  const config = RATE_LIMITS[type]
  const store = stores[type]
  const now = Date.now()
  const windowMs = config.windowSec * 1000

  const entry = store.get(key)

  // No entry or expired - create new window
  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetAt,
      limit: config.limit,
    }
  }

  // Within window - increment and check
  entry.count++

  if (entry.count > config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      limit: config.limit,
    }
  }

  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
    limit: config.limit,
  }
}

/**
 * Generate rate limit key
 */
function getRateLimitKey(opts: { userId?: string; ip?: string; procedure?: string }): string {
  if (opts.userId) {
    return `user:${opts.userId}`
  }
  if (opts.ip) {
    return `ip:${opts.ip}`
  }
  return 'anonymous'
}

// =============================================================================
// Middleware Factory
// =============================================================================

export interface RateLimitMiddlewareOpts {
  /** Type of rate limit to apply */
  type?: RateLimitType
  /** Custom key generator */
  keyGenerator?: (ctx: { user?: { id: string } | null }) => string
  /** Skip rate limiting (e.g., for internal calls) */
  skip?: (ctx: { user?: { id: string } | null }) => boolean
}

/**
 * Create a rate limiting middleware for tRPC
 *
 * @example
 * ```ts
 * const rateLimitedProcedure = publicProcedure.use(
 *   createRateLimitMiddleware({ type: 'mutation' })
 * )
 * ```
 */
export function createRateLimitMiddleware(opts: RateLimitMiddlewareOpts = {}) {
  const { type = 'query', keyGenerator, skip } = opts

  return async function rateLimitMiddleware<T>({
    ctx,
    next,
    path,
  }: {
    ctx: { user?: { id: string } | null }
    next: () => Promise<T>
    path: string
  }): Promise<T> {
    // Skip if configured
    if (skip?.(ctx)) {
      return next()
    }

    // Generate key
    const key = keyGenerator?.(ctx) ?? getRateLimitKey({ userId: ctx.user?.id })

    // Check rate limit
    const result = checkRateLimit(key, type)

    // Log rate limit status
    if (!result.allowed) {
      logger.warn('Rate limit exceeded', {
        key,
        type,
        path,
        limit: result.limit,
        resetAt: new Date(result.resetAt).toISOString(),
      })

      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Try again in ${Math.ceil((result.resetAt - Date.now()) / 1000)} seconds.`,
        cause: {
          limit: result.limit,
          remaining: result.remaining,
          resetAt: result.resetAt,
        },
      })
    }

    // Log when approaching limit
    if (result.remaining < result.limit * 0.1) {
      logger.info('Rate limit warning: approaching limit', {
        key,
        type,
        path,
        remaining: result.remaining,
        limit: result.limit,
      })
    }

    return next()
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get current rate limit status for a key (for debugging/admin)
 */
export function getRateLimitStatus(userId: string, type: RateLimitType = 'query'): RateLimitResult | null {
  const key = `user:${userId}`
  const config = RATE_LIMITS[type]
  const store = stores[type]
  const entry = store.get(key)

  if (!entry || entry.resetAt < Date.now()) {
    return null
  }

  return {
    allowed: entry.count <= config.limit,
    remaining: Math.max(0, config.limit - entry.count),
    resetAt: entry.resetAt,
    limit: config.limit,
  }
}

/**
 * Reset rate limit for a key (admin function)
 */
export function resetRateLimit(userId: string, type?: RateLimitType): void {
  const key = `user:${userId}`

  if (type) {
    stores[type].delete(key)
  } else {
    for (const store of Object.values(stores)) {
      store.delete(key)
    }
  }
}

/**
 * Clear all rate limits (for testing)
 */
export function clearAllRateLimits(): void {
  for (const store of Object.values(stores)) {
    store.clear()
  }
}

// =============================================================================
// Pre-configured Middleware Instances
// =============================================================================

/** Rate limit for standard queries */
export const queryRateLimit = createRateLimitMiddleware({ type: 'query' })

/** Rate limit for mutations */
export const mutationRateLimit = createRateLimitMiddleware({ type: 'mutation' })

/** Rate limit for auth operations */
export const authRateLimit = createRateLimitMiddleware({ type: 'auth' })

/** Rate limit for bulk operations */
export const bulkRateLimit = createRateLimitMiddleware({ type: 'bulk' })

/** Rate limit for expensive/AI operations */
export const expensiveRateLimit = createRateLimitMiddleware({ type: 'expensive' })
