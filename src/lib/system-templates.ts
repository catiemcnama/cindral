/**
 * System Templates Library
 *
 * Pre-configured system templates for common infrastructure patterns.
 * Used during onboarding to quickly add systems to map against regulations.
 */

import {
  BanknoteIcon,
  CloudIcon,
  CpuIcon,
  DatabaseIcon,
  GlobeIcon,
  HardDriveIcon,
  KeyIcon,
  LayoutDashboardIcon,
  LockIcon,
  MailIcon,
  MessageSquareIcon,
  NetworkIcon,
  ServerIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  type LucideIcon,
} from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

export type SystemCriticality = 'core' | 'important' | 'support'

export interface SystemTemplate {
  id: string
  name: string
  description: string
  category: SystemCategory
  criticality: SystemCriticality
  icon: LucideIcon
  tags: string[]
  /** Regulations this system commonly relates to */
  relatedRegulations?: string[]
}

export type SystemCategory =
  | 'Core Banking'
  | 'Payments'
  | 'Security'
  | 'Infrastructure'
  | 'Data'
  | 'Customer'
  | 'AI'
  | 'Resilience'
  | 'Communication'

// =============================================================================
// Template Categories
// =============================================================================

export const SYSTEM_CATEGORIES: { id: SystemCategory; label: string; description: string }[] = [
  { id: 'Core Banking', label: 'Core Banking', description: 'Transaction processing and account management' },
  { id: 'Payments', label: 'Payments', description: 'Payment processing and settlement' },
  { id: 'Security', label: 'Security', description: 'Identity, access, and security operations' },
  { id: 'Infrastructure', label: 'Infrastructure', description: 'Cloud platforms and hosting' },
  { id: 'Data', label: 'Data', description: 'Analytics, warehousing, and governance' },
  { id: 'Customer', label: 'Customer', description: 'Customer-facing applications' },
  { id: 'AI', label: 'AI & ML', description: 'Machine learning and AI systems' },
  { id: 'Resilience', label: 'Resilience', description: 'Backup, recovery, and business continuity' },
  { id: 'Communication', label: 'Communication', description: 'Email, messaging, and notifications' },
]

// =============================================================================
// System Templates
// =============================================================================

export const SYSTEM_TEMPLATES: SystemTemplate[] = [
  // Core Banking
  {
    id: 'core-banking-platform',
    name: 'Core Banking Platform',
    description: 'Central ledger system for accounts, transactions, and customer data.',
    category: 'Core Banking',
    criticality: 'core',
    icon: ServerIcon,
    tags: ['Ledger', 'Accounts', 'Transactions', 'Customer Data'],
    relatedRegulations: ['dora', 'basel-iii', 'gdpr'],
  },
  {
    id: 'loan-origination',
    name: 'Loan Origination System',
    description: 'Credit decisioning, underwriting, and loan lifecycle management.',
    category: 'Core Banking',
    criticality: 'core',
    icon: BanknoteIcon,
    tags: ['Credit', 'Underwriting', 'Risk Assessment'],
    relatedRegulations: ['basel-iii', 'gdpr'],
  },

  // Payments
  {
    id: 'payments-gateway',
    name: 'Payments Gateway',
    description: 'Card issuing, payment routing, and settlement workflows.',
    category: 'Payments',
    criticality: 'core',
    icon: NetworkIcon,
    tags: ['Processing', 'Settlement', 'ISO 20022'],
    relatedRegulations: ['dora', 'nis2'],
  },
  {
    id: 'card-management',
    name: 'Card Management System',
    description: 'Card issuance, lifecycle management, and fraud controls.',
    category: 'Payments',
    criticality: 'core',
    icon: BanknoteIcon,
    tags: ['Cards', 'Issuance', 'Fraud', 'PCI-DSS'],
    relatedRegulations: ['dora'],
  },

  // Security
  {
    id: 'identity-access',
    name: 'Identity & Access Management',
    description: 'SSO, MFA, privileged access, and access review workflows.',
    category: 'Security',
    criticality: 'core',
    icon: KeyIcon,
    tags: ['IAM', 'MFA', 'Access Reviews', 'PAM'],
    relatedRegulations: ['dora', 'nis2', 'gdpr'],
  },
  {
    id: 'siem',
    name: 'SIEM Platform',
    description: 'Security information and event management for threat detection.',
    category: 'Security',
    criticality: 'core',
    icon: ShieldCheckIcon,
    tags: ['Threat Detection', 'Logging', 'Alerting'],
    relatedRegulations: ['dora', 'nis2'],
  },
  {
    id: 'dlp',
    name: 'Data Loss Prevention',
    description: 'Content inspection and data exfiltration prevention.',
    category: 'Security',
    criticality: 'important',
    icon: LockIcon,
    tags: ['DLP', 'Content Inspection', 'Exfiltration'],
    relatedRegulations: ['gdpr', 'nis2'],
  },
  {
    id: 'endpoint-protection',
    name: 'Endpoint Protection',
    description: 'EDR, antivirus, and endpoint security controls.',
    category: 'Security',
    criticality: 'important',
    icon: ShieldCheckIcon,
    tags: ['EDR', 'Antivirus', 'Endpoint'],
    relatedRegulations: ['nis2'],
  },

  // Infrastructure
  {
    id: 'cloud-infrastructure',
    name: 'Cloud Infrastructure',
    description: 'Primary cloud platform (AWS, Azure, GCP) and infrastructure tooling.',
    category: 'Infrastructure',
    criticality: 'core',
    icon: CloudIcon,
    tags: ['AWS', 'Azure', 'GCP', 'IaC'],
    relatedRegulations: ['dora', 'nis2'],
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes Platform',
    description: 'Container orchestration and service mesh.',
    category: 'Infrastructure',
    criticality: 'important',
    icon: NetworkIcon,
    tags: ['K8s', 'Containers', 'Service Mesh'],
    relatedRegulations: ['dora'],
  },
  {
    id: 'serverless',
    name: 'Serverless Functions',
    description: 'Lambda/Cloud Functions for event-driven workloads.',
    category: 'Infrastructure',
    criticality: 'support',
    icon: ServerIcon,
    tags: ['Lambda', 'Functions', 'Event-Driven'],
    relatedRegulations: ['dora'],
  },

  // Data
  {
    id: 'data-warehouse',
    name: 'Data Warehouse',
    description: 'Analytics, reporting, audit exports, and data governance.',
    category: 'Data',
    criticality: 'important',
    icon: DatabaseIcon,
    tags: ['BI', 'Reporting', 'Audit', 'Analytics'],
    relatedRegulations: ['gdpr', 'basel-iii'],
  },
  {
    id: 'data-lake',
    name: 'Data Lake',
    description: 'Raw data storage for analytics and ML training.',
    category: 'Data',
    criticality: 'important',
    icon: DatabaseIcon,
    tags: ['Raw Data', 'ML Training', 'Parquet'],
    relatedRegulations: ['gdpr', 'ai-act'],
  },
  {
    id: 'bi-platform',
    name: 'BI Platform',
    description: 'Business intelligence dashboards and self-service analytics.',
    category: 'Data',
    criticality: 'support',
    icon: LayoutDashboardIcon,
    tags: ['Dashboards', 'Self-Service', 'Tableau', 'PowerBI'],
    relatedRegulations: ['basel-iii'],
  },

  // Customer
  {
    id: 'crm',
    name: 'CRM System',
    description: 'Customer relationship management and sales pipeline.',
    category: 'Customer',
    criticality: 'important',
    icon: MessageSquareIcon,
    tags: ['Salesforce', 'HubSpot', 'Customer Data'],
    relatedRegulations: ['gdpr'],
  },
  {
    id: 'mobile-app',
    name: 'Mobile Banking App',
    description: 'Customer-facing mobile application.',
    category: 'Customer',
    criticality: 'core',
    icon: SmartphoneIcon,
    tags: ['iOS', 'Android', 'Mobile'],
    relatedRegulations: ['dora', 'gdpr'],
  },
  {
    id: 'web-portal',
    name: 'Web Portal',
    description: 'Customer-facing web application.',
    category: 'Customer',
    criticality: 'core',
    icon: GlobeIcon,
    tags: ['Web', 'Portal', 'Customer'],
    relatedRegulations: ['dora', 'gdpr'],
  },

  // AI
  {
    id: 'ai-platform',
    name: 'AI/ML Platform',
    description: 'Model training, inference services, and governance controls.',
    category: 'AI',
    criticality: 'important',
    icon: CpuIcon,
    tags: ['Model Risk', 'Explainability', 'MLOps'],
    relatedRegulations: ['ai-act', 'gdpr'],
  },
  {
    id: 'llm-gateway',
    name: 'LLM Gateway',
    description: 'API gateway for LLM access with guardrails and monitoring.',
    category: 'AI',
    criticality: 'important',
    icon: CpuIcon,
    tags: ['LLM', 'GPT', 'Claude', 'Guardrails'],
    relatedRegulations: ['ai-act', 'gdpr'],
  },

  // Resilience
  {
    id: 'backup-recovery',
    name: 'Backup & Recovery',
    description: 'Disaster recovery, backups, and resilience tooling.',
    category: 'Resilience',
    criticality: 'core',
    icon: HardDriveIcon,
    tags: ['DR', 'RPO/RTO', 'Archival', 'Veeam'],
    relatedRegulations: ['dora', 'nis2'],
  },
  {
    id: 'incident-management',
    name: 'Incident Management',
    description: 'PagerDuty, Opsgenie, or similar for on-call and incidents.',
    category: 'Resilience',
    criticality: 'important',
    icon: ShieldCheckIcon,
    tags: ['Incidents', 'On-Call', 'PagerDuty'],
    relatedRegulations: ['dora', 'nis2'],
  },

  // Communication
  {
    id: 'email-platform',
    name: 'Email Platform',
    description: 'Corporate email and collaboration suite.',
    category: 'Communication',
    criticality: 'important',
    icon: MailIcon,
    tags: ['Email', 'Exchange', 'Google Workspace'],
    relatedRegulations: ['gdpr', 'nis2'],
  },
]

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: SystemCategory): SystemTemplate[] {
  return SYSTEM_TEMPLATES.filter((t) => t.category === category)
}

/**
 * Get templates recommended for an industry
 */
export function getTemplatesForIndustry(industry: string): SystemTemplate[] {
  const recommendations: Record<string, string[]> = {
    banking: [
      'core-banking-platform',
      'loan-origination',
      'payments-gateway',
      'identity-access',
      'data-warehouse',
      'backup-recovery',
    ],
    payments: ['payments-gateway', 'card-management', 'identity-access', 'cloud-infrastructure', 'backup-recovery'],
    insurance: ['core-banking-platform', 'identity-access', 'data-warehouse', 'crm', 'backup-recovery'],
    technology: ['cloud-infrastructure', 'kubernetes', 'identity-access', 'data-warehouse', 'ai-platform'],
    healthcare: ['identity-access', 'data-warehouse', 'dlp', 'email-platform', 'backup-recovery'],
    critical: ['cloud-infrastructure', 'identity-access', 'siem', 'backup-recovery', 'incident-management'],
    ai: ['ai-platform', 'llm-gateway', 'data-lake', 'identity-access', 'cloud-infrastructure'],
  }

  const ids = recommendations[industry] ?? []
  return SYSTEM_TEMPLATES.filter((t) => ids.includes(t.id))
}

/**
 * Get templates related to a regulation
 */
export function getTemplatesForRegulation(regulationId: string): SystemTemplate[] {
  return SYSTEM_TEMPLATES.filter((t) => t.relatedRegulations?.includes(regulationId))
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): SystemTemplate | undefined {
  return SYSTEM_TEMPLATES.find((t) => t.id === id)
}

/**
 * Get criticality display info
 */
export const CRITICALITY_CONFIG: Record<SystemCriticality, { label: string; color: string }> = {
  core: { label: 'Core', color: 'text-red-500 border-red-500/40' },
  important: { label: 'Important', color: 'text-amber-500 border-amber-500/40' },
  support: { label: 'Support', color: 'text-muted-foreground border-muted-foreground/40' },
}
