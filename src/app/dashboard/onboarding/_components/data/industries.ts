/**
 * Industry Data for Onboarding
 */

import {
  BanknoteIcon,
  Building2Icon,
  CloudIcon,
  CpuIcon,
  FactoryIcon,
  HeartPulseIcon,
  ShieldCheckIcon,
} from 'lucide-react'
import type { Industry } from './types'

export const INDUSTRIES: Industry[] = [
  {
    id: 'banking',
    name: 'Banking & Capital Markets',
    description: 'Retail, investment, and commercial banking',
    icon: Building2Icon,
  },
  {
    id: 'payments',
    name: 'Payments & Fintech',
    description: 'Issuers, processors, wallets, and PSPs',
    icon: BanknoteIcon,
  },
  {
    id: 'insurance',
    name: 'Insurance',
    description: 'Life, P&C, specialty, and reinsurance',
    icon: ShieldCheckIcon,
  },
  {
    id: 'technology',
    name: 'SaaS & Cloud',
    description: 'Cloud platforms, SaaS, data processors',
    icon: CloudIcon,
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Life Sciences',
    description: 'Providers, payers, medtech, biotech',
    icon: HeartPulseIcon,
  },
  {
    id: 'critical',
    name: 'Critical Infrastructure',
    description: 'Energy, telecom, transport, utilities',
    icon: FactoryIcon,
  },
  {
    id: 'ai',
    name: 'AI & Data Products',
    description: 'Model providers, AI features, analytics',
    icon: CpuIcon,
  },
]

/**
 * Maps industry ID to recommended regulation IDs
 */
export const INDUSTRY_REGULATION_MAP: Record<string, string[]> = {
  banking: ['dora', 'basel-iii', 'gdpr', 'nis2'],
  payments: ['dora', 'gdpr', 'nis2'],
  insurance: ['dora', 'gdpr', 'nis2'],
  technology: ['gdpr', 'nis2', 'ai-act'],
  healthcare: ['gdpr', 'nis2', 'ai-act'],
  critical: ['nis2', 'gdpr'],
  ai: ['ai-act', 'gdpr', 'nis2'],
}

/**
 * Maps industry ID to recommended system template IDs
 */
export const INDUSTRY_SYSTEM_MAP: Record<string, string[]> = {
  banking: ['core-platform', 'payments-gateway', 'identity-access', 'data-warehouse', 'backup-recovery'],
  payments: ['payments-gateway', 'identity-access', 'cloud-infrastructure', 'data-warehouse', 'backup-recovery'],
  insurance: ['core-platform', 'identity-access', 'data-warehouse', 'backup-recovery'],
  technology: ['cloud-infrastructure', 'identity-access', 'data-warehouse', 'backup-recovery'],
  healthcare: ['identity-access', 'data-warehouse', 'backup-recovery'],
  critical: ['cloud-infrastructure', 'identity-access', 'backup-recovery'],
  ai: ['ai-platform', 'identity-access', 'cloud-infrastructure', 'data-warehouse'],
}
