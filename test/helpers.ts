import type { TenancyContext } from '@/lib/tenancy'

/**
 * Create a mock tenancy context for testing
 */
export function createTestContext(options: { userId?: string; orgId?: string; role?: string }): TenancyContext {
  return {
    activeOrganizationId: options.orgId ?? 'test-org',
    member: options.role ? { role: options.role } : null,
    user: options.userId ? { id: options.userId } : null,
  }
}

/**
 * Test organization IDs
 */
export const TEST_ORGS = {
  ORG_A: 'finbank-eu',
  ORG_B: 'paytech-uk',
} as const

/**
 * Test user IDs
 */
export const TEST_USERS = {
  ADMIN: 'finbank-admin',
  COMPLIANCE: 'finbank-comp',
  AUDITOR: 'finbank-auditor',
  VIEWER: 'finbank-viewer',
} as const

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, interval))
  }
  throw new Error('Timeout waiting for condition')
}
