import assert from 'assert'
import { recordAudit } from '@/lib/audit'
import { db } from '@/db'
import { auditLog } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function run() {
  console.log('Running audit_log test...')

  const ctx = { activeOrganizationId: 'finbank-eu', user: { id: 'finbank-admin' } }

  await recordAudit({ ctx, action: 'test_create', entityType: 'obligation', entityId: 'test-1', before: null, after: { foo: 'bar' } })

  const rows = await db.query.auditLog.findMany({ where: (a, { eq }) => eq(a.action, 'test_create') })
  assert(rows.length > 0, 'Audit log row not written')

  console.log('audit_log passed')
}
