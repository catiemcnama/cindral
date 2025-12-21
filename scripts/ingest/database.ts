/**
 * Database Operations for Regulatory Ingestion
 *
 * Inserts regulations, articles, and obligations into PostgreSQL via Drizzle
 */

import { eq } from 'drizzle-orm'

import { db } from '../../src/db'
import { articles, obligations, regulations } from '../../src/db/schema'

import type { EnrichedArticle, RawRegulation } from './types'

/**
 * Upsert a regulation into the database
 */
export async function upsertRegulation(regulation: RawRegulation): Promise<void> {
  const existing = await db.query.regulations.findFirst({
    where: eq(regulations.id, regulation.id),
  })

  if (existing) {
    await db
      .update(regulations)
      .set({
        name: regulation.name,
        fullTitle: regulation.fullTitle,
        jurisdiction: regulation.jurisdiction,
        effectiveDate: regulation.effectiveDate,
        lastUpdated: new Date(),
      })
      .where(eq(regulations.id, regulation.id))
    console.log(`📝 Updated regulation: ${regulation.name}`)
  } else {
    await db.insert(regulations).values({
      id: regulation.id,
      name: regulation.name,
      fullTitle: regulation.fullTitle,
      jurisdiction: regulation.jurisdiction,
      effectiveDate: regulation.effectiveDate,
      // No organizationId for global regulations
    })
    console.log(`➕ Inserted regulation: ${regulation.name}`)
  }
}

/**
 * Upsert an enriched article and its obligations
 */
export async function upsertArticle(article: EnrichedArticle): Promise<{
  articleInserted: boolean
  obligationsInserted: number
}> {
  // Check if article exists
  const existing = await db.query.articles.findFirst({
    where: eq(articles.id, article.id),
  })

  if (existing) {
    // Update existing article
    await db
      .update(articles)
      .set({
        articleNumber: article.articleNumber,
        sectionTitle: article.sectionTitle,
        description: article.aiSummary, // Use AI summary as description
        fullText: article.fullText,
        riskLevel: article.riskLevel,
        aiSummary: article.aiSummary,
      })
      .where(eq(articles.id, article.id))
  } else {
    // Insert new article
    await db.insert(articles).values({
      id: article.id,
      regulationId: article.regulationId,
      articleNumber: article.articleNumber,
      sectionTitle: article.sectionTitle,
      description: article.aiSummary,
      fullText: article.fullText,
      riskLevel: article.riskLevel,
      aiSummary: article.aiSummary,
    })
  }

  // Handle obligations
  // First, check existing obligations for this article
  const existingObligations = await db.query.obligations.findMany({
    where: eq(obligations.articleId, article.id),
  })

  let obligationsInserted = 0

  // Insert new obligations
  for (let i = 0; i < article.obligations.length; i++) {
    const obl = article.obligations[i]
    const oblId = `OBL-${article.id}-${String(i + 1).padStart(3, '0')}`

    // Check if this obligation already exists
    const existingObl = existingObligations.find((e) => e.id === oblId)

    if (!existingObl) {
      await db.insert(obligations).values({
        id: oblId,
        articleId: article.id,
        title: obl.title,
        description: obl.description,
        status: 'pending',
        // No organizationId for global obligations - they're templates
      })
      obligationsInserted++
    }
  }

  return {
    articleInserted: !existing,
    obligationsInserted,
  }
}

/**
 * Batch upsert articles with progress reporting
 */
export async function batchUpsertArticles(
  enrichedArticles: EnrichedArticle[],
  onProgress?: (completed: number, total: number) => void
): Promise<{
  articlesInserted: number
  articlesUpdated: number
  obligationsInserted: number
}> {
  let articlesInserted = 0
  let articlesUpdated = 0
  let totalObligationsInserted = 0

  for (let i = 0; i < enrichedArticles.length; i++) {
    const article = enrichedArticles[i]

    try {
      const result = await upsertArticle(article)

      if (result.articleInserted) {
        articlesInserted++
      } else {
        articlesUpdated++
      }
      totalObligationsInserted += result.obligationsInserted

      if (onProgress) {
        onProgress(i + 1, enrichedArticles.length)
      }
    } catch (error) {
      console.error(`❌ Failed to upsert article ${article.id}:`, error)
    }
  }

  return {
    articlesInserted,
    articlesUpdated,
    obligationsInserted: totalObligationsInserted,
  }
}

/**
 * Get summary of current database contents
 */
export async function getDatabaseSummary(): Promise<{
  regulations: number
  articles: number
  obligations: number
}> {
  const allRegulations = await db.query.regulations.findMany()
  const allArticles = await db.query.articles.findMany()
  const allObligations = await db.query.obligations.findMany()

  return {
    regulations: allRegulations.length,
    articles: allArticles.length,
    obligations: allObligations.length,
  }
}
