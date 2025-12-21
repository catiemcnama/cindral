/**
 * Types for Regulatory Data Ingestion
 */

/**
 * Raw regulation metadata from official sources
 */
export interface RawRegulation {
  /** Unique identifier (e.g., 'dora', 'gdpr') */
  id: string
  /** Short display name (e.g., 'DORA') */
  name: string
  /** Full legal title */
  fullTitle: string
  /** Jurisdiction (e.g., 'European Union') */
  jurisdiction: string
  /** When the regulation becomes/became effective */
  effectiveDate: Date | null
  /** Source URL for provenance */
  sourceUrl: string
  /** EUR-Lex CELEX number for official reference */
  celexNumber?: string
}

/**
 * Raw article extracted from HTML
 */
export interface RawArticle {
  /** Unique identifier (e.g., 'dora-article-11') */
  id: string
  /** Parent regulation ID */
  regulationId: string
  /** Article number as displayed (e.g., 'Article 11', 'Article 11(1)') */
  articleNumber: string
  /** Section/chapter title if available */
  sectionTitle?: string
  /** Full legal text of the article */
  fullText: string
  /** Source URL for this specific article */
  sourceUrl?: string
}

/**
 * Article enriched with AI-generated content
 */
export interface EnrichedArticle extends RawArticle {
  /** AI-generated plain English summary */
  aiSummary: string
  /** AI-determined risk level */
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  /** AI-generated compliance obligations */
  obligations: {
    title: string
    description: string
  }[]
  /** Suggested system types this applies to */
  systemTypes: string[]
}

/**
 * EUR-Lex regulation sources with CELEX numbers
 */
export const EUR_LEX_SOURCES = {
  dora: {
    id: 'dora',
    name: 'DORA',
    fullTitle: 'Digital Operational Resilience Act',
    jurisdiction: 'European Union',
    celexNumber: '32022R2554',
    effectiveDate: new Date('2025-01-17'),
    sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2554',
  },
  gdpr: {
    id: 'gdpr',
    name: 'GDPR',
    fullTitle: 'General Data Protection Regulation',
    jurisdiction: 'European Union',
    celexNumber: '32016R0679',
    effectiveDate: new Date('2018-05-25'),
    sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679',
  },
  aiAct: {
    id: 'ai-act',
    name: 'AI Act',
    fullTitle: 'Artificial Intelligence Act',
    jurisdiction: 'European Union',
    celexNumber: '32024R1689',
    effectiveDate: new Date('2024-08-01'),
    sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32024R1689',
  },
  mica: {
    id: 'mica',
    name: 'MiCA',
    fullTitle: 'Markets in Crypto-Assets Regulation',
    jurisdiction: 'European Union',
    celexNumber: '32023R1114',
    effectiveDate: new Date('2024-12-30'),
    sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32023R1114',
  },
  nis2: {
    id: 'nis2',
    name: 'NIS2',
    fullTitle: 'Network and Information Security Directive 2',
    jurisdiction: 'European Union',
    celexNumber: '32022L2555',
    effectiveDate: new Date('2024-10-17'),
    sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022L2555',
  },
  psd2: {
    id: 'psd2',
    name: 'PSD2',
    fullTitle: 'Payment Services Directive 2',
    jurisdiction: 'European Union',
    celexNumber: '32015L2366',
    effectiveDate: new Date('2018-01-13'),
    sourceUrl: 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32015L2366',
  },
} as const

export type EurLexRegulationKey = keyof typeof EUR_LEX_SOURCES

/**
 * Ingestion run statistics
 */
export interface IngestionStats {
  regulationId: string
  articlesFound: number
  articlesProcessed: number
  articlesFailed: number
  obligationsGenerated: number
  tokensUsed: {
    inputTokens: number
    outputTokens: number
  }
  estimatedCost: number
  durationMs: number
}
