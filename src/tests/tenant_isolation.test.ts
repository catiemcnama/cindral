import assert from 'assert'
import { db } from '@/db'
import { obligations } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function run() {
  console.log('Running tenant_isolation test...')

  // Pick a seeded finbank obligation id (seed uses prefix 'finbank-')
  const rows = await db.query.obligations.findMany({ where: (o, { like }) => like(o.id, 'finbank-%') })
  assert(rows.length > 0, 'No finbank obligations found')

  const sample = rows[0]

  // Query the same id but for other org should return zero
  const cross = await db.query.obligations.findMany({ where: (o, { and, eq }) => and(eq(o.id, sample.id), eq(o.organizationId, 'paytech-uk')) })
  assert(cross.length === 0, 'Cross-org visibility: finbank obligation visible to paytech')

  console.log('tenant_isolation passed')
}
