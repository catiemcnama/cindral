/**
 * Timing & Tracing Middleware for tRPC
 *
 * Provides:
 * - Request ID generation and propagation
 * - Request duration measurement
 * - Structured logging of all requests
 * - Performance tracking
 */

import { logger } from '@/lib/logger'

// =============================================================================
// Types
// =============================================================================

export interface RequestContext {
  /** Unique request ID */
  requestId: string
  /** Request start time (high resolution) */
  startTime: number
  /** Request start timestamp */
  startedAt: Date
  /** Path of the procedure being called */
  path?: string
}

export interface TimingResult {
  /** Duration in milliseconds */
  durationMs: number
  /** Whether the request was successful */
  success: boolean
  /** Error message if failed */
  error?: string
}

// =============================================================================
// Request ID Generation
// =============================================================================

/**
 * Generate a unique request ID
 * Format: timestamp-random (e.g., "1703260800000-a1b2c3d4")
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `${timestamp}-${random}`
}

// =============================================================================
// Performance Thresholds
// =============================================================================

/** Slow query threshold in ms */
const SLOW_QUERY_THRESHOLD = 1000

/** Very slow query threshold in ms */
const VERY_SLOW_QUERY_THRESHOLD = 5000

// =============================================================================
// Middleware Factory
// =============================================================================

export interface TimingMiddlewareOpts {
  /** Custom request ID generator */
  idGenerator?: () => string
  /** Slow query threshold in ms */
  slowThreshold?: number
  /** Skip logging for certain paths */
  skipLogging?: (path: string) => boolean
}

/**
 * Create a timing middleware for tRPC
 *
 * @example
 * ```ts
 * const timedProcedure = publicProcedure.use(createTimingMiddleware())
 * ```
 */
export function createTimingMiddleware(opts: TimingMiddlewareOpts = {}) {
  const { idGenerator = generateRequestId, slowThreshold = SLOW_QUERY_THRESHOLD, skipLogging } = opts

  return async function timingMiddleware<T>({
    ctx,
    next,
    path,
    type,
  }: {
    ctx: Record<string, unknown>
    next: () => Promise<T>
    path: string
    type: 'query' | 'mutation' | 'subscription'
  }): Promise<T> {
    const requestId = idGenerator()
    const startTime = performance.now()

    // Skip logging if configured
    const shouldLog = !skipLogging?.(path)

    if (shouldLog) {
      logger.debug('Request started', {
        requestId,
        path,
        type,
        userId: (ctx.user as { id?: string } | undefined)?.id,
      })
    }

    try {
      // Execute the procedure
      const result = await next()

      // Calculate duration
      const durationMs = Math.round(performance.now() - startTime)

      // Log completion
      if (shouldLog) {
        const logLevel = durationMs > VERY_SLOW_QUERY_THRESHOLD ? 'warn' : durationMs > slowThreshold ? 'info' : 'debug'

        const logFn = logLevel === 'warn' ? logger.warn : logLevel === 'info' ? logger.info : logger.debug

        logFn('Request completed', {
          requestId,
          path,
          type,
          durationMs,
          slow: durationMs > slowThreshold,
          userId: (ctx.user as { id?: string } | undefined)?.id,
        })
      }

      return result
    } catch (error) {
      const durationMs = Math.round(performance.now() - startTime)

      // Always log errors
      logger.error('Request failed', {
        requestId,
        path,
        type,
        durationMs,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: (ctx.user as { id?: string } | undefined)?.id,
      })

      throw error
    }
  }
}

// =============================================================================
// Context Helpers
// =============================================================================

/**
 * Get request ID from context (if timing middleware was used)
 */
export function getRequestId(ctx: Record<string, unknown>): string | undefined {
  return (ctx.requestContext as RequestContext | undefined)?.requestId
}

/**
 * Get request duration so far
 */
export function getRequestDuration(ctx: Record<string, unknown>): number | undefined {
  const requestContext = ctx.requestContext as RequestContext | undefined
  if (!requestContext?.startTime) return undefined
  return Math.round(performance.now() - requestContext.startTime)
}

// =============================================================================
// Pre-configured Middleware Instance
// =============================================================================

/** Default timing middleware */
export const timingMiddleware = createTimingMiddleware()

/** Timing middleware that skips health checks */
export const timingMiddlewareSkipHealth = createTimingMiddleware({
  skipLogging: (path) => path.includes('health'),
})

// =============================================================================
// Performance Utilities
// =============================================================================

/**
 * Wrap an async operation with timing
 */
export async function withTiming<T>(
  name: string,
  fn: () => Promise<T>,
  opts?: { requestId?: string; threshold?: number }
): Promise<{ result: T; durationMs: number }> {
  const start = performance.now()

  try {
    const result = await fn()
    const durationMs = Math.round(performance.now() - start)

    const threshold = opts?.threshold ?? SLOW_QUERY_THRESHOLD
    if (durationMs > threshold) {
      logger.warn(`Slow operation: ${name}`, {
        durationMs,
        requestId: opts?.requestId,
      })
    }

    return { result, durationMs }
  } catch (error) {
    const durationMs = Math.round(performance.now() - start)
    logger.error(`Operation failed: ${name}`, {
      durationMs,
      error: error instanceof Error ? error.message : String(error),
      requestId: opts?.requestId,
    })
    throw error
  }
}

/**
 * Create a stopwatch for measuring multiple operations
 */
export function createStopwatch(name: string, requestId?: string) {
  const start = performance.now()
  const laps: { name: string; durationMs: number }[] = []

  return {
    lap(lapName: string): number {
      const durationMs = Math.round(performance.now() - start)
      laps.push({ name: lapName, durationMs })
      return durationMs
    },

    stop(): { totalMs: number; laps: typeof laps } {
      const totalMs = Math.round(performance.now() - start)

      logger.debug(`Stopwatch: ${name}`, {
        totalMs,
        laps,
        requestId,
      })

      return { totalMs, laps }
    },
  }
}
