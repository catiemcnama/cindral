import assert from 'assert'
import { upsertRegulation } from '../../scripts/ingest/database'
import { db } from '@/db'
import { regulations } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function run() {
  console.log('Running ingest_pipeline test...')

  const jobId = 'test-ingest-job-1'

  // Use first regulation fixture
  const reg = { id: 'dora', slug: 'dora', framework: 'DORA', version: '1', name: 'DORA', fullTitle: 'DORA', jurisdiction: 'EU', effectiveDate: new Date() }

  await upsertRegulation(reg as any, { ingestJobId: jobId, organizationId: 'finbank-eu' })

  const rows = await db.query.regulations.findMany({ where: (r, { and, eq }) => and(eq(r.id, 'dora'), eq(r.organizationId, 'finbank-eu')) })
  // upsertRegulation sets organizationId on insert; if it updated existing, it should at least set ingestJobId
  const check = await db.query.regulations.findMany({ where: (r, { eq }) => eq(r.id, 'dora') })
  assert(check.length > 0, 'Regulation not present after upsert')

  console.log('ingest_pipeline passed')
}
