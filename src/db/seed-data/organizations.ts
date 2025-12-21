/**
 * Organization and User Seed Data
 * Fixed, deterministic data for dev and demo environments
 */

// =============================================================================
// Organizations
// =============================================================================

export interface OrganizationSeed {
  id: string
  name: string
  slug: string
  metadata: {
    primary_jurisdiction: string
    industry: string
    size_band: 'small' | 'medium' | 'large' | 'enterprise'
    risk_appetite: 'conservative' | 'moderate' | 'aggressive'
    frameworks: string[]
    employee_count?: number
    annual_revenue?: string
  }
}

export const ORGANIZATIONS: OrganizationSeed[] = [
  {
    id: 'finbank-eu',
    name: 'FinBank EU',
    slug: 'finbank-eu',
    metadata: {
      primary_jurisdiction: 'EU',
      industry: 'banking',
      size_band: 'large',
      risk_appetite: 'moderate',
      frameworks: ['DORA', 'GDPR', 'PSD2'],
      employee_count: 2500,
      annual_revenue: '€1.2B',
    },
  },
  {
    id: 'paytech-uk',
    name: 'PayTech UK',
    slug: 'paytech-uk',
    metadata: {
      primary_jurisdiction: 'UK',
      industry: 'payments',
      size_band: 'medium',
      risk_appetite: 'conservative',
      frameworks: ['DORA', 'GDPR'],
      employee_count: 450,
      annual_revenue: '£85M',
    },
  },
]

// =============================================================================
// Users
// =============================================================================

export interface UserSeed {
  id: string
  name: string
  email: string
  organizationId: string
  role: 'OrgAdmin' | 'ComplianceManager' | 'Auditor' | 'Viewer' | 'BillingAdmin'
  // For demo login purposes - NOT for production
  demoPassword?: string
}

export const USERS: UserSeed[] = [
  // FinBank EU users
  {
    id: 'finbank-admin',
    name: 'Elena Kowalski',
    email: 'elena.kowalski@finbank.eu',
    organizationId: 'finbank-eu',
    role: 'OrgAdmin',
    demoPassword: 'demo-admin-2024',
  },
  {
    id: 'finbank-comp',
    name: 'Marcus Chen',
    email: 'marcus.chen@finbank.eu',
    organizationId: 'finbank-eu',
    role: 'ComplianceManager',
    demoPassword: 'demo-comp-2024',
  },
  {
    id: 'finbank-auditor',
    name: 'Sofia Andersson',
    email: 'sofia.andersson@finbank.eu',
    organizationId: 'finbank-eu',
    role: 'Auditor',
    demoPassword: 'demo-audit-2024',
  },
  {
    id: 'finbank-viewer',
    name: 'James Murphy',
    email: 'james.murphy@finbank.eu',
    organizationId: 'finbank-eu',
    role: 'Viewer',
    demoPassword: 'demo-view-2024',
  },

  // PayTech UK users
  {
    id: 'paytech-admin',
    name: 'Oliver Williams',
    email: 'oliver.williams@paytech.co.uk',
    organizationId: 'paytech-uk',
    role: 'OrgAdmin',
    demoPassword: 'demo-admin-2024',
  },
  {
    id: 'paytech-comp',
    name: 'Emma Thompson',
    email: 'emma.thompson@paytech.co.uk',
    organizationId: 'paytech-uk',
    role: 'ComplianceManager',
    demoPassword: 'demo-comp-2024',
  },
  {
    id: 'paytech-auditor',
    name: 'Amir Patel',
    email: 'amir.patel@paytech.co.uk',
    organizationId: 'paytech-uk',
    role: 'Auditor',
    demoPassword: 'demo-audit-2024',
  },
  {
    id: 'paytech-viewer',
    name: 'Charlotte Davies',
    email: 'charlotte.davies@paytech.co.uk',
    organizationId: 'paytech-uk',
    role: 'Viewer',
    demoPassword: 'demo-view-2024',
  },
]

// =============================================================================
// Helper Functions
// =============================================================================

export function getUsersForOrganization(orgId: string): UserSeed[] {
  return USERS.filter((u) => u.organizationId === orgId)
}

export function getOrganization(orgId: string): OrganizationSeed | undefined {
  return ORGANIZATIONS.find((o) => o.id === orgId)
}
