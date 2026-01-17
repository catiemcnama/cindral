/**
 * AI Compliance Agent
 *
 * Autonomous agent that proactively:
 * - Maps regulations to systems automatically
 * - Generates evidence and compliance reports
 * - Identifies gaps and recommends actions
 * - Learns from user feedback to improve over time
 *
 * Philosophy: "Don't tell users about compliance - DO compliance for them"
 */

import { db } from '@/db'
import {
  articleSystemImpacts,
  articles,
  evidencePacks,
  obligations,
  regulations,
  regulatoryChanges,
  systems,
} from '@/db/schema'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { AIServiceError, NotFoundError } from './errors'
import { logger } from './logger'

// =============================================================================
// Types
// =============================================================================

export interface AgentTask {
  id: string
  type: AgentTaskType
  organizationId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  input: Record<string, unknown>
  output?: Record<string, unknown>
  startedAt?: Date
  completedAt?: Date
  error?: string
}

export type AgentTaskType =
  | 'auto_map_regulation'
  | 'generate_evidence'
  | 'identify_gaps'
  | 'assess_change_impact'
  | 'recommend_actions'
  | 'full_compliance_scan'

export interface AutoMapResult {
  systemId: string
  systemName: string
  articleId: string
  impactLevel: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  reasoning: string
  affectedAreas: string[]
  recommendations: string[]
}

export interface GapAnalysis {
  totalSystems: number
  mappedSystems: number
  unmappedSystems: string[]
  criticalGaps: CriticalGap[]
  complianceScore: number
  recommendations: string[]
}

export interface CriticalGap {
  systemId: string
  systemName: string
  missingRegulations: string[]
  riskLevel: 'high' | 'critical'
  urgency: 'immediate' | 'within_30_days' | 'within_90_days'
}

export interface AgentMetrics {
  tasksCompleted: number
  mappingsCreated: number
  gapsIdentified: number
  evidenceGenerated: number
  hoursSaved: number // Estimated time saved for compliance team
}

// =============================================================================
// AI Client
// =============================================================================

import { getAnthropicClient } from './ai'

async function callAgent(params: { systemPrompt: string; userPrompt: string; maxTokens?: number }): Promise<string> {
  const client = await getAnthropicClient()

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: params.maxTokens ?? 4096,
    system: params.systemPrompt,
    messages: [{ role: 'user', content: params.userPrompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new AIServiceError('Unexpected response type from Claude')
  }
  return content.text
}

// =============================================================================
// Agent Core
// =============================================================================

/**
 * Autonomous Compliance Agent
 *
 * This agent DOES compliance work, not just reports on it.
 * It runs proactively and takes action automatically.
 */
export class ComplianceAgent {
  private organizationId: string
  private metrics: AgentMetrics = {
    tasksCompleted: 0,
    mappingsCreated: 0,
    gapsIdentified: 0,
    evidenceGenerated: 0,
    hoursSaved: 0,
  }

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * Run full compliance scan
   * This is the "magic button" - one click to full compliance visibility
   */
  async runFullScan(): Promise<{
    mappings: AutoMapResult[]
    gaps: GapAnalysis
    actions: string[]
    metrics: AgentMetrics
  }> {
    logger.info('Agent: Starting full compliance scan', { organizationId: this.organizationId })
    const startTime = Date.now()

    // Step 1: Get all systems and regulations
    const [systemsList, articlesList] = await Promise.all([this.getSystems(), this.getArticles()])

    // Step 2: Auto-map all systems to relevant regulations
    const mappings = await this.autoMapAllSystems(systemsList, articlesList)
    this.metrics.mappingsCreated += mappings.length

    // Step 3: Identify gaps
    const gaps = await this.identifyGaps(systemsList, mappings)
    this.metrics.gapsIdentified += gaps.criticalGaps.length

    // Step 4: Generate recommended actions
    const actions = await this.generateActions(gaps, mappings)

    // Calculate time saved (estimate: 2 hours per system for manual mapping)
    const hoursSaved = systemsList.length * 2
    this.metrics.hoursSaved += hoursSaved
    this.metrics.tasksCompleted++

    const duration = Date.now() - startTime
    logger.info('Agent: Full scan completed', {
      organizationId: this.organizationId,
      duration,
      mappings: mappings.length,
      gaps: gaps.criticalGaps.length,
      hoursSaved,
    })

    return {
      mappings,
      gaps,
      actions,
      metrics: { ...this.metrics },
    }
  }

  /**
   * Automatically map a regulation to all relevant systems
   */
  async autoMapRegulation(regulationId: string): Promise<AutoMapResult[]> {
    logger.info('Agent: Auto-mapping regulation', { regulationId, organizationId: this.organizationId })

    const [systemsList, articlesList] = await Promise.all([
      this.getSystems(),
      db.query.articles.findMany({
        where: and(
          eq(articles.organizationId, this.organizationId),
          eq(articles.regulationId, regulationId),
          isNull(articles.deletedAt)
        ),
      }),
    ])

    const results: AutoMapResult[] = []

    for (const article of articlesList) {
      for (const system of systemsList) {
        const mapping = await this.assessSystemArticleImpact(system, article)
        if (mapping && mapping.confidence >= 0.6) {
          results.push(mapping)

          // Actually create the mapping in the database
          await this.persistMapping(mapping)
        }
      }
    }

    this.metrics.mappingsCreated += results.length
    return results
  }

  /**
   * Auto-map all systems against all articles
   */
  private async autoMapAllSystems(
    systemsList: Array<{
      id: string
      name: string
      description: string | null
      tags: string[] | null
      criticality: string | null
    }>,
    articlesList: Array<{ id: string; title: string | null; rawText: string | null; normalizedText: string | null }>
  ): Promise<AutoMapResult[]> {
    const results: AutoMapResult[] = []

    // Check existing mappings to avoid duplicates
    const existingMappings = await db.query.articleSystemImpacts.findMany({
      where: eq(articleSystemImpacts.organizationId, this.organizationId),
      columns: { articleId: true, systemId: true },
    })
    const existingSet = new Set(existingMappings.map((m) => `${m.articleId}:${m.systemId}`))

    // Process in batches for efficiency
    const batchSize = 5
    for (let i = 0; i < articlesList.length; i += batchSize) {
      const articleBatch = articlesList.slice(i, i + batchSize)

      const batchPromises = articleBatch.flatMap((article) =>
        systemsList.map(async (system) => {
          const key = `${article.id}:${system.id}`
          if (existingSet.has(key)) return null

          const mapping = await this.assessSystemArticleImpact(system, article)
          if (mapping && mapping.confidence >= 0.6) {
            return mapping
          }
          return null
        })
      )

      const batchResults = await Promise.all(batchPromises)
      const validResults = batchResults.filter((r): r is AutoMapResult => r !== null)
      results.push(...validResults)

      // Persist mappings immediately
      for (const mapping of validResults) {
        await this.persistMapping(mapping)
      }
    }

    return results
  }

  /**
   * Assess impact of an article on a system using AI
   */
  private async assessSystemArticleImpact(
    system: { id: string; name: string; description: string | null; tags: string[] | null; criticality: string | null },
    article: { id: string; title: string | null; rawText: string | null; normalizedText: string | null }
  ): Promise<AutoMapResult | null> {
    const articleText = article.normalizedText || article.rawText
    if (!articleText) return null

    const systemDescription = `
System: ${system.name}
Description: ${system.description || 'No description'}
Tags: ${system.tags?.join(', ') || 'None'}
Criticality: ${system.criticality || 'Unknown'}
    `.trim()

    try {
      const response = await callAgent({
        systemPrompt: `You are an expert compliance analyst AI agent. Your job is to AUTOMATICALLY determine if a regulatory article applies to a specific IT system.

You must be decisive and take action. Respond with a JSON object:
{
  "applies": boolean,
  "confidence": number (0-1),
  "impactLevel": "low" | "medium" | "high" | "critical",
  "reasoning": "Brief explanation",
  "affectedAreas": ["list", "of", "affected", "components"],
  "recommendations": ["actionable", "compliance", "steps"]
}

Be aggressive about finding connections - it's better to flag something that might apply than to miss a compliance requirement.`,
        userPrompt: `REGULATORY ARTICLE:
Title: ${article.title}
Text: ${articleText.substring(0, 3000)}

SYSTEM TO ASSESS:
${systemDescription}

Does this regulation apply to this system? If so, what is the impact and what actions are needed?`,
        maxTokens: 1024,
      })

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return null

      const parsed = JSON.parse(jsonMatch[0])
      if (!parsed.applies) return null

      return {
        systemId: system.id,
        systemName: system.name,
        articleId: article.id,
        impactLevel: parsed.impactLevel,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
        affectedAreas: parsed.affectedAreas || [],
        recommendations: parsed.recommendations || [],
      }
    } catch (error) {
      logger.error('Agent: Failed to assess impact', {
        systemId: system.id,
        articleId: article.id,
        error: error instanceof Error ? error.message : 'Unknown',
      })
      return null
    }
  }

  /**
   * Persist a mapping to the database
   */
  private async persistMapping(mapping: AutoMapResult): Promise<void> {
    try {
      // Build notes from the AI analysis
      const notesContent = [
        `Impact Level: ${mapping.impactLevel}`,
        `Confidence: ${(mapping.confidence * 100).toFixed(0)}%`,
        '',
        'Reasoning:',
        mapping.reasoning,
        '',
        'Affected Areas:',
        mapping.affectedAreas.join(', '),
        '',
        'Recommendations:',
        mapping.recommendations.join(', '),
      ].join('\n')

      await db
        .insert(articleSystemImpacts)
        .values({
          organizationId: this.organizationId,
          articleId: mapping.articleId,
          systemId: mapping.systemId,
          impactLevel: mapping.impactLevel,
          status: 'open',
          notes: notesContent,
        })
        .onConflictDoNothing()
    } catch (error) {
      logger.error('Agent: Failed to persist mapping', {
        mapping,
        error: error instanceof Error ? error.message : 'Unknown',
      })
    }
  }

  /**
   * Identify compliance gaps
   */
  private async identifyGaps(
    systemsList: Array<{ id: string; name: string; criticality: string | null }>,
    mappings: AutoMapResult[]
  ): Promise<GapAnalysis> {
    const mappedSystemIds = new Set(mappings.map((m) => m.systemId))
    const unmappedSystems = systemsList.filter((s) => !mappedSystemIds.has(s.id)).map((s) => s.name)

    // Find critical systems without mappings
    const criticalGaps: CriticalGap[] = systemsList
      .filter((s) => !mappedSystemIds.has(s.id) && s.criticality === 'critical')
      .map((s) => ({
        systemId: s.id,
        systemName: s.name,
        missingRegulations: ['DORA', 'GDPR', 'NIS2'], // Would be determined by AI
        riskLevel: 'critical' as const,
        urgency: 'immediate' as const,
      }))

    const complianceScore = systemsList.length > 0 ? Math.round((mappedSystemIds.size / systemsList.length) * 100) : 100

    return {
      totalSystems: systemsList.length,
      mappedSystems: mappedSystemIds.size,
      unmappedSystems,
      criticalGaps,
      complianceScore,
      recommendations: this.generateGapRecommendations(criticalGaps, unmappedSystems.length),
    }
  }

  /**
   * Generate gap recommendations
   */
  private generateGapRecommendations(criticalGaps: CriticalGap[], unmappedCount: number): string[] {
    const recommendations: string[] = []

    if (criticalGaps.length > 0) {
      recommendations.push(
        `🚨 URGENT: ${criticalGaps.length} critical systems have no compliance mappings. Review immediately.`
      )
    }

    if (unmappedCount > 5) {
      recommendations.push(
        `📋 ${unmappedCount} systems need compliance assessment. Consider running full auto-mapping.`
      )
    }

    recommendations.push('✅ Schedule weekly compliance scans to catch new gaps early.')

    return recommendations
  }

  /**
   * Generate prioritized action list
   */
  private async generateActions(gaps: GapAnalysis, mappings: AutoMapResult[]): Promise<string[]> {
    const actions: string[] = []

    // Critical actions first
    for (const gap of gaps.criticalGaps) {
      actions.push(
        `🔴 CRITICAL: Map ${gap.systemName} to applicable regulations (${gap.missingRegulations.join(', ')})`
      )
    }

    // High-impact mappings need attention
    const highImpact = mappings.filter((m) => m.impactLevel === 'high' || m.impactLevel === 'critical')
    if (highImpact.length > 0) {
      actions.push(`⚠️ Review ${highImpact.length} high-impact mappings and assign obligation owners`)
    }

    // Medium-term actions
    if (gaps.complianceScore < 80) {
      actions.push(`📈 Compliance score is ${gaps.complianceScore}%. Target 80%+ by end of quarter.`)
    }

    // Proactive recommendations
    actions.push('📝 Generate evidence packs for upcoming audit deadlines')
    actions.push('🔄 Set up automated weekly compliance reports')

    return actions
  }

  /**
   * Auto-generate evidence pack for a regulation
   */
  async generateEvidencePack(regulationId: string): Promise<{ packId: string; sections: string[] }> {
    logger.info('Agent: Generating evidence pack', { regulationId, organizationId: this.organizationId })

    // Get regulation with articles and mappings
    const regulation = await db.query.regulations.findFirst({
      where: and(eq(regulations.organizationId, this.organizationId), eq(regulations.id, regulationId)),
      with: {
        articles: {
          with: {
            systemImpacts: {
              with: { system: true },
            },
            obligations: true,
          },
        },
      },
    })

    if (!regulation) {
      throw new NotFoundError('Regulation', regulationId)
    }

    // Create evidence pack
    const sections = [
      'Executive Summary',
      'Compliance Status Overview',
      'System Impact Analysis',
      'Obligation Tracking',
      'Evidence Artifacts',
      'Gap Analysis',
      'Remediation Timeline',
    ]

    const [pack] = await db
      .insert(evidencePacks)
      .values({
        organizationId: this.organizationId,
        title: `${regulation.name} Compliance Evidence Pack`,
        description: `Auto-generated evidence pack for ${regulation.name} compliance`,
        regulationId,
        status: 'draft',
        framework: regulation.framework || undefined,
      })
      .returning()

    // Would trigger async generation of actual content
    this.metrics.evidenceGenerated++

    return { packId: String(pack.id), sections }
  }

  /**
   * Process a regulatory change and assess impact
   */
  async processRegulatoryChange(changeId: number): Promise<{
    affectedSystems: string[]
    requiredActions: string[]
    urgency: 'low' | 'medium' | 'high' | 'critical'
  }> {
    const change = await db.query.regulatoryChanges.findFirst({
      where: eq(regulatoryChanges.id, changeId),
    })

    if (!change) {
      throw new NotFoundError('Regulatory change', changeId)
    }

    const systemsList = await this.getSystems()

    // Use AI to assess which systems are affected
    const response = await callAgent({
      systemPrompt: `You are a compliance change impact analyst. Given a regulatory change and a list of systems, determine which systems are affected and what actions are needed.

Respond with JSON:
{
  "affectedSystems": ["system names"],
  "requiredActions": ["specific actions"],
  "urgency": "low" | "medium" | "high" | "critical"
}`,
      userPrompt: `REGULATORY CHANGE:
Title: ${change.title}
Description: ${change.description || 'No description'}
Severity: ${change.severity}

SYSTEMS:
${systemsList.map((s) => `- ${s.name}: ${s.description || 'No description'}`).join('\n')}

What systems are affected and what actions are needed?`,
    })

    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return {
        affectedSystems: [],
        requiredActions: ['Manual review required'],
        urgency: 'medium',
      }
    }

    return JSON.parse(jsonMatch[0])
  }

  /**
   * Get all systems for the organization
   */
  private async getSystems() {
    return db.query.systems.findMany({
      where: and(eq(systems.organizationId, this.organizationId), isNull(systems.deletedAt)),
      columns: {
        id: true,
        name: true,
        description: true,
        tags: true,
        criticality: true,
      },
    })
  }

  /**
   * Get all articles for the organization
   */
  private async getArticles() {
    return db.query.articles.findMany({
      where: and(eq(articles.organizationId, this.organizationId), isNull(articles.deletedAt)),
      columns: {
        id: true,
        title: true,
        rawText: true,
        normalizedText: true,
      },
    })
  }

  /**
   * Get current metrics
   */
  getMetrics(): AgentMetrics {
    return { ...this.metrics }
  }
}

// =============================================================================
// Agent Factory
// =============================================================================

const agentCache = new Map<string, ComplianceAgent>()

/**
 * Get or create an agent for an organization
 */
export function getAgent(organizationId: string): ComplianceAgent {
  let agent = agentCache.get(organizationId)
  if (!agent) {
    agent = new ComplianceAgent(organizationId)
    agentCache.set(organizationId, agent)
  }
  return agent
}

/**
 * Run a quick compliance scan (called on dashboard load)
 */
export async function runQuickScan(organizationId: string): Promise<{
  complianceScore: number
  criticalGaps: number
  pendingActions: number
  hoursSaved: number
}> {
  const agent = getAgent(organizationId)

  // Get counts from database for quick response
  const [systemsCount, mappingsCount, obligationsResult] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(systems)
      .where(and(eq(systems.organizationId, organizationId), isNull(systems.deletedAt))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(articleSystemImpacts)
      .where(eq(articleSystemImpacts.organizationId, organizationId)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(obligations)
      .where(
        and(
          eq(obligations.organizationId, organizationId),
          eq(obligations.status, 'not_started'),
          isNull(obligations.deletedAt)
        )
      ),
  ])

  const totalSystems = Number(systemsCount[0]?.count ?? 0)
  const totalMappings = Number(mappingsCount[0]?.count ?? 0)
  const pendingObligations = Number(obligationsResult[0]?.count ?? 0)

  // Estimate compliance score
  const complianceScore =
    totalSystems > 0
      ? Math.min(100, Math.round((totalMappings / (totalSystems * 3)) * 100)) // Assume ~3 mappings per system is good
      : 100

  return {
    complianceScore,
    criticalGaps: Math.max(0, totalSystems - Math.floor(totalMappings / 3)),
    pendingActions: pendingObligations,
    hoursSaved: agent.getMetrics().hoursSaved,
  }
}
