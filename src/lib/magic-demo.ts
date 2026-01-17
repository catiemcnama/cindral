/**
 * Magic Demo - The 60-Second Compliance Analysis
 *
 * Uses AI to analyze company descriptions, detect systems,
 * match regulations from the database, and identify gaps.
 *
 * NO hardcoded patterns. NO fake analysis. Just AI + real data.
 */

import { db } from '@/db'
import { articles, regulations } from '@/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { recordAICall } from './ai-observability'
import { AIServiceError } from './errors'
import { logger } from './logger'

// =============================================================================
// Types (exported for use in UI)
// =============================================================================

export interface CompanyProfile {
  description: string
  industry?: string
  region?: string
}

export interface DetectedSystem {
  name: string
  category: 'cloud' | 'database' | 'api' | 'storage' | 'compute' | 'network' | 'payment' | 'other'
  dataTypes: string[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

export interface ApplicableArticle {
  regulation: string
  articleNumber: string
  title: string
  summary: string
  relevance: string
  impactLevel: 'low' | 'medium' | 'high' | 'critical'
}

export interface ComplianceGap {
  id: string
  article: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
  estimatedEffort: 'hours' | 'days' | 'weeks' | 'months'
}

export interface MagicDemoResult {
  analysisTimeMs: number
  timestamp: string
  detectedSystems: DetectedSystem[]
  applicableArticles: ApplicableArticle[]
  complianceGaps: ComplianceGap[]
  evidenceSummary: {
    executiveSummary: string
    riskHighlights: Array<{ area: string; level: string; description: string }>
    immediateActions: string[]
  }
  metrics: {
    systemsAnalyzed: number
    articlesMatched: number
    gapsIdentified: number
  }
  aiMetadata: {
    tokensUsed: number
    model: string
    confidence: number
  }
}

export interface PlanRecommendation {
  suggestedPlan: 'starter' | 'professional' | 'enterprise'
}

// =============================================================================
// AI Client
// =============================================================================

import { getAnthropicClient } from './ai'

async function callAI<T>(params: {
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
}): Promise<{ data: T; inputTokens: number; outputTokens: number; latencyMs: number }> {
  const client = await getAnthropicClient()
  const startTime = Date.now()
  const model = 'claude-sonnet-4-20250514'

  const response = await client.messages.create({
    model,
    max_tokens: params.maxTokens ?? 2048,
    system: params.systemPrompt,
    messages: [{ role: 'user', content: params.userPrompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new AIServiceError('Unexpected response type from AI')
  }

  // Parse JSON from response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new AIServiceError('No JSON object found in AI response')
  }

  return {
    data: JSON.parse(jsonMatch[0]) as T,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    latencyMs: Date.now() - startTime,
  }
}

// =============================================================================
// Database Queries
// =============================================================================

async function fetchRegulationsWithArticles(region?: string) {
  // Get a sample org's regulations (for demo, we use any available data)
  const regs = await db.query.regulations.findMany({
    where: and(eq(regulations.status, 'active'), isNull(regulations.deletedAt)),
    limit: 10,
    with: {
      articles: {
        where: isNull(articles.deletedAt),
        columns: {
          id: true,
          articleNumber: true,
          title: true,
          description: true,
          aiSummary: true,
        },
      },
    },
  })

  // Filter by region if specified
  if (region === 'EU') {
    return regs.filter((r) => ['EU', 'European Union'].includes(r.jurisdiction ?? ''))
  }

  return regs
}

// =============================================================================
// Main Analysis Function
// =============================================================================

export async function runMagicDemo(profile: CompanyProfile): Promise<MagicDemoResult> {
  const startTime = Date.now()
  const model = 'claude-sonnet-4-20250514'

  logger.info('Starting magic demo analysis', {
    descriptionLength: profile.description.length,
    region: profile.region,
  })

  // Fetch real regulations from database
  const regulationsData = await fetchRegulationsWithArticles(profile.region)

  // Build context of available regulations for AI
  const regulationContext = regulationsData
    .map((reg) => {
      const articleList = reg.articles
        .slice(0, 20) // Limit for token efficiency
        .map((a) => `  - Art. ${a.articleNumber}: ${a.title || 'Untitled'}\n    ${a.aiSummary || a.description || ''}`)
        .join('\n')
      return `${reg.name} (${reg.framework}):\n${articleList}`
    })
    .join('\n\n')

  // ONE AI call to do everything
  const systemPrompt = `You are a regulatory compliance expert. Analyze the company description and return a JSON object with:

1. "detectedSystems": Array of technology systems detected. Each has:
   - name: string (e.g., "AWS", "PostgreSQL", "Stripe")
   - category: "cloud" | "database" | "api" | "storage" | "compute" | "network" | "payment" | "other"
   - dataTypes: string[] (e.g., ["customer data", "financial data", "PII"])
   - riskLevel: "low" | "medium" | "high" | "critical"

2. "applicableArticles": Array of regulation articles that apply. Each has:
   - regulation: string (regulation name)
   - articleNumber: string
   - title: string
   - summary: string (max 100 words)
   - relevance: string (why this applies to them, max 50 words)
   - impactLevel: "low" | "medium" | "high" | "critical"

3. "complianceGaps": Array of likely compliance gaps. Each has:
   - id: string (e.g., "gap-1")
   - article: string (e.g., "DORA Art. 28")
   - description: string (the gap)
   - severity: "low" | "medium" | "high" | "critical"
   - recommendation: string (actionable fix)
   - estimatedEffort: "hours" | "days" | "weeks" | "months"

4. "evidenceSummary": Object with:
   - executiveSummary: string (3-4 sentences for executives)
   - riskHighlights: Array of { area: string, level: string, description: string }
   - immediateActions: string[] (top 5 actions to take)

5. "confidence": number (0-1, your confidence in this analysis)

Be specific. Match against the ACTUAL regulations provided. Don't invent articles that don't exist in the context.`

  const userPrompt = `COMPANY DESCRIPTION:
${profile.description}

INDUSTRY: ${profile.industry || 'Not specified'}
REGION: ${profile.region || 'Not specified'}

AVAILABLE REGULATIONS AND ARTICLES:
${regulationContext || 'No regulations loaded in database. Analyze based on common EU financial regulations (DORA, GDPR).'}

Analyze this company and return the JSON.`

  try {
    const result = await callAI<{
      detectedSystems: DetectedSystem[]
      applicableArticles: ApplicableArticle[]
      complianceGaps: ComplianceGap[]
      evidenceSummary: {
        executiveSummary: string
        riskHighlights: Array<{ area: string; level: string; description: string }>
        immediateActions: string[]
      }
      confidence: number
    }>({
      systemPrompt,
      userPrompt,
      maxTokens: 4096,
    })

    const analysisTimeMs = Date.now() - startTime

    // Record metrics
    recordAICall(
      { operation: 'magicDemo', promptVersion: '2.0.0' },
      {
        model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        latencyMs: analysisTimeMs,
        cached: false,
        success: true,
        confidenceScore: result.data.confidence,
      }
    )

    logger.info('Magic demo analysis complete', {
      analysisTimeMs,
      systemsDetected: result.data.detectedSystems.length,
      articlesMatched: result.data.applicableArticles.length,
      gapsIdentified: result.data.complianceGaps.length,
    })

    return {
      analysisTimeMs,
      timestamp: new Date().toISOString(),
      detectedSystems: result.data.detectedSystems,
      applicableArticles: result.data.applicableArticles,
      complianceGaps: result.data.complianceGaps,
      evidenceSummary: result.data.evidenceSummary,
      metrics: {
        systemsAnalyzed: result.data.detectedSystems.length,
        articlesMatched: result.data.applicableArticles.length,
        gapsIdentified: result.data.complianceGaps.length,
      },
      aiMetadata: {
        tokensUsed: result.inputTokens + result.outputTokens,
        model,
        confidence: result.data.confidence,
      },
    }
  } catch (error) {
    logger.error('Magic demo AI call failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

// =============================================================================
// Plan Recommendation
// =============================================================================

export function suggestPlan(metrics: MagicDemoResult['metrics']): PlanRecommendation {
  // Enterprise: Complex compliance landscape
  if (metrics.gapsIdentified >= 10 || metrics.articlesMatched >= 15) {
    return { suggestedPlan: 'enterprise' }
  }
  // Professional: Moderate complexity
  if (metrics.gapsIdentified >= 5 || metrics.articlesMatched >= 8) {
    return { suggestedPlan: 'professional' }
  }
  // Starter: Simple needs
  return { suggestedPlan: 'starter' }
}
