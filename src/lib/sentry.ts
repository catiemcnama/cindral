/**
 * Sentry Error Tracking & Performance Monitoring
 *
 * This module provides error tracking and performance monitoring.
 * Configure SENTRY_DSN in environment variables to enable.
 */

import { logger } from './logger'

// Check if Sentry is configured
const SENTRY_DSN = process.env.SENTRY_DSN
const IS_ENABLED = !!SENTRY_DSN && process.env.NODE_ENV === 'production'

// Sentry client (lazy loaded)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sentryClient: any = null

/**
 * Initialize Sentry (call once at app startup)
 */
export async function initSentry() {
  if (!IS_ENABLED) {
    logger.debug('Sentry disabled (no DSN configured or not in production)')
    return
  }

  try {
    // @ts-expect-error - Sentry is optional dependency
    sentryClient = await import('@sentry/nextjs')

    sentryClient.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV,
      release: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',

      // Performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Session replay (optional)
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      // Ignore certain errors
      ignoreErrors: [
        // Browser extensions
        'ResizeObserver loop',
        // Network errors
        'Failed to fetch',
        'NetworkError',
        'Load failed',
        // Auth errors (expected)
        'UNAUTHORIZED',
        'Session expired',
      ],

      // Before sending error, add extra context
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      beforeSend(event: any) {
        // Don't send events in development
        if (process.env.NODE_ENV !== 'production') {
          return null
        }

        // Redact sensitive data
        if (event.request?.headers) {
          delete event.request.headers['authorization']
          delete event.request.headers['cookie']
        }

        return event
      },
    })

    logger.info('Sentry initialized', { dsn: SENTRY_DSN?.substring(0, 20) + '...' })
  } catch (error) {
    logger.error('Failed to initialize Sentry', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Capture an error and send to Sentry
 */
export function captureError(error: Error, context?: Record<string, unknown>) {
  logger.error(error.message, { error: error.stack, ...context })

  if (sentryClient) {
    sentryClient.captureException(error, {
      extra: context,
    })
  }
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
) {
  logger[level === 'warning' ? 'warn' : level](message, context)

  if (sentryClient) {
    sentryClient.captureMessage(message, {
      level,
      extra: context,
    })
  }
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; name?: string } | null) {
  if (sentryClient) {
    sentryClient.setUser(user)
  }
}

/**
 * Set organization context
 */
export function setOrganization(org: { id: string; name: string } | null) {
  if (sentryClient) {
    sentryClient.setTag('organization.id', org?.id ?? null)
    sentryClient.setTag('organization.name', org?.name ?? null)
  }
}

/**
 * Add breadcrumb for error context
 */
export function addBreadcrumb(breadcrumb: {
  category: string
  message: string
  level?: 'info' | 'warning' | 'error'
  data?: Record<string, unknown>
}) {
  if (sentryClient) {
    sentryClient.addBreadcrumb({
      ...breadcrumb,
      timestamp: Date.now() / 1000,
    })
  }
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string) {
  if (sentryClient) {
    return sentryClient.startInactiveSpan({
      name,
      op,
    })
  }
  return null
}

/**
 * Wrap an async function with performance tracking
 */
export async function withPerformance<T>(name: string, op: string, fn: () => Promise<T>): Promise<T> {
  const span = startTransaction(name, op)

  try {
    const result = await fn()
    span?.end()
    return result
  } catch (error) {
    span?.end()
    throw error
  }
}

/**
 * Flush pending events (call before process exit)
 */
export async function flush(timeout = 2000): Promise<boolean> {
  if (sentryClient) {
    return sentryClient.flush(timeout)
  }
  return true
}
