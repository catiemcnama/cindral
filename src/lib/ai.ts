/**
 * AI Service Abstraction
 *
 * Provides a unified interface for AI-powered features.
 * Currently implemented with Anthropic Claude.
 */

import { recordAICall } from './ai-observability'
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
  confidence: number
}

export interface ImpactAssessment {
  impactLevel: 'low' | 'medium' | 'high' | 'critical'
  reasoning: string
  affectedAreas: string[]
  recommendations: string[]
  confidence: number
}

export interface AIResponse<T> {
  data: T
  cached: boolean
  generatedAt: string
  model: string
  tokensUsed?: number
  latencyMs?: number
  confidence?: number
  promptVersion?: string
}

// Cache for AI responses (short TTL - regulations change)
const responseCache = new Map<string, { data: unknown; expiresAt: number; promptVersion: string }>()
const CACHE_TTL_MS = 4 * 60 * 60 * 1000 // 4 hours (not 7 days - content evolves)

/**
 * Generate cache key from inputs
 * Includes organizationId to ensure tenant isolation
 */
function getCacheKey(operation: string, input: string, organizationId?: string): string {
  // Simple hash function for cache key
  let hash = 0
  // Include organizationId in hash to scope by tenant
  const str = `${organizationId || 'global'}:${operation}:${input}`
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return `ai:${organizationId || 'global'}:${operation}:${hash.toString(36)}`
}

/**
 * Check cache for existing response
 */
function getFromCache<T>(key: string): { data: T; promptVersion: string } | null {
  const cached = responseCache.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    return { data: cached.data as T, promptVersion: cached.promptVersion }
  }
  responseCache.delete(key)
  return null
}

/**
 * Store response in cache
 */
function setCache(key: string, value: { data: unknown; promptVersion: string }): void {
  responseCache.set(key, {
    data: value.data,
    expiresAt: Date.now() + CACHE_TTL_MS,
    promptVersion: value.promptVersion,
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
 * Call Claude with retry logic and instrumentation
 */
async function callClaude(params: {
  operation: string
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
  organizationId?: string
  promptVersion?: string
}): Promise<{ content: string; inputTokens: number; outputTokens: number; latencyMs: number }> {
  const client = await getAnthropicClient()
  const startTime = Date.now()
  const model = 'claude-sonnet-4-20250514'

  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: params.maxTokens ?? 1024,
        system: params.systemPrompt,
        messages: [{ role: 'user', content: params.userPrompt }],
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type')
      }

      const latencyMs = Date.now() - startTime
      const inputTokens = response.usage.input_tokens
      const outputTokens = response.usage.output_tokens

      // Record metrics
      recordAICall(
        {
          operation: params.operation,
          promptVersion: params.promptVersion,
          organizationId: params.organizationId,
        },
        {
          model,
          inputTokens,
          outputTokens,
          latencyMs,
          cached: false,
          success: true,
        }
      )

      return {
        content: content.text,
        inputTokens,
        outputTokens,
        latencyMs,
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

      // Record failure
      recordAICall(
        {
          operation: params.operation,
          promptVersion: params.promptVersion,
          organizationId: params.organizationId,
        },
        {
          model,
          inputTokens: 0,
          outputTokens: 0,
          latencyMs: Date.now() - startTime,
          cached: false,
          success: false,
        }
      )

      throw lastError
    }
  }

  throw lastError ?? new Error('AI call failed after retries')
}

/**
 * Summarize regulatory text
 * @param text - The regulatory text to summarize
 * @param options - Summarization options
 * @param organizationId - Optional org ID for cache scoping (prevents cross-tenant cache leakage)
 */
export async function summarize(
  text: string,
  options: SummarizeOptions = {},
  organizationId?: string
): Promise<AIResponse<string>> {
  const { maxLength = 200, format = 'paragraph' } = options
  const cacheKey = getCacheKey('summarize', `${text}:${maxLength}:${format}`, organizationId)

  // Check cache
  const cached = getFromCache<string>(cacheKey)
  if (cached) {
    // Record cache hit
    recordAICall(
      { operation: 'summarize', promptVersion: cached.promptVersion, organizationId },
      { model: 'claude-sonnet-4-20250514', inputTokens: 0, outputTokens: 0, latencyMs: 0, cached: true, success: true }
    )
    return {
      data: cached.data,
      cached: true,
      generatedAt: new Date().toISOString(),
      model: 'claude-sonnet-4-20250514',
      promptVersion: cached.promptVersion,
    }
  }

  const formatInstruction =
    format === 'bullets'
      ? 'Use bullet points.'
      : format === 'structured'
        ? 'Use a structured format with headings.'
        : 'Write in paragraph form.'

  const systemPrompt = `You are a regulatory compliance expert. Summarize the following regulatory text concisely and accurately. ${formatInstruction} Maximum ${maxLength} words. Focus on key requirements and obligations.`

  const promptVersion = '1.0.0'
  const result = await callClaude({
    operation: 'summarize',
    systemPrompt,
    userPrompt: text,
    maxTokens: Math.ceil(maxLength * 1.5),
    organizationId,
    promptVersion,
  })

  // Cache result
  setCache(cacheKey, { data: result.content, promptVersion })

  return {
    data: result.content,
    cached: false,
    generatedAt: new Date().toISOString(),
    model: 'claude-sonnet-4-20250514',
    tokensUsed: result.inputTokens + result.outputTokens,
    latencyMs: result.latencyMs,
    promptVersion,
  }
}

/**
 * Extract obligations from article text
 * @param articleText - The article text to extract obligations from
 * @param organizationId - Optional org ID for cache scoping (prevents cross-tenant cache leakage)
 */
export async function extractObligations(
  articleText: string,
  organizationId?: string
): Promise<AIResponse<ExtractedObligation[]>> {
  const cacheKey = getCacheKey('extractObligations', articleText, organizationId)
  const promptVersion = '1.1.0'

  const cached = getFromCache<ExtractedObligation[]>(cacheKey)
  if (cached) {
    recordAICall(
      { operation: 'extractObligations', promptVersion: cached.promptVersion, organizationId },
      { model: 'claude-sonnet-4-20250514', inputTokens: 0, outputTokens: 0, latencyMs: 0, cached: true, success: true }
    )
    return {
      data: cached.data,
      cached: true,
      generatedAt: new Date().toISOString(),
      model: 'claude-sonnet-4-20250514',
      promptVersion: cached.promptVersion,
    }
  }

  const systemPrompt = `You are a regulatory compliance expert. Extract compliance obligations from the following regulatory article text.

For each obligation, provide:
- title: A short, clear title (max 100 characters)
- summary: A brief description of what must be done (max 200 characters)
- requirementType: One of "process", "technical", or "reporting"
- riskLevel: One of "low", "medium", "high", or "critical"
- confidence: A number between 0 and 1 indicating how confident you are this is a real obligation (1 = certain)

Respond with a JSON array of obligations. Only include actual compliance requirements, not definitions or background information.`

  const result = await callClaude({
    operation: 'extractObligations',
    systemPrompt,
    userPrompt: articleText,
    maxTokens: 2048,
    organizationId,
    promptVersion,
  })

  // Parse JSON response
  let obligations: ExtractedObligation[]
  let avgConfidence = 0
  try {
    const jsonMatch = result.content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('No JSON array found in response')
    }
    obligations = JSON.parse(jsonMatch[0])
    // Calculate average confidence
    const confidences = obligations.map((o) => o.confidence ?? 0.8)
    avgConfidence = confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0
  } catch (error) {
    logger.error('Failed to parse obligations from AI response', {
      error: error instanceof Error ? error.message : 'Unknown error',
      response: result.content.substring(0, 500),
    })
    obligations = []
  }

  setCache(cacheKey, { data: obligations, promptVersion })

  return {
    data: obligations,
    cached: false,
    generatedAt: new Date().toISOString(),
    model: 'claude-sonnet-4-20250514',
    tokensUsed: result.inputTokens + result.outputTokens,
    latencyMs: result.latencyMs,
    confidence: avgConfidence,
    promptVersion,
  }
}

/**
 * Assess impact of a regulation article on a system
 * @param articleText - The regulatory article text
 * @param systemDescription - Description of the system to assess
 * @param organizationId - Optional org ID for cache scoping (prevents cross-tenant cache leakage)
 */
export async function assessImpact(
  articleText: string,
  systemDescription: string,
  organizationId?: string
): Promise<AIResponse<ImpactAssessment>> {
  const promptVersion = '1.1.0'
  const cacheKey = getCacheKey('assessImpact', `${articleText}:${systemDescription}`, organizationId)

  const cached = getFromCache<ImpactAssessment>(cacheKey)
  if (cached && cached.promptVersion === promptVersion) {
    recordAICall(
      {
        operation: 'assessImpact',
        promptVersion,
        organizationId,
      },
      {
        model: 'claude-sonnet-4-20250514',
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: 0,
        cached: true,
        success: true,
      }
    )
    return {
      data: cached.data,
      cached: true,
      generatedAt: new Date().toISOString(),
      model: 'claude-sonnet-4-20250514',
      latencyMs: 0,
      confidence: cached.data.confidence,
      promptVersion,
    }
  }

  const systemPrompt = `You are a regulatory compliance expert assessing how a regulation affects IT systems.

Analyze how the following regulatory article impacts the described system. Provide:
- impactLevel: "low", "medium", "high", or "critical"
- reasoning: Why this impact level was assigned (max 200 words)
- affectedAreas: List of specific areas/components affected
- recommendations: Actionable steps to achieve compliance
- confidence: A number between 0 and 1 indicating your confidence in this assessment (1 = highly confident)

Respond with a JSON object.`

  const userPrompt = `REGULATORY ARTICLE:
${articleText}

SYSTEM DESCRIPTION:
${systemDescription}`

  const result = await callClaude({
    systemPrompt,
    userPrompt,
    maxTokens: 1024,
    operation: 'assessImpact',
    organizationId,
    promptVersion,
  })

  let assessment: ImpactAssessment
  try {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON object found in response')
    }
    const parsed = JSON.parse(jsonMatch[0])
    assessment = {
      ...parsed,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
    }
  } catch (error) {
    logger.error('Failed to parse impact assessment from AI response', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    assessment = {
      impactLevel: 'medium',
      reasoning: 'Unable to assess impact automatically. Manual review recommended.',
      affectedAreas: [],
      recommendations: ['Perform manual impact assessment'],
      confidence: 0.3,
    }
  }

  setCache(cacheKey, { data: assessment, promptVersion })

  return {
    data: assessment,
    cached: false,
    generatedAt: new Date().toISOString(),
    model: 'claude-sonnet-4-20250514',
    tokensUsed: result.inputTokens + result.outputTokens,
    latencyMs: result.latencyMs,
    confidence: assessment.confidence,
    promptVersion,
  }
}

/**
 * Evidence Pack Narrative
 */
export interface EvidenceNarrative {
  executiveSummary: string
  complianceAssessment: string
  riskHighlights: Array<{
    area: string
    level: 'low' | 'medium' | 'high' | 'critical'
    description: string
    mitigation: string
  }>
  auditQuestions: Array<{
    question: string
    preparedAnswer: string
    supportingEvidence: string[]
  }>
  recommendations: Array<{
    priority: 'immediate' | 'short-term' | 'long-term'
    action: string
    rationale: string
    effort: 'low' | 'medium' | 'high'
  }>
  confidence: number
}

/**
 * Generate AI-powered narrative for evidence packs
 * Provides executive summary, risk analysis, and predicted audit questions
 */
export async function generateEvidenceNarrative(params: {
  regulationName: string
  framework: string
  obligations: Array<{
    title: string
    status: string
    riskLevel: string
    summary?: string
  }>
  complianceRate: number
  systemsImpacted: string[]
  intendedAudience: 'internal' | 'auditor' | 'regulator'
  organizationId?: string
}): Promise<AIResponse<EvidenceNarrative>> {
  const promptVersion = '1.0.0'
  const { regulationName, framework, obligations, complianceRate, systemsImpacted, intendedAudience, organizationId } =
    params

  const cacheKey = getCacheKey(
    'evidenceNarrative',
    `${regulationName}:${obligations.length}:${complianceRate}:${intendedAudience}`,
    organizationId
  )

  const cached = getFromCache<EvidenceNarrative>(cacheKey)
  if (cached && cached.promptVersion === promptVersion) {
    recordAICall(
      {
        operation: 'evidenceNarrative',
        promptVersion,
        organizationId,
      },
      {
        model: 'claude-sonnet-4-20250514',
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: 0,
        cached: true,
        success: true,
      }
    )
    return {
      data: cached.data,
      cached: true,
      generatedAt: new Date().toISOString(),
      model: 'claude-sonnet-4-20250514',
      latencyMs: 0,
      confidence: cached.data.confidence,
      promptVersion,
    }
  }

  const audienceContext = {
    internal: 'internal stakeholders who need actionable insights and clear next steps',
    auditor: 'external auditors who require detailed evidence trails and control documentation',
    regulator: 'regulatory authorities who expect formal compliance demonstrations and gap analyses',
  }

  const systemPrompt = `You are an expert compliance analyst generating evidence pack narratives for ${audienceContext[intendedAudience]}.

Your output must be professional, precise, and tailored for the intended audience. Generate a comprehensive compliance narrative that includes:

1. executiveSummary: A 2-3 paragraph overview of compliance posture (max 300 words)
2. complianceAssessment: Detailed assessment of current compliance state (max 400 words)
3. riskHighlights: Array of key risk areas with mitigation strategies
4. auditQuestions: Predicted questions an auditor might ask, with prepared answers and evidence references
5. recommendations: Prioritized action items with effort estimates
6. confidence: Your confidence score (0-1) in this assessment

For auditor/regulator audiences, be more formal and evidence-focused.
For internal audiences, be more actionable and business-oriented.

Respond with a JSON object matching this structure exactly.`

  const obligationsSummary = obligations.map((o) => `- ${o.title} [${o.status}] (${o.riskLevel} risk)`).join('\n')

  const userPrompt = `REGULATION: ${regulationName}
FRAMEWORK: ${framework}
COMPLIANCE RATE: ${complianceRate}%
SYSTEMS IMPACTED: ${systemsImpacted.join(', ') || 'None identified'}
INTENDED AUDIENCE: ${intendedAudience}

OBLIGATIONS STATUS (${obligations.length} total):
${obligationsSummary}

Generate a comprehensive evidence pack narrative for this compliance position.`

  const result = await callClaude({
    systemPrompt,
    userPrompt,
    maxTokens: 4096,
    operation: 'evidenceNarrative',
    organizationId,
    promptVersion,
  })

  let narrative: EvidenceNarrative
  try {
    const jsonMatch = result.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON object found in response')
    }
    const parsed = JSON.parse(jsonMatch[0])
    narrative = {
      executiveSummary: parsed.executiveSummary || 'Unable to generate summary.',
      complianceAssessment: parsed.complianceAssessment || 'Unable to generate assessment.',
      riskHighlights: Array.isArray(parsed.riskHighlights) ? parsed.riskHighlights : [],
      auditQuestions: Array.isArray(parsed.auditQuestions) ? parsed.auditQuestions : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
    }
  } catch (error) {
    logger.error('Failed to parse evidence narrative from AI response', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    narrative = {
      executiveSummary: `Compliance assessment for ${regulationName} under ${framework} framework. Current compliance rate: ${complianceRate}%.`,
      complianceAssessment: 'Automated assessment unavailable. Manual review recommended.',
      riskHighlights: [],
      auditQuestions: [],
      recommendations: [
        {
          priority: 'immediate',
          action: 'Conduct manual compliance review',
          rationale: 'Automated analysis could not be completed',
          effort: 'medium',
        },
      ],
      confidence: 0.3,
    }
  }

  setCache(cacheKey, { data: narrative, promptVersion })

  return {
    data: narrative,
    cached: false,
    generatedAt: new Date().toISOString(),
    model: 'claude-sonnet-4-20250514',
    tokensUsed: result.inputTokens + result.outputTokens,
    latencyMs: result.latencyMs,
    confidence: narrative.confidence,
    promptVersion,
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
