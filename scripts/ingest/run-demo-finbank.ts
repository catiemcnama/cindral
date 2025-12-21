#!/usr/bin/env tsx
import 'dotenv/config'
import { runIngestJob } from '../../src/lib/ingest'

async function main() {
  console.log('Running ingest demo for FinBank EU...')
  const res = await runIngestJob({ organizationId: 'finbank-eu', source: 'eur-lex', key: 'dora' })
  console.log('Ingest result:', res)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
