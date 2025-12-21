import { db } from '@/db'
import { articles, ingestJobs, obligations, regulations } from '@/db/schema'
import crypto from 'crypto'
import { and, eq } from 'drizzle-orm'
import type { EurLexRegulationKey } from '../../scripts/ingest/types'

export interface IngestJobOptions {
  organizationId: string
  source: 'eur-lex' | 'manual-upload' | 'api'
  key?: EurLexRegulationKey
  sourceUrl?: string
}

export interface IngestJobResult {
  jobId: string
  status: 'succeeded' | 'failed' | 'partial'
  regulationsCreated: number
  articlesCreated: number
  obligationsCreated: number
  error?: string
}

/**
 * Run an ingest job for an organization
 *
 * Creates ingest_job record, fetches data, and populates
 * regulations, articles, and obligations with proper provenance
 */
export async function runIngestJob(options: IngestJobOptions): Promise<IngestJobResult> {
  const { organizationId, source, key, sourceUrl } = options
  const jobId = crypto.randomUUID()

  // Create ingest job record
  await db.insert(ingestJobs).values({
    id: jobId,
    organizationId,
    source,
    sourceUrl: sourceUrl ?? null,
    status: 'running',
    startedAt: new Date(),
  })

  try {
    // Import ingest helpers dynamically to avoid build issues
    const { fetchRegulation } = await import('../../scripts/ingest/eurlex')
    const { processArticlesBatch } = await import('../../scripts/ingest/claude')

    // Fetch regulation from source
    const { regulation, articles: rawArticles } = await fetchRegulation(key ?? 'dora')

    const framework = regulation.framework ?? key ?? 'unknown'

    // Check if regulation already exists for this org
    const existingReg = await db.query.regulations.findFirst({
      where: and(
        eq(regulations.organizationId, organizationId),
        eq(regulations.framework, framework),
        eq(regulations.version, regulation.version ?? '1.0')
      ),
    })

    let regulationId: string
    let regsCreated = 0

    if (existingReg) {
      // Update existing regulation
      regulationId = existingReg.id
      await db
        .update(regulations)
        .set({
          name: regulation.name,
          fullTitle: regulation.fullTitle,
          jurisdiction: regulation.jurisdiction,
          effectiveDate: regulation.effectiveDate,
          lastUpdated: new Date(),
          ingestJobId: jobId,
          ingestTimestamp: new Date(),
          sourceUrl: sourceUrl ?? regulation.sourceUrl,
          sourceType: source,
        })
        .where(eq(regulations.id, regulationId))
    } else {
      // Create new regulation with org-specific ID
      regulationId = `${organizationId}-${regulation.id}`
      await db.insert(regulations).values({
        id: regulationId,
        organizationId,
        name: regulation.name,
        slug: regulation.slug ?? regulation.id,
        framework,
        version: regulation.version ?? '1.0',
        fullTitle: regulation.fullTitle,
        jurisdiction: regulation.jurisdiction,
        effectiveDate: regulation.effectiveDate,
        status: 'active',
        sourceUrl: sourceUrl ?? regulation.sourceUrl,
        sourceType: source,
        ingestJobId: jobId,
        ingestTimestamp: new Date(),
      })
      regsCreated = 1
    }

    // Process articles with Claude for AI summaries
    const { enriched } = await processArticlesBatch(rawArticles, regulation.name, {
      concurrency: 2,
    })

    let artsCreated = 0
    let oblsCreated = 0

    // Upsert articles
    for (const art of enriched) {
      const articleId = `${regulationId}-${art.articleNumber.replace(/\s+/g, '-').toLowerCase()}`
      const checksum = crypto
        .createHash('sha256')
        .update(art.rawText || art.aiSummary || '')
        .digest('hex')

      const existingArt = await db.query.articles.findFirst({
        where: and(eq(articles.id, articleId), eq(articles.organizationId, organizationId)),
      })

      if (existingArt) {
        // Skip if checksum matches (idempotency)
        if (existingArt.checksum === checksum) {
          continue
        }
        // Update
        await db
          .update(articles)
          .set({
            title: art.sectionTitle || art.title,
            rawText: art.rawText || art.fullText,
            aiSummary: art.aiSummary,
            checksum,
            ingestJobId: jobId,
            ingestTimestamp: new Date(),
          })
          .where(eq(articles.id, articleId))
      } else {
        // Insert
        await db.insert(articles).values({
          id: articleId,
          organizationId,
          regulationId,
          articleNumber: art.articleNumber,
          sectionTitle: art.sectionTitle,
          title: art.sectionTitle || art.title,
          rawText: art.rawText || art.fullText,
          aiSummary: art.aiSummary,
          checksum,
          ingestJobId: jobId,
          ingestTimestamp: new Date(),
          reviewStatus: 'pending',
        })
        artsCreated++
      }

      // Upsert obligations from article
      for (let i = 0; i < art.obligations.length; i++) {
        const obl = art.obligations[i]
        const oblId = `OBL-${articleId}-${String(i + 1).padStart(3, '0')}`
        const oblChecksum = crypto
          .createHash('sha256')
          .update(obl.title + obl.description)
          .digest('hex')

        const existingObl = await db.query.obligations.findFirst({
          where: and(eq(obligations.id, oblId), eq(obligations.organizationId, organizationId)),
        })

        if (!existingObl) {
          await db.insert(obligations).values({
            id: oblId,
            organizationId,
            regulationId,
            articleId,
            title: obl.title,
            summary: obl.description,
            status: 'not_started',
            sourceType: 'llm',
            ingestJobId: jobId,
            ingestTimestamp: new Date(),
            checksum: oblChecksum,
          })
          oblsCreated++
        }
      }
    }

    // Update job status to succeeded
    await db
      .update(ingestJobs)
      .set({
        status: 'succeeded',
        finishedAt: new Date(),
        log: JSON.stringify({
          regulationsCreated: regsCreated,
          articlesCreated: artsCreated,
          obligationsCreated: oblsCreated,
        }),
      })
      .where(eq(ingestJobs.id, jobId))

    return {
      jobId,
      status: 'succeeded',
      regulationsCreated: regsCreated,
      articlesCreated: artsCreated,
      obligationsCreated: oblsCreated,
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err)

    // Update job status to failed
    await db
      .update(ingestJobs)
      .set({
        status: 'failed',
        finishedAt: new Date(),
        errorMessage,
      })
      .where(eq(ingestJobs.id, jobId))

    return {
      jobId,
      status: 'failed',
      regulationsCreated: 0,
      articlesCreated: 0,
      obligationsCreated: 0,
      error: errorMessage,
    }
  }
}

/**
 * Get ingest job status
 */
export async function getIngestJobStatus(jobId: string) {
  return db.query.ingestJobs.findFirst({
    where: eq(ingestJobs.id, jobId),
  })
}

/**
 * List ingest jobs for an organization
 */
export async function listIngestJobs(organizationId: string, limit = 10) {
  return db.query.ingestJobs.findMany({
    where: eq(ingestJobs.organizationId, organizationId),
    orderBy: (jobs, { desc }) => desc(jobs.startedAt),
    limit,
  })
}
