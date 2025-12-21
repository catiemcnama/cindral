import 'dotenv/config'
import { db } from '../src/db'
import { desc } from 'drizzle-orm'

async function main() {
  const rows = await db.query.ingestJobs.findMany({ orderBy: (j) => desc(j.startedAt) })
  console.log('ingest_jobs:')
  for (const r of rows) {
    console.log(
      JSON.stringify(
        {
          id: r.id,
          org: r.organizationId,
          source: r.source,
          status: r.status,
          startedAt: r.startedAt,
          finishedAt: r.finishedAt,
        },
        null,
        2
      )
    )
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
