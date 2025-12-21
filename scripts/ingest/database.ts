/**
 * Database Operations for Regulatory Ingestion
 *
 * Inserts regulations, articles, and obligations into PostgreSQL via Drizzle
 */

import crypto from 'crypto'
import { eq, sql } from 'drizzle-orm'

import { db } from '../../src/db'
import { articles, obligations, regulations } from '../../src/db/schema'

import type { EnrichedArticle, RawRegulation } from './types'

/**
 * Upsert a regulation into the database
 */
export async function upsertRegulation(
  regulation: RawRegulation,
  opts: { ingestJobId?: string; organizationId: string }
): Promise<void> {
  const existing = await db.query.regulations.findFirst({
    where: eq(regulations.id, regulation.id),
  })

  if (existing) {
    await db
      .update(regulations)
      .set({
        name: regulation.name,
        slug: regulation.slug ?? regulation.id,
        framework: regulation.framework,
        version: regulation.version,
        fullTitle: regulation.fullTitle,
        jurisdiction: regulation.jurisdiction,
        effectiveDate: regulation.effectiveDate,
        lastUpdated: new Date(),
        ingestJobId: opts.ingestJobId ?? null,
        ingestTimestamp: new Date(),
      })
      .where(eq(regulations.id, regulation.id))
    console.log(`📝 Updated regulation: ${regulation.name}`)
  } else {
    await db.insert(regulations).values({
      id: regulation.id,
      name: regulation.name,
      slug: regulation.slug ?? regulation.id,
      framework: regulation.framework,
      version: regulation.version,
      fullTitle: regulation.fullTitle,
      jurisdiction: regulation.jurisdiction,
      effectiveDate: regulation.effectiveDate,
      organizationId: opts.organizationId,
      ingestJobId: opts.ingestJobId ?? null,
      ingestTimestamp: new Date(),
    })
    console.log(`➕ Inserted regulation: ${regulation.name}`)
  }
}

/**
 * Upsert an enriched article and its obligations
 */
export async function upsertArticle(
  article: EnrichedArticle,
  opts: { ingestJobId?: string; organizationId: string }
): Promise<{
  articleInserted: boolean
  obligationsInserted: number
}> {
  // Check if article exists
  const existing = await db.query.articles.findFirst({
    where: eq(articles.id, article.id),
  })

  const checksum = crypto
    .createHash('sha256')
    .update(article.rawText || article.aiSummary || '')
    .digest('hex')

  if (existing) {
    // Update existing article
    await db
      .update(articles)
      .set({
        articleNumber: article.articleNumber,
        sectionTitle: article.sectionTitle,
        title: article.title ?? article.sectionTitle,
        description: article.aiSummary, // Use AI summary as description
        rawText: article.rawText ?? article.fullText,
        normalizedText: article.normalizedText ?? null,
        aiSummary: article.aiSummary,
        ingestJobId: opts.ingestJobId ?? null,
        ingestTimestamp: new Date(),
        checksum,
        organizationId: opts.organizationId,
      })
      .where(eq(articles.id, article.id))
  } else {
    // Insert new article
    await db.insert(articles).values({
      id: article.id,
      regulationId: article.regulationId,
      organizationId: opts.organizationId,
      articleNumber: article.articleNumber,
      sectionTitle: article.sectionTitle,
      title: article.title ?? article.sectionTitle,
      rawText: article.rawText ?? article.fullText,
      normalizedText: article.normalizedText ?? null,
      description: article.aiSummary,
      aiSummary: article.aiSummary,
      ingestJobId: opts.ingestJobId ?? null,
      ingestTimestamp: new Date(),
      checksum,
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
        organizationId: opts.organizationId,
        title: obl.title,
        summary: obl.description,
        status: 'not_started',
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
  opts: { ingestJobId?: string; organizationId: string },
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
    const art = enrichedArticles[i]
    const res = await upsertArticle(art, opts)
    if (res.articleInserted) articlesInserted++
    else articlesUpdated++
    totalObligationsInserted += res.obligationsInserted
    if (onProgress) onProgress(i + 1, enrichedArticles.length)
  }

  return {
    articlesInserted,
    articlesUpdated,
    obligationsInserted: totalObligationsInserted,
  }
}

/**
 * Return simple counts for CLI status
 */
export async function getDatabaseSummary(): Promise<{ regulations: number; articles: number; obligations: number }> {
  const regs = await db.select({ count: sql<number>`count(*)` }).from(regulations)
  const arts = await db.select({ count: sql<number>`count(*)` }).from(articles)
  const obls = await db.select({ count: sql<number>`count(*)` }).from(obligations)

  return {
    regulations: Number(regs[0]?.count ?? 0),
    articles: Number(arts[0]?.count ?? 0),
    obligations: Number(obls[0]?.count ?? 0),
  }
}
