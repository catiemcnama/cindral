/**
 * AI Observability - Minimal logging for AI calls
 *
 * Just logs to structured logger for external observability (Datadog, etc.)
 * No in-memory metrics - those don't work in serverless.
 */

import { logger } from './logger'

export interface AICallOptions {
  operation: string
  promptVersion?: string
  organizationId?: string
}

/**
 * Record an AI call for observability
 * Logs to structured logger - aggregate in your observability platform
 */
export function recordAICall(
  options: AICallOptions,
  result: {
    model: string
    inputTokens: number
    outputTokens: number
    latencyMs: number
    cached: boolean
    success: boolean
    confidenceScore?: number
  }
): void {
  logger.info('ai_call', {
    operation: options.operation,
    promptVersion: options.promptVersion ?? '1.0.0',
    organizationId: options.organizationId,
    model: result.model,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    totalTokens: result.inputTokens + result.outputTokens,
    latencyMs: result.latencyMs,
    cached: result.cached,
    success: result.success,
    confidence: result.confidenceScore,
  })
}
