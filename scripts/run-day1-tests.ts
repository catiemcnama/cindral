#!/usr/bin/env tsx
import 'dotenv/config'
import { run as t1 } from '../src/tests/tenant_isolation.test'
import { run as t2 } from '../src/tests/ingest_pipeline.test'
import { run as t3 } from '../src/tests/audit_log.test'

async function main() {
  try {
    await t1()
    await t2()
    await t3()
    console.log('\nAll Day 1 tests passed')
    process.exit(0)
  } catch (e) {
    console.error('Day 1 tests failed', e)
    process.exit(1)
  }
}

main()
