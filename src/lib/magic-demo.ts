/**
 * Magic Demo - The 60-Second Compliance Analysis
 *
 * "Paste your company description → See every applicable regulation,
 * affected systems, and generated compliance evidence in under 60 seconds."
 *
 * This is THE demo that closes deals.
 */

import { generateEvidenceNarrative } from './ai'
import { recordAICall } from './ai-observability'
import { logger } from './logger'

// =============================================================================
// Types
// =============================================================================

export interface CompanyProfile {
  description: string // "We use AWS, run Python APIs, store customer data in Postgres"
  industry?: string // "fintech", "healthcare", "saas"
  region?: string // "EU", "US", "UK"
  employeeCount?: number
}

export interface DetectedSystem {
  name: string
  category: 'cloud' | 'database' | 'api' | 'storage' | 'compute' | 'network' | 'other'
  dataTypes: string[] // "customer data", "financial data", "PII"
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

export interface ApplicableArticle {
  regulation: string // "DORA", "GDPR", "NIS2"
  articleNumber: string
  title: string
  summary: string
  relevance: string // Why this applies to them
  impactLevel: 'low' | 'medium' | 'high' | 'critical'
  affectedSystems: string[]
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
  // Timing
  analysisTimeMs: number
  timestamp: string

  // What we found
  detectedSystems: DetectedSystem[]
  applicableArticles: ApplicableArticle[]
  complianceGaps: ComplianceGap[]

  // Generated evidence
  evidenceSummary: {
    executiveSummary: string
    riskHighlights: Array<{
      area: string
      level: string
      description: string
    }>
    immediateActions: string[]
  }

  // Metrics for outcome-based pricing
  metrics: {
    systemsAnalyzed: number
    articlesMatched: number
    gapsIdentified: number
    evidenceItemsGenerated: number
  }

  // AI metadata
  aiMetadata: {
    tokensUsed: number
    model: string
    confidence: number
  }
}

// =============================================================================
// System Detection
// =============================================================================

const SYSTEM_PATTERNS: Array<{
  patterns: RegExp[]
  system: Omit<DetectedSystem, 'dataTypes'>
}> = [
  // Cloud Providers
  {
    patterns: [/\baws\b/i, /amazon web services/i, /\bec2\b/i, /\bs3\b/i, /\blambda\b/i],
    system: { name: 'AWS', category: 'cloud', riskLevel: 'high' },
  },
  {
    patterns: [/\bazure\b/i, /microsoft cloud/i],
    system: { name: 'Azure', category: 'cloud', riskLevel: 'high' },
  },
  {
    patterns: [/\bgcp\b/i, /google cloud/i, /\bgke\b/i],
    system: { name: 'Google Cloud', category: 'cloud', riskLevel: 'high' },
  },

  // Databases
  {
    patterns: [/\bpostgres\b/i, /\bpostgresql\b/i],
    system: { name: 'PostgreSQL', category: 'database', riskLevel: 'high' },
  },
  {
    patterns: [/\bmysql\b/i, /\bmariadb\b/i],
    system: { name: 'MySQL', category: 'database', riskLevel: 'high' },
  },
  {
    patterns: [/\bmongodb\b/i, /\bmongo\b/i],
    system: { name: 'MongoDB', category: 'database', riskLevel: 'high' },
  },
  {
    patterns: [/\bredis\b/i],
    system: { name: 'Redis', category: 'database', riskLevel: 'medium' },
  },

  // Languages/APIs
  {
    patterns: [/\bpython\b/i, /\bdjango\b/i, /\bflask\b/i, /\bfastapi\b/i],
    system: { name: 'Python APIs', category: 'api', riskLevel: 'medium' },
  },
  {
    patterns: [/\bnode\b/i, /\bnode\.?js\b/i, /\bexpress\b/i, /\bnext\.?js\b/i],
    system: { name: 'Node.js APIs', category: 'api', riskLevel: 'medium' },
  },
  {
    patterns: [/\bjava\b/i, /\bspring\b/i, /\bspring boot\b/i],
    system: { name: 'Java APIs', category: 'api', riskLevel: 'medium' },
  },

  // Infrastructure
  {
    patterns: [/\bkubernetes\b/i, /\bk8s\b/i, /\beks\b/i, /\baks\b/i],
    system: { name: 'Kubernetes', category: 'compute', riskLevel: 'high' },
  },
  {
    patterns: [/\bdocker\b/i, /\bcontainer\b/i],
    system: { name: 'Docker', category: 'compute', riskLevel: 'medium' },
  },

  // Data types
  {
    patterns: [/customer data/i, /user data/i, /\bpii\b/i, /personal data/i],
    system: { name: 'Customer Data Store', category: 'storage', riskLevel: 'critical' },
  },
  {
    patterns: [/financial data/i, /payment/i, /transaction/i, /\bpci\b/i],
    system: { name: 'Financial Data Store', category: 'storage', riskLevel: 'critical' },
  },
]

function detectSystems(description: string): DetectedSystem[] {
  const detected: DetectedSystem[] = []
  const seen = new Set<string>()

  for (const { patterns, system } of SYSTEM_PATTERNS) {
    if (patterns.some((p) => p.test(description)) && !seen.has(system.name)) {
      seen.add(system.name)

      // Infer data types from description
      const dataTypes: string[] = []
      if (/customer|user|personal|pii/i.test(description)) dataTypes.push('customer data')
      if (/financial|payment|transaction/i.test(description)) dataTypes.push('financial data')
      if (/health|medical|patient/i.test(description)) dataTypes.push('health data')

      detected.push({ ...system, dataTypes })
    }
  }

  return detected
}

// =============================================================================
// Regulation Matching
// =============================================================================

interface RegulationRule {
  regulation: string
  articleNumber: string
  title: string
  summary: string
  triggers: {
    industries?: string[]
    regions?: string[]
    systemCategories?: DetectedSystem['category'][]
    dataTypes?: string[]
    keywords?: RegExp[]
  }
}

const DORA_ARTICLES: RegulationRule[] = [
  {
    regulation: 'DORA',
    articleNumber: '5',
    title: 'ICT Risk Management Framework',
    summary:
      'Financial entities must have a comprehensive ICT risk management framework that includes strategies, policies, and procedures.',
    triggers: {
      industries: ['fintech', 'banking', 'insurance', 'investment'],
      regions: ['EU'],
      systemCategories: ['cloud', 'database', 'api'],
    },
  },
  {
    regulation: 'DORA',
    articleNumber: '6',
    title: 'ICT Systems and Tools',
    summary:
      'Financial entities shall use and maintain updated ICT systems that are reliable and have sufficient capacity.',
    triggers: {
      industries: ['fintech', 'banking', 'insurance'],
      regions: ['EU'],
      systemCategories: ['cloud', 'compute', 'api'],
    },
  },
  {
    regulation: 'DORA',
    articleNumber: '9',
    title: 'Protection and Prevention',
    summary:
      'Financial entities shall implement ICT security policies and measures to ensure data integrity, confidentiality, and availability.',
    triggers: {
      industries: ['fintech', 'banking'],
      regions: ['EU'],
      dataTypes: ['customer data', 'financial data'],
    },
  },
  {
    regulation: 'DORA',
    articleNumber: '10',
    title: 'Detection',
    summary:
      'Financial entities shall have mechanisms to promptly detect anomalous activities and ICT-related incidents.',
    triggers: {
      industries: ['fintech', 'banking'],
      regions: ['EU'],
      systemCategories: ['cloud', 'api', 'database'],
    },
  },
  {
    regulation: 'DORA',
    articleNumber: '11',
    title: 'Response and Recovery',
    summary:
      'Financial entities shall have a comprehensive ICT business continuity policy and disaster recovery plans.',
    triggers: {
      industries: ['fintech', 'banking'],
      regions: ['EU'],
      systemCategories: ['cloud', 'database'],
    },
  },
  {
    regulation: 'DORA',
    articleNumber: '12',
    title: 'Backup Policies',
    summary: 'Financial entities shall have policies for backup and restoration procedures for ICT systems and data.',
    triggers: {
      industries: ['fintech', 'banking'],
      regions: ['EU'],
      systemCategories: ['database', 'storage'],
    },
  },
  {
    regulation: 'DORA',
    articleNumber: '17',
    title: 'ICT-related Incident Reporting',
    summary:
      'Financial entities shall report major ICT-related incidents to competent authorities within specified timeframes.',
    triggers: {
      industries: ['fintech', 'banking', 'insurance'],
      regions: ['EU'],
      systemCategories: ['cloud', 'api', 'database'],
    },
  },
  {
    regulation: 'DORA',
    articleNumber: '28',
    title: 'Third-party ICT Service Providers',
    summary:
      'Financial entities shall manage ICT third-party risk and maintain registers of all contractual arrangements.',
    triggers: {
      industries: ['fintech', 'banking'],
      regions: ['EU'],
      keywords: [/\baws\b/i, /\bazure\b/i, /\bgcp\b/i, /cloud/i, /saas/i, /third.?party/i],
    },
  },
]

const GDPR_ARTICLES: RegulationRule[] = [
  {
    regulation: 'GDPR',
    articleNumber: '25',
    title: 'Data Protection by Design',
    summary: 'Implement appropriate technical and organisational measures for data protection from the design stage.',
    triggers: {
      regions: ['EU'],
      dataTypes: ['customer data'],
    },
  },
  {
    regulation: 'GDPR',
    articleNumber: '32',
    title: 'Security of Processing',
    summary:
      'Implement appropriate technical measures including encryption, pseudonymisation, and regular security testing.',
    triggers: {
      regions: ['EU'],
      dataTypes: ['customer data'],
      systemCategories: ['database', 'storage'],
    },
  },
  {
    regulation: 'GDPR',
    articleNumber: '33',
    title: 'Breach Notification',
    summary: 'Notify supervisory authority within 72 hours of becoming aware of a personal data breach.',
    triggers: {
      regions: ['EU'],
      dataTypes: ['customer data'],
    },
  },
]

function matchRegulations(profile: CompanyProfile, systems: DetectedSystem[]): ApplicableArticle[] {
  const allRules = [...DORA_ARTICLES, ...GDPR_ARTICLES]
  const matched: ApplicableArticle[] = []

  const systemCategories = new Set(systems.map((s) => s.category))
  const dataTypes = new Set(systems.flatMap((s) => s.dataTypes))

  // Infer industry from description
  const inferredIndustry =
    profile.industry ||
    (/fintech|financial|bank|payment|trading/i.test(profile.description)
      ? 'fintech'
      : /health|medical|patient/i.test(profile.description)
        ? 'healthcare'
        : 'technology')

  // Infer region
  const inferredRegion = profile.region || (/\beu\b|europe|gdpr|dora/i.test(profile.description) ? 'EU' : 'US')

  for (const rule of allRules) {
    let matches = false
    let relevance = ''

    // Check industry match
    if (rule.triggers.industries?.includes(inferredIndustry)) {
      matches = true
      relevance = `Your ${inferredIndustry} business requires compliance.`
    }

    // Check region match
    if (rule.triggers.regions?.includes(inferredRegion)) {
      matches = true
      relevance = relevance || `Operating in ${inferredRegion} requires compliance.`
    }

    // Check system categories
    if (rule.triggers.systemCategories?.some((c) => systemCategories.has(c))) {
      matches = true
      const matchedSystems = systems.filter((s) => rule.triggers.systemCategories?.includes(s.category))
      relevance = `Applies to your ${matchedSystems.map((s) => s.name).join(', ')}.`
    }

    // Check data types
    if (rule.triggers.dataTypes?.some((d) => dataTypes.has(d))) {
      matches = true
      relevance = `You process ${rule.triggers.dataTypes?.filter((d) => dataTypes.has(d)).join(', ')}.`
    }

    // Check keywords
    if (rule.triggers.keywords?.some((k) => k.test(profile.description))) {
      matches = true
      relevance = 'Detected relevant technology in your stack.'
    }

    if (matches) {
      matched.push({
        regulation: rule.regulation,
        articleNumber: rule.articleNumber,
        title: rule.title,
        summary: rule.summary,
        relevance,
        impactLevel: systems.some((s) => s.riskLevel === 'critical')
          ? 'critical'
          : systems.some((s) => s.riskLevel === 'high')
            ? 'high'
            : 'medium',
        affectedSystems: systems.map((s) => s.name),
      })
    }
  }

  return matched
}

// =============================================================================
// Gap Analysis
// =============================================================================

function identifyGaps(systems: DetectedSystem[], articles: ApplicableArticle[]): ComplianceGap[] {
  const gaps: ComplianceGap[] = []
  let gapId = 1

  // Cloud provider without documented controls
  if (systems.some((s) => s.category === 'cloud')) {
    gaps.push({
      id: `gap-${gapId++}`,
      article: 'DORA Art. 28',
      description: 'Third-party cloud provider risk assessment not documented',
      severity: 'high',
      recommendation: 'Document cloud provider due diligence and maintain ICT third-party register',
      estimatedEffort: 'days',
    })
  }

  // Database with customer data
  if (systems.some((s) => s.category === 'database' && s.dataTypes.includes('customer data'))) {
    gaps.push({
      id: `gap-${gapId++}`,
      article: 'DORA Art. 12',
      description: 'Database backup and recovery procedures not verified',
      severity: 'high',
      recommendation: 'Implement and test backup/restoration procedures with documented RTOs and RPOs',
      estimatedEffort: 'weeks',
    })

    gaps.push({
      id: `gap-${gapId++}`,
      article: 'GDPR Art. 32',
      description: 'Database encryption at rest not confirmed',
      severity: 'critical',
      recommendation: 'Enable encryption at rest for all databases containing personal data',
      estimatedEffort: 'days',
    })
  }

  // APIs without monitoring
  if (systems.some((s) => s.category === 'api')) {
    gaps.push({
      id: `gap-${gapId++}`,
      article: 'DORA Art. 10',
      description: 'API anomaly detection not implemented',
      severity: 'medium',
      recommendation: 'Implement real-time monitoring and anomaly detection for all API endpoints',
      estimatedEffort: 'weeks',
    })
  }

  // Any system requires incident response
  if (systems.length > 0) {
    gaps.push({
      id: `gap-${gapId++}`,
      article: 'DORA Art. 17',
      description: 'ICT incident classification and reporting process not defined',
      severity: 'high',
      recommendation: 'Establish incident classification criteria and reporting workflows to competent authorities',
      estimatedEffort: 'days',
    })

    gaps.push({
      id: `gap-${gapId++}`,
      article: 'DORA Art. 11',
      description: 'Business continuity plan not documented',
      severity: 'high',
      recommendation: 'Document and test ICT business continuity and disaster recovery plans',
      estimatedEffort: 'weeks',
    })
  }

  // Financial data requires extra controls
  if (systems.some((s) => s.dataTypes.includes('financial data'))) {
    gaps.push({
      id: `gap-${gapId++}`,
      article: 'DORA Art. 9',
      description: 'Financial data integrity controls not verified',
      severity: 'critical',
      recommendation: 'Implement integrity verification mechanisms for financial transaction data',
      estimatedEffort: 'weeks',
    })
  }

  return gaps
}

// =============================================================================
// Main Analysis Function
// =============================================================================

export async function runMagicDemo(profile: CompanyProfile): Promise<MagicDemoResult> {
  const startTime = Date.now()

  logger.info('Starting magic demo analysis', {
    descriptionLength: profile.description.length,
    industry: profile.industry,
    region: profile.region,
  })

  // Step 1: Detect systems from description
  const detectedSystems = detectSystems(profile.description)

  // Step 2: Match applicable regulations
  const applicableArticles = matchRegulations(profile, detectedSystems)

  // Step 3: Identify compliance gaps
  const complianceGaps = identifyGaps(detectedSystems, applicableArticles)

  // Step 4: Generate AI evidence summary
  let evidenceSummary = {
    executiveSummary: '',
    riskHighlights: [] as Array<{ area: string; level: string; description: string }>,
    immediateActions: [] as string[],
  }

  let tokensUsed = 0
  let confidence = 0.8

  try {
    const narrativeResult = await generateEvidenceNarrative({
      regulationName: 'DORA + GDPR',
      framework: 'Multi-regulatory',
      obligations: applicableArticles.map((a) => ({
        title: `${a.regulation} Art. ${a.articleNumber}: ${a.title}`,
        status: 'not_started',
        riskLevel: a.impactLevel,
        summary: a.summary,
      })),
      complianceRate: 0, // Starting fresh
      systemsImpacted: detectedSystems.map((s) => s.name),
      intendedAudience: 'internal',
    })

    evidenceSummary = {
      executiveSummary: narrativeResult.data.executiveSummary,
      riskHighlights: narrativeResult.data.riskHighlights.slice(0, 5).map((r) => ({
        area: r.area,
        level: r.level,
        description: r.description,
      })),
      immediateActions: narrativeResult.data.recommendations
        .filter((r) => r.priority === 'immediate')
        .slice(0, 5)
        .map((r) => r.action),
    }

    tokensUsed = narrativeResult.tokensUsed ?? 0
    confidence = narrativeResult.confidence ?? 0.8
  } catch (error) {
    logger.error('AI narrative generation failed in magic demo', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    // Fallback summary
    evidenceSummary = {
      executiveSummary: `Analysis identified ${detectedSystems.length} systems requiring compliance coverage under ${new Set(applicableArticles.map((a) => a.regulation)).size} regulations. ${complianceGaps.length} compliance gaps require immediate attention.`,
      riskHighlights: complianceGaps.slice(0, 3).map((g) => ({
        area: g.article,
        level: g.severity,
        description: g.description,
      })),
      immediateActions: complianceGaps
        .filter((g) => g.severity === 'critical' || g.severity === 'high')
        .slice(0, 5)
        .map((g) => g.recommendation),
    }
  }

  const analysisTimeMs = Date.now() - startTime

  // Record metrics for observability
  recordAICall(
    {
      operation: 'magicDemo',
      promptVersion: '1.0.0',
    },
    {
      model: 'claude-sonnet-4-20250514',
      inputTokens: Math.round(tokensUsed * 0.3),
      outputTokens: Math.round(tokensUsed * 0.7),
      latencyMs: analysisTimeMs,
      cached: false,
      success: true,
      confidenceScore: confidence,
    }
  )

  logger.info('Magic demo analysis complete', {
    analysisTimeMs,
    systemsDetected: detectedSystems.length,
    articlesMatched: applicableArticles.length,
    gapsIdentified: complianceGaps.length,
  })

  return {
    analysisTimeMs,
    timestamp: new Date().toISOString(),
    detectedSystems,
    applicableArticles,
    complianceGaps,
    evidenceSummary,
    metrics: {
      systemsAnalyzed: detectedSystems.length,
      articlesMatched: applicableArticles.length,
      gapsIdentified: complianceGaps.length,
      evidenceItemsGenerated: 1,
    },
    aiMetadata: {
      tokensUsed,
      model: 'claude-sonnet-4-20250514',
      confidence,
    },
  }
}

// =============================================================================
// Plan Recommendation
// =============================================================================

export interface PricingRecommendation {
  suggestedPlan: 'starter' | 'professional' | 'enterprise'
}

export function calculateOutcomePricing(metrics: MagicDemoResult['metrics']): PricingRecommendation {
  // Suggest plan based on complexity
  // - Enterprise: 10+ gaps or 15+ articles (complex compliance landscape)
  // - Professional: 5+ gaps or 8+ articles
  // - Starter: everything else
  let suggestedPlan: 'starter' | 'professional' | 'enterprise' = 'starter'

  if (metrics.gapsIdentified >= 10 || metrics.articlesMatched >= 15) {
    suggestedPlan = 'enterprise'
  } else if (metrics.gapsIdentified >= 5 || metrics.articlesMatched >= 8) {
    suggestedPlan = 'professional'
  }

  return { suggestedPlan }
}
