/**
 * Custom Error Classes and tRPC Error Formatting
 *
 * Provides:
 * - Typed error classes with error codes
 * - Consistent error structure across the API
 * - Production-safe error formatting (no stack traces)
 * - Sentry-ready error context
 */

import { TRPCError } from '@trpc/server'
import type { TRPC_ERROR_CODE_KEY } from '@trpc/server/unstable-core-do-not-import'
import { logger } from './logger'

// =============================================================================
// Error Codes
// =============================================================================

/**
 * Application-specific error codes
 * These map to HTTP-like semantics but are more specific
 */
export const ERROR_CODES = {
  // Client errors (4xx)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',

  // Business logic errors
  ORGANIZATION_REQUIRED: 'ORGANIZATION_REQUIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  RESOURCE_LOCKED: 'RESOURCE_LOCKED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  TIMEOUT: 'TIMEOUT',

  // Feature-specific
  INGEST_FAILED: 'INGEST_FAILED',
  EVIDENCE_GENERATION_FAILED: 'EVIDENCE_GENERATION_FAILED',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

// =============================================================================
// Base Error Class
// =============================================================================

export interface CindralErrorContext {
  [key: string]: unknown
}

/**
 * Base error class for all Cindral errors
 */
export class CindralError extends Error {
  readonly code: ErrorCode
  readonly httpStatus: number
  readonly context?: CindralErrorContext
  readonly timestamp: string
  readonly isOperational: boolean

  constructor(
    message: string,
    opts: {
      code: ErrorCode
      httpStatus?: number
      context?: CindralErrorContext
      cause?: Error
    }
  ) {
    super(message, { cause: opts.cause })
    this.name = 'CindralError'
    this.code = opts.code
    this.httpStatus = opts.httpStatus ?? 500
    this.context = opts.context
    this.timestamp = new Date().toISOString()
    this.isOperational = true // Distinguishes from programming errors

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Convert to tRPC error
   */
  toTRPCError(): TRPCError {
    return new TRPCError({
      code: this.getTRPCCode(),
      message: this.message,
      cause: this,
    })
  }

  /**
   * Map internal code to tRPC code
   */
  private getTRPCCode(): TRPC_ERROR_CODE_KEY {
    switch (this.code) {
      case ERROR_CODES.VALIDATION_ERROR:
        return 'BAD_REQUEST'
      case ERROR_CODES.NOT_FOUND:
        return 'NOT_FOUND'
      case ERROR_CODES.ALREADY_EXISTS:
        return 'CONFLICT'
      case ERROR_CODES.UNAUTHORIZED:
        return 'UNAUTHORIZED'
      case ERROR_CODES.FORBIDDEN:
      case ERROR_CODES.ORGANIZATION_REQUIRED:
      case ERROR_CODES.INSUFFICIENT_PERMISSIONS:
        return 'FORBIDDEN'
      case ERROR_CODES.RATE_LIMITED:
      case ERROR_CODES.QUOTA_EXCEEDED:
        return 'TOO_MANY_REQUESTS'
      case ERROR_CODES.INVALID_STATE_TRANSITION:
      case ERROR_CODES.RESOURCE_LOCKED:
        return 'PRECONDITION_FAILED'
      case ERROR_CODES.TIMEOUT:
        return 'TIMEOUT'
      default:
        return 'INTERNAL_SERVER_ERROR'
    }
  }

  /**
   * Safe serialization (no stack in production)
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
      context: this.context,
      ...(process.env.NODE_ENV !== 'production' && { stack: this.stack }),
    }
  }
}

// =============================================================================
// Specific Error Classes
// =============================================================================

/**
 * Resource not found error
 */
export class NotFoundError extends CindralError {
  constructor(resource: string, identifier?: string | number, context?: CindralErrorContext) {
    super(identifier ? `${resource} with ID '${identifier}' not found` : `${resource} not found`, {
      code: ERROR_CODES.NOT_FOUND,
      httpStatus: 404,
      context: { resource, identifier, ...context },
    })
    this.name = 'NotFoundError'
  }
}

/**
 * Validation error
 */
export class ValidationError extends CindralError {
  readonly field?: string
  readonly issues?: Array<{ field: string; message: string }>

  constructor(
    message: string,
    opts?: {
      field?: string
      issues?: Array<{ field: string; message: string }>
      context?: CindralErrorContext
    }
  ) {
    super(message, {
      code: ERROR_CODES.VALIDATION_ERROR,
      httpStatus: 400,
      context: { field: opts?.field, issues: opts?.issues, ...opts?.context },
    })
    this.name = 'ValidationError'
    this.field = opts?.field
    this.issues = opts?.issues
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends CindralError {
  constructor(message: string = 'You do not have permission to perform this action', context?: CindralErrorContext) {
    super(message, {
      code: ERROR_CODES.FORBIDDEN,
      httpStatus: 403,
      context,
    })
    this.name = 'AuthorizationError'
  }
}

/**
 * Organization required error
 */
export class OrganizationRequiredError extends CindralError {
  constructor() {
    super('An active organization is required to perform this action', {
      code: ERROR_CODES.ORGANIZATION_REQUIRED,
      httpStatus: 403,
    })
    this.name = 'OrganizationRequiredError'
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends CindralError {
  readonly retryAfter: number

  constructor(retryAfter: number, context?: CindralErrorContext) {
    super(`Rate limit exceeded. Try again in ${retryAfter} seconds.`, {
      code: ERROR_CODES.RATE_LIMITED,
      httpStatus: 429,
      context: { retryAfter, ...context },
    })
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }
}

/**
 * Database error
 */
export class DatabaseError extends CindralError {
  constructor(message: string = 'A database error occurred', cause?: Error, context?: CindralErrorContext) {
    super(message, {
      code: ERROR_CODES.DATABASE_ERROR,
      httpStatus: 500,
      cause,
      context,
    })
    this.name = 'DatabaseError'
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends CindralError {
  readonly service: string

  constructor(service: string, message?: string, cause?: Error, context?: CindralErrorContext) {
    super(message ?? `Error communicating with ${service}`, {
      code: ERROR_CODES.EXTERNAL_SERVICE_ERROR,
      httpStatus: 502,
      cause,
      context: { service, ...context },
    })
    this.name = 'ExternalServiceError'
    this.service = service
  }
}

/**
 * Invalid state transition error
 */
export class InvalidStateError extends CindralError {
  constructor(currentState: string, targetState: string, resource?: string, context?: CindralErrorContext) {
    super(`Cannot transition ${resource ?? 'resource'} from '${currentState}' to '${targetState}'`, {
      code: ERROR_CODES.INVALID_STATE_TRANSITION,
      httpStatus: 409,
      context: { currentState, targetState, resource, ...context },
    })
    this.name = 'InvalidStateError'
  }
}

/**
 * Already exists error
 */
export class AlreadyExistsError extends CindralError {
  constructor(resource: string, identifier?: string, context?: CindralErrorContext) {
    super(identifier ? `${resource} '${identifier}' already exists` : `${resource} already exists`, {
      code: ERROR_CODES.ALREADY_EXISTS,
      httpStatus: 409,
      context: { resource, identifier, ...context },
    })
    this.name = 'AlreadyExistsError'
  }
}

/**
 * AI service error
 */
export class AIServiceError extends CindralError {
  constructor(message: string = 'AI service error', cause?: Error, context?: CindralErrorContext) {
    super(message, {
      code: ERROR_CODES.AI_SERVICE_ERROR,
      httpStatus: 502,
      cause,
      context,
    })
    this.name = 'AIServiceError'
  }
}

/**
 * Configuration error (missing env vars, etc)
 */
export class ConfigurationError extends CindralError {
  constructor(message: string, context?: CindralErrorContext) {
    super(message, {
      code: ERROR_CODES.INTERNAL_ERROR,
      httpStatus: 500,
      context,
    })
    this.name = 'ConfigurationError'
  }
}

// =============================================================================
// Error Handling Utilities
// =============================================================================

/**
 * Wrap an operation and convert any error to CindralError
 */
export async function wrapError<T>(fn: () => Promise<T>, defaultMessage?: string): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (error instanceof CindralError) {
      throw error
    }
    if (error instanceof TRPCError) {
      throw error
    }

    logger.error('Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    throw new CindralError(defaultMessage ?? 'An unexpected error occurred', {
      code: ERROR_CODES.INTERNAL_ERROR,
      httpStatus: 500,
      cause: error instanceof Error ? error : undefined,
    })
  }
}

/**
 * Assert condition or throw NotFoundError
 */
export function assertFound<T>(value: T | null | undefined, resource: string, identifier?: string | number): T {
  if (value === null || value === undefined) {
    throw new NotFoundError(resource, identifier)
  }
  return value
}

/**
 * Assert condition or throw ValidationError
 */
export function assertValid(condition: boolean, message: string, field?: string): asserts condition {
  if (!condition) {
    throw new ValidationError(message, { field })
  }
}

// =============================================================================
// tRPC Error Formatter
// =============================================================================

/**
 * Format errors for tRPC responses
 * - In production: removes stack traces, sanitizes messages
 * - In development: includes full error details
 */
export function formatTRPCError(error: TRPCError): {
  code: string
  message: string
  data?: Record<string, unknown>
} {
  const isProduction = process.env.NODE_ENV === 'production'

  // Handle our custom errors
  if (error.cause instanceof CindralError) {
    const cause = error.cause

    return {
      code: cause.code,
      message: cause.message,
      data: isProduction
        ? { timestamp: cause.timestamp }
        : {
            timestamp: cause.timestamp,
            context: cause.context,
            stack: cause.stack,
          },
    }
  }

  // Handle generic tRPC errors
  return {
    code: error.code,
    message: isProduction && error.code === 'INTERNAL_SERVER_ERROR' ? 'An unexpected error occurred' : error.message,
    data: isProduction
      ? undefined
      : {
          stack: error.stack,
        },
  }
}

// =============================================================================
// Quick Throw Helpers
// =============================================================================

/** Throw NotFoundError */
export function notFound(resource: string, identifier?: string | number): never {
  throw new NotFoundError(resource, identifier)
}

/** Throw ValidationError */
export function invalid(message: string, field?: string): never {
  throw new ValidationError(message, { field })
}

/** Throw AuthorizationError */
export function forbidden(message?: string): never {
  throw new AuthorizationError(message)
}

/** Throw OrganizationRequiredError */
export function orgRequired(): never {
  throw new OrganizationRequiredError()
}
