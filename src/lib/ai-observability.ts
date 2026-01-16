/**
 * AI Observability & Metrics
 *
 * Tracks token usage, costs, latency, and quality metrics for all AI operations.
 */

import { logger } from './logger'

// =============================================================================
// Types
// =============================================================================

export interface AIMetrics {
  operation: string
  promptVersion: string
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  latencyMs: number
  cached: boolean
  success: boolean
  confidenceScore?: number
  organizationId?: string
  timestamp: Date
}

export interface AICallOptions {
  operation: string
  promptVersion?: string
  organizationId?: string
  metadata?: Record<string, unknown>
}

export interface AggregatedMetrics {
  totalCalls: number
  totalTokens: number
  estimatedCostUsd: number
  avgLatencyMs: number
  p50LatencyMs: number
  p95LatencyMs: number
  p99LatencyMs: number
  cacheHitRate: number
  successRate: number
  avgConfidence: number
  byOperation: Record<string, OperationMetrics>
  byModel: Record<string, ModelMetrics>
}

interface OperationMetrics {
  calls: number
  tokens: number
  avgLatencyMs: number
  successRate: number
}

interface ModelMetrics {
  calls: number
  tokens: number
  estimatedCostUsd: number
}

// =============================================================================
// Configuration
// =============================================================================

// Pricing per 1M tokens (as of 2026)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
  'gpt-4o': { input: 5.0, output: 15.0 },
}

// Metrics retention (keep last N entries per operation)
const MAX_METRICS_PER_OPERATION = 1000

// =============================================================================
// Metrics Store
// =============================================================================

class AIMetricsStore {
  private metrics: AIMetrics[] = []
  private latencies: number[] = []

  record(metric: AIMetrics): void {
    this.metrics.push(metric)
    if (metric.success) {
      this.latencies.push(metric.latencyMs)
    }

    // Evict old entries
    if (this.metrics.length > MAX_METRICS_PER_OPERATION * 10) {
      this.metrics = this.metrics.slice(-MAX_METRICS_PER_OPERATION * 5)
    }
    if (this.latencies.length > 10000) {
      this.latencies = this.latencies.slice(-5000)
    }

    // Log for external observability (Datadog, etc.)
    logger.info('ai_metric', {
      operation: metric.operation,
      model: metric.model,
      tokens: metric.totalTokens,
      latencyMs: metric.latencyMs,
      cached: metric.cached,
      success: metric.success,
      confidence: metric.confidenceScore,
      promptVersion: metric.promptVersion,
    })
  }

  getAggregated(since?: Date): AggregatedMetrics {
    const cutoff = since ?? new Date(Date.now() - 24 * 60 * 60 * 1000) // Default: last 24h
    const relevant = this.metrics.filter((m) => m.timestamp >= cutoff)

    if (relevant.length === 0) {
      return this.emptyMetrics()
    }

    const totalTokens = relevant.reduce((sum, m) => sum + m.totalTokens, 0)
    const successCount = relevant.filter((m) => m.success).length
    const cachedCount = relevant.filter((m) => m.cached).length
    const withConfidence = relevant.filter((m) => m.confidenceScore !== undefined)

    // Calculate latency percentiles
    const sortedLatencies = this.latencies.slice().sort((a, b) => a - b)
    const p50 = this.percentile(sortedLatencies, 50)
    const p95 = this.percentile(sortedLatencies, 95)
    const p99 = this.percentile(sortedLatencies, 99)

    // Aggregate by operation
    const byOperation: Record<string, OperationMetrics> = {}
    for (const m of relevant) {
      if (!byOperation[m.operation]) {
        byOperation[m.operation] = { calls: 0, tokens: 0, avgLatencyMs: 0, successRate: 0 }
      }
      const op = byOperation[m.operation]
      op.calls++
      op.tokens += m.totalTokens
      op.avgLatencyMs += m.latencyMs
    }
    for (const op of Object.values(byOperation)) {
      op.avgLatencyMs = Math.round(op.avgLatencyMs / op.calls)
      const opMetrics = relevant.filter((m) => byOperation[m.operation] === op)
      op.successRate = Math.round((opMetrics.filter((m) => m.success).length / opMetrics.length) * 100)
    }

    // Aggregate by model
    const byModel: Record<string, ModelMetrics> = {}
    for (const m of relevant) {
      if (!byModel[m.model]) {
        byModel[m.model] = { calls: 0, tokens: 0, estimatedCostUsd: 0 }
      }
      const model = byModel[m.model]
      model.calls++
      model.tokens += m.totalTokens
      model.estimatedCostUsd += this.estimateCost(m.model, m.inputTokens, m.outputTokens)
    }

    const totalCost = Object.values(byModel).reduce((sum, m) => sum + m.estimatedCostUsd, 0)

    return {
      totalCalls: relevant.length,
      totalTokens,
      estimatedCostUsd: Math.round(totalCost * 100) / 100,
      avgLatencyMs: Math.round(relevant.reduce((sum, m) => sum + m.latencyMs, 0) / relevant.length),
      p50LatencyMs: p50,
      p95LatencyMs: p95,
      p99LatencyMs: p99,
      cacheHitRate: Math.round((cachedCount / relevant.length) * 100),
      successRate: Math.round((successCount / relevant.length) * 100),
      avgConfidence:
        withConfidence.length > 0
          ? Math.round(
              (withConfidence.reduce((sum, m) => sum + (m.confidenceScore ?? 0), 0) / withConfidence.length) * 100
            ) / 100
          : 0,
      byOperation,
      byModel,
    }
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0
    const idx = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[Math.max(0, idx)] ?? 0
  }

  private estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = MODEL_PRICING[model] ?? MODEL_PRICING['claude-sonnet-4-20250514']
    return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000
  }

  private emptyMetrics(): AggregatedMetrics {
    return {
      totalCalls: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
      avgLatencyMs: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
      cacheHitRate: 0,
      successRate: 0,
      avgConfidence: 0,
      byOperation: {},
      byModel: {},
    }
  }

  clear(): void {
    this.metrics = []
    this.latencies = []
  }
}

// Singleton instance
export const aiMetrics = new AIMetricsStore()

// =============================================================================
// Instrumentation Helpers
// =============================================================================

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
  aiMetrics.record({
    operation: options.operation,
    promptVersion: options.promptVersion ?? '1.0.0',
    model: result.model,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    totalTokens: result.inputTokens + result.outputTokens,
    latencyMs: result.latencyMs,
    cached: result.cached,
    success: result.success,
    confidenceScore: result.confidenceScore,
    organizationId: options.organizationId,
    timestamp: new Date(),
  })
}

export function getAIMetrics(since?: Date): AggregatedMetrics {
  return aiMetrics.getAggregated(since)
}

// =============================================================================
// Prompt Versioning
// =============================================================================

export interface PromptVersion {
  version: string
  prompt: string
  createdAt: Date
  isActive: boolean
  abTestWeight?: number
}

const promptVersions = new Map<string, PromptVersion[]>()

export function registerPrompt(operation: string, version: string, prompt: string, abTestWeight?: number): void {
  const versions = promptVersions.get(operation) ?? []
  versions.push({
    version,
    prompt,
    createdAt: new Date(),
    isActive: true,
    abTestWeight,
  })
  promptVersions.set(operation, versions)
}

export function getPrompt(operation: string): { version: string; prompt: string } | null {
  const versions = promptVersions.get(operation)?.filter((v) => v.isActive)
  if (!versions || versions.length === 0) return null

  // A/B testing: weighted random selection
  const withWeights = versions.filter((v) => v.abTestWeight !== undefined)
  if (withWeights.length > 0) {
    const totalWeight = withWeights.reduce((sum, v) => sum + (v.abTestWeight ?? 0), 0)
    let random = Math.random() * totalWeight
    for (const v of withWeights) {
      random -= v.abTestWeight ?? 0
      if (random <= 0) {
        return { version: v.version, prompt: v.prompt }
      }
    }
  }

  // Default: use latest version
  const latest = versions[versions.length - 1]
  return latest ? { version: latest.version, prompt: latest.prompt } : null
}
// =============================================================================
// Feedback Loops - Capture user feedback on AI outputs
// =============================================================================

export interface AIFeedback {
  id: string
  operation: string
  promptVersion: string
  responseId: string
  rating: 'helpful' | 'not_helpful' | 'incorrect' | 'hallucination'
  correction?: string
  userId?: string
  organizationId?: string
  timestamp: Date
}

// In-memory feedback store (production: persist to database)
const feedbackStore: AIFeedback[] = []

/**
 * Record user feedback on an AI response
 * This enables prompt improvement through human feedback
 */
export function recordFeedback(feedback: Omit<AIFeedback, 'id' | 'timestamp'>): string {
  const id = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  feedbackStore.push({
    ...feedback,
    id,
    timestamp: new Date(),
  })

  // Evict old feedback (keep last 10000)
  if (feedbackStore.length > 10000) {
    feedbackStore.splice(0, feedbackStore.length - 5000)
  }

  return id
}

/**
 * Get feedback summary for a prompt version
 * Use this to decide whether to promote/deprecate prompt versions
 */
export function getFeedbackSummary(
  operation: string,
  promptVersion?: string
): {
  total: number
  helpful: number
  notHelpful: number
  incorrect: number
  hallucination: number
  helpfulRate: number
  corrections: string[]
} {
  const relevant = feedbackStore.filter(
    (f) => f.operation === operation && (!promptVersion || f.promptVersion === promptVersion)
  )

  const helpful = relevant.filter((f) => f.rating === 'helpful').length
  const notHelpful = relevant.filter((f) => f.rating === 'not_helpful').length
  const incorrect = relevant.filter((f) => f.rating === 'incorrect').length
  const hallucination = relevant.filter((f) => f.rating === 'hallucination').length
  const corrections = relevant.filter((f) => f.correction).map((f) => f.correction!)

  return {
    total: relevant.length,
    helpful,
    notHelpful,
    incorrect,
    hallucination,
    helpfulRate: relevant.length > 0 ? helpful / relevant.length : 0,
    corrections: corrections.slice(-20), // Last 20 corrections
  }
}

/**
 * Compare feedback between two prompt versions
 * Use this to evaluate A/B test results
 */
export function comparePromptVersions(
  operation: string,
  versionA: string,
  versionB: string
): {
  versionA: { version: string; helpfulRate: number; total: number }
  versionB: { version: string; helpfulRate: number; total: number }
  winner: string | null
  confidence: 'low' | 'medium' | 'high'
} {
  const summaryA = getFeedbackSummary(operation, versionA)
  const summaryB = getFeedbackSummary(operation, versionB)

  // Determine winner (need minimum samples for confidence)
  const minSamples = 30
  let winner: string | null = null
  let confidence: 'low' | 'medium' | 'high' = 'low'

  if (summaryA.total >= minSamples && summaryB.total >= minSamples) {
    const diff = Math.abs(summaryA.helpfulRate - summaryB.helpfulRate)
    if (diff > 0.1) {
      winner = summaryA.helpfulRate > summaryB.helpfulRate ? versionA : versionB
      confidence = diff > 0.2 ? 'high' : 'medium'
    }
  }

  return {
    versionA: { version: versionA, helpfulRate: summaryA.helpfulRate, total: summaryA.total },
    versionB: { version: versionB, helpfulRate: summaryB.helpfulRate, total: summaryB.total },
    winner,
    confidence,
  }
}
