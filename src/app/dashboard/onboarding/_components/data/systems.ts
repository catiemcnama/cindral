/**
 * System Template Data for Onboarding
 */

import { CloudIcon, CpuIcon, DatabaseIcon, HardDriveIcon, NetworkIcon, ServerIcon, ShieldCheckIcon } from 'lucide-react'
import type { SystemCriticality, SystemTemplate } from './types'

export const SYSTEM_TEMPLATES: SystemTemplate[] = [
  {
    id: 'core-platform',
    name: 'Core Platform',
    description: 'Core transaction processing, policy admin, or account ledgers.',
    category: 'Core',
    criticality: 'core',
    icon: ServerIcon,
    tags: ['Ledger', 'Accounts', 'Transactions'],
  },
  {
    id: 'payments-gateway',
    name: 'Payments Gateway',
    description: 'Card issuing, payment routing, and settlement workflows.',
    category: 'Payments',
    criticality: 'core',
    icon: NetworkIcon,
    tags: ['Processing', 'Settlement', 'ISO 20022'],
  },
  {
    id: 'identity-access',
    name: 'Identity & Access',
    description: 'SSO, MFA, privileged access, and access review workflows.',
    category: 'Security',
    criticality: 'core',
    icon: ShieldCheckIcon,
    tags: ['IAM', 'MFA', 'Access reviews'],
  },
  {
    id: 'cloud-infrastructure',
    name: 'Cloud Infrastructure',
    description: 'Hosting, runtime environments, and infrastructure tooling.',
    category: 'Infrastructure',
    criticality: 'core',
    icon: CloudIcon,
    tags: ['AWS', 'Azure', 'GCP'],
  },
  {
    id: 'data-warehouse',
    name: 'Data Warehouse',
    description: 'Analytics, reporting, audit exports, and data governance.',
    category: 'Data',
    criticality: 'important',
    icon: DatabaseIcon,
    tags: ['BI', 'Reporting', 'Audit'],
  },
  {
    id: 'backup-recovery',
    name: 'Backup & Recovery',
    description: 'Disaster recovery, backups, and resilience tooling.',
    category: 'Resilience',
    criticality: 'important',
    icon: HardDriveIcon,
    tags: ['DR', 'RPO/RTO', 'Archival'],
  },
  {
    id: 'ai-platform',
    name: 'AI/ML Platform',
    description: 'Model training, inference services, and governance controls.',
    category: 'AI',
    criticality: 'support',
    icon: CpuIcon,
    tags: ['Model risk', 'Explainability'],
  },
]

export const CRITICALITY_LABELS: Record<SystemCriticality, string> = {
  core: 'Core',
  important: 'Important',
  support: 'Support',
}

export const CRITICALITY_STYLES: Record<SystemCriticality, string> = {
  core: 'border-emerald-400/40 text-emerald-600 dark:text-emerald-400',
  important: 'border-amber-400/40 text-amber-600 dark:text-amber-400',
  support: 'border-muted-foreground/40 text-muted-foreground',
}
