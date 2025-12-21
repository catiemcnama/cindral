import { db } from '@/db'
import { ingestJobs } from '@/db/schema'
import crypto from 'crypto'
import { eq } from 'drizzle-orm'
import { fetchRegulation } from '../../scripts/ingest/eurlex'
import { processArticlesBatch } from '../../scripts/ingest/claude'
import { upsertRegulation, batchUpsertArticles } from '../../scripts/ingest/database'

export async function runIngestJob({ organizationId, source, key, sourceUrl }: any) {
  const jobId = crypto.randomUUID()

  await db.insert(ingestJobs).values({
    id: jobId,
    organizationId,
    source,
    sourceUrl: sourceUrl ?? null,
    status: 'running',
    startedAt: new Date(),
  })

  try {
    const { regulation, articles } = await fetchRegulation(key)

    await upsertRegulation(regulation, { ingestJobId: jobId, organizationId })

    const { enriched } = await processArticlesBatch(articles, regulation.name, { concurrency: 2 })

    const dbResult = await batchUpsertArticles(enriched, async () => {})

    await db.update(ingestJobs).set({ status: 'succeeded', finishedAt: new Date() }).where(eq(ingestJobs.id, jobId))

    return { jobId, dbResult }
  } catch (err: any) {
    await db.update(ingestJobs).set({ status: 'failed', finishedAt: new Date(), errorMessage: String(err) }).where(eq(ingestJobs.id, jobId))
    throw err
  }
}
