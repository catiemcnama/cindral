/**
 * Client-Side Error Formatting
 *
 * Converts tRPC errors and other API errors into user-friendly messages
 */

import type { AppRouter } from '@/trpc/routers/_app'
import type { TRPCClientErrorLike } from '@trpc/client'

interface TRPCErrorShape {
  data?: {
    code?: string
    httpStatus?: number
  }
  code?: string
  message?: string
}

/**
 * Type-safe error code checking
 */
export function hasErrorCode(error: unknown, code: string): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as TRPCErrorShape
  return e.data?.code === code || e.code === code
}

/**
 * Check if error is an auth error (401)
 */
export function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as TRPCErrorShape
  return e.data?.httpStatus === 401 || e.code === 'UNAUTHORIZED' || hasErrorCode(error, 'UNAUTHORIZED')
}

/**
 * Check if error is a forbidden/org-required error (403)
 */
export function isForbiddenError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as TRPCErrorShape
  return (
    e.data?.httpStatus === 403 ||
    e.code === 'FORBIDDEN' ||
    hasErrorCode(error, 'FORBIDDEN') ||
    hasErrorCode(error, 'ORGANIZATION_REQUIRED')
  )
}

/**
 * Check if error is a not found error (404)
 */
export function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as TRPCErrorShape
  return e.data?.httpStatus === 404 || e.code === 'NOT_FOUND' || hasErrorCode(error, 'NOT_FOUND')
}

/**
 * User-friendly error messages for common error codes
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  UNAUTHORIZED: 'Please sign in to continue.',
  FORBIDDEN: "You don't have permission to perform this action.",
  ORGANIZATION_REQUIRED: 'Please select or create an organization first.',
  INSUFFICIENT_PERMISSIONS: "Your role doesn't allow this action. Contact your admin.",

  // Resource errors
  NOT_FOUND: 'The requested item could not be found.',
  ALREADY_EXISTS: 'This item already exists.',
  RESOURCE_LOCKED: 'This item is currently being edited by someone else.',

  // Input errors
  VALIDATION_ERROR: 'Please check your input and try again.',
  BAD_REQUEST: 'Invalid request. Please check your input.',
  INVALID_STATE_TRANSITION: 'This status change is not allowed.',

  // Rate limiting
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  QUOTA_EXCEEDED: "You've reached your plan limit. Consider upgrading.",
  TOO_MANY_REQUESTS: 'Please slow down and try again in a moment.',

  // Server errors
  INTERNAL_SERVER_ERROR: 'Something went wrong. Our team has been notified.',
  DATABASE_ERROR: 'A database error occurred. Please try again.',
  EXTERNAL_SERVICE_ERROR: 'An external service is unavailable. Please try again later.',
  TIMEOUT: 'The request took too long. Please try again.',

  // Feature errors
  INGEST_FAILED: 'Failed to import regulatory data. Please try again.',
  EVIDENCE_GENERATION_FAILED: 'Failed to generate evidence pack. Please try again.',
  AI_SERVICE_ERROR: 'AI analysis temporarily unavailable. Please try again later.',
}

/**
 * Extract error code from various error formats
 */
function extractErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null

  // tRPC error format
  const trpcError = error as { data?: { code?: string }; code?: string }
  if (trpcError.data?.code) return trpcError.data.code
  if (trpcError.code) return trpcError.code

  // Custom Cindral error format
  const cindralError = error as { code?: string }
  if (cindralError.code) return cindralError.code

  return null
}

/**
 * Extract original message from error
 */
function extractMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null

  const e = error as { message?: string }
  return e.message || null
}

/**
 * Format error for display to users
 *
 * @example
 * ```tsx
 * const { mutate } = useMutation({
 *   onError: (error) => {
 *     toast.error(formatErrorForUser(error))
 *   }
 * })
 * ```
 */
export function formatErrorForUser(error: unknown): string {
  // Handle null/undefined
  if (!error) return 'An unexpected error occurred.'

  // Get error code and message
  const code = extractErrorCode(error)
  const originalMessage = extractMessage(error)

  // If we have a mapped message for this code, use it
  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code]
  }

  // If the original message is user-friendly (not technical), use it
  if (originalMessage && !originalMessage.includes('Error:') && !originalMessage.includes('at ')) {
    // Check if it's already a decent message
    if (originalMessage.length < 200 && !originalMessage.includes('undefined')) {
      return originalMessage
    }
  }

  // Fallback
  return 'Something went wrong. Please try again.'
}

/**
 * Format tRPC error specifically
 */
export function formatTRPCError(error: TRPCClientErrorLike<AppRouter>): string {
  return formatErrorForUser(error)
}

/**
 * Get error title and description for toast/dialog
 *
 * @example
 * ```tsx
 * const { title, description } = getErrorDetails(error)
 * toast.error(title, { description })
 * ```
 */
export function getErrorDetails(error: unknown): { title: string; description: string | null } {
  const code = extractErrorCode(error)
  const message = formatErrorForUser(error)

  // Map codes to user-friendly titles
  const TITLES: Record<string, string> = {
    UNAUTHORIZED: 'Sign in required',
    FORBIDDEN: 'Access denied',
    NOT_FOUND: 'Not found',
    VALIDATION_ERROR: 'Invalid input',
    TOO_MANY_REQUESTS: 'Slow down',
    INTERNAL_SERVER_ERROR: 'Server error',
  }

  const title = code && TITLES[code] ? TITLES[code] : 'Error'

  return {
    title,
    description: message !== title ? message : null,
  }
}
