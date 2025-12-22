/**
 * AI Service Abstraction
 *
 * Provides a unified interface for AI-powered features.
 * Currently implemented with Anthropic Claude.
 */

import { logger } from './logger'

// Types
export interface SummarizeOptions {
  maxLength?: number
  format?: 'paragraph' | 'bullets' | 'structured'
}

export interface ExtractedObligation {
  title: string
  summary: string
  requirementType: 'process' | 'technical' | 'reporting'
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

export interface ImpactAssessment {
  impactLevel: 'low' | 'medium' | 'high' | 'critical'
  reasoning: string
  affectedAreas: string[]
  recommendations: string[]
}

export interface AIResponse<T> {
  data: T
  cached: boolean
  generatedAt: string
  model: string
  tokensUsed?: number
}

// Cache for AI responses
const responseCache = new Map<string, { data: unknown; expiresAt: number }>()
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * Generate cache key from inputs
 */
function getCacheKey(operation: string, input: string): string {
  // Simple hash function for cache key
  let hash = 0
  const str = `${operation}:${input}`
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return `ai:${operation}:${hash.toString(36)}`
}

/**
 * Check cache for existing response
 */
function getFromCache<T>(key: string): T | null {
  const cached = responseCache.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T
  }
  responseCache.delete(key)
  return null
}

/**
 * Store response in cache
 */
function setCache<T>(key: string, data: T): void {
  responseCache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  })
}

/**
 * Get Anthropic client (lazy loaded)
 */
async function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  return new Anthropic({ apiKey })
}

/**
 * Call Claude with retry logic
 */
async function callClaude(params: {
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
}): Promise<{ content: string; tokensUsed: number }> {
  const client = await getAnthropicClient()

  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: params.maxTokens ?? 1024,
        system: params.systemPrompt,
        messages: [{ role: 'user', content: params.userPrompt }],
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type')
      }

      return {
        content: content.text,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Check if rate limited
      if (lastError.message.includes('rate_limit')) {
        const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
        logger.warn('AI rate limited, retrying', { attempt, delay })
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      throw lastError
    }
  }

  throw lastError ?? new Error('AI call failed after retries')
}

/**
 * Summarize regulatory text
 */
export async function summarize(text: string, options: SummarizeOptions = {}): Promise<AIResponse<string>> {
  const { maxLength = 200, format = 'paragraph' } = options
  const cacheKey = getCacheKey('summarize', `${text}:${maxLength}:${format}`)

  // Check cache
  const cached = getFromCache<string>(cacheKey)
  if (cached) {
    return {
      data: cached,
      cached: true,
      generatedAt: new Date().toISOString(),
      model: 'claude-sonnet-4-20250514',
    }
  }

  const formatInstruction =
    format === 'bullets'
      ? 'Use bullet points.'
      : format === 'structured'
        ? 'Use a structured format with headings.'
        : 'Write in paragraph form.'

  const systemPrompt = `You are a regulatory compliance expert. Summarize the following regulatory text concisely and accurately. ${formatInstruction} Maximum ${maxLength} words. Focus on key requirements and obligations.`

  const result = await callClaude({
    systemPrompt,
    userPrompt: text,
    maxTokens: Math.ceil(maxLength * 1.5),
  })

  // Cache result
  setCache(cacheKey, result.content)

  return {
    data: result.content,
    cached: false,
    generatedAt: new Date().toISOString(),
    model: 'claude-sonnet-4-20250514',
    tokensUsed: result.tokensUsed,
  }
}

/**
 * Extract obligations from article text
 */
export async function extractObligations(articleText: string): Promise<AIResponse<ExtractedObligation[]>> {
  const cacheKey = getCacheKey('extractObligations', articleText)

  const cached = getFromCache<ExtractedObligation[]>(cacheKey)
  if (cached) {
    return {
      data: cached,
      cached: true,
      generatedAt: new Date().toISOString(),
      model: 'claude-sonnet-4-20250514',
    }
  }

  const systemPrompt = `You are a regulatory compliance expert. Extract compliance obligations from the following regulatory article text.

For each obligation, provide:
- title: A short, clear title (max 100 characters)
- summary: A brief description of what must be done (max 200 characters)
- requirementType: One of "process", "technical", or "reporting"
- riskLevel: One of "low", "medium", "high", or "critical"

Respond with a JSON array of obligations. Only include actual compliance requirements, not definitions or background information.`

  const result = await callClaude({
    systemPrompt,
    userPrompt: articleText,
    maxTokens: 2048,
  })

  // Parse JSON response
  let obligations: ExtractedObligation[]
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = result.content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('No JSON array found in response')
    }
    obligations = JSON.parse(jsonMatch[0])
  } catch (error) {
    logger.error('Failed to parse obligations from AI response', {
      error: error instanceof Error ? error.message : 'Unknown error',
      response: result.content.substring(0, 500),
    })
    obligations = []
  }

  setCache(cacheKey, obligations)

  return {
    data: obligations,
    cached: false,
    generatedAt: new Date().toISOString(),
    model: 'claude-sonnet-4-20250514',
    tokensUsed: result.tokensUsed,
  }
}

/**
 * Assess impact of a regulation article on a system
 */
export async function assessImpact(
  articleText: string,
  systemDescription: string
): Promise<AIResponse<ImpactAssessment>> {
  const cacheKey = getCacheKey('assessImpact', `${articleText}:${systemDescription}`)

  const cached = getFromCache<ImpactAssessment>(cacheKey)
  if (cached) {
    return {
      data: cached,
      cached: true,
      generatedAt: new Date().toISOString(),
      model: 'claude-sonnet-4-20250514',
    }
  }

  const systemPrompt = `You are a regulatory compliance expert assessing how a regulation affects IT systems.

Analyze how the following regulatory article impacts the described system. Provide:
- impactLevel: "low", "medium", "high", or "critical"
- reasoning: Why this impact level was assigned (max 200 words)
- affectedAreas: List of specific areas/components affected
- recommendations: Actionable steps to achieve compliance

Respond with a JSON object.`

  const userPrompt = `REGULATORY ARTICLE:
${articleText}

SYSTEM DESCRIPTION:
${systemDescription}`

  const result = await callClaude({
    systemPrompt,
    userPrompt,
    maxTokens: 1024,
  })

  let assessment: ImpactAssessment
  try {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON object found in response')
    }
    assessment = JSON.parse(jsonMatch[0])
  } catch (error) {
    logger.error('Failed to parse impact assessment from AI response', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    assessment = {
      impactLevel: 'medium',
      reasoning: 'Unable to assess impact automatically. Manual review recommended.',
      affectedAreas: [],
      recommendations: ['Perform manual impact assessment'],
    }
  }

  setCache(cacheKey, assessment)

  return {
    data: assessment,
    cached: false,
    generatedAt: new Date().toISOString(),
    model: 'claude-sonnet-4-20250514',
    tokensUsed: result.tokensUsed,
  }
}

/**
 * Clear AI response cache
 */
export function clearCache(operation?: string): number {
  if (!operation) {
    const size = responseCache.size
    responseCache.clear()
    return size
  }

  let cleared = 0
  for (const key of responseCache.keys()) {
    if (key.includes(`:${operation}:`)) {
      responseCache.delete(key)
      cleared++
    }
  }
  return cleared
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; operations: Record<string, number> } {
  const operations: Record<string, number> = {}

  for (const key of responseCache.keys()) {
    const op = key.split(':')[1] ?? 'unknown'
    operations[op] = (operations[op] ?? 0) + 1
  }

  return { size: responseCache.size, operations }
}
