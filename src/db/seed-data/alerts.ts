/**
 * Compliance Alerts Seed Data
 * Realistic alerts for demo scenarios
 */

export interface AlertSeed {
  id: string
  organizationId: string
  type: 'obligation_overdue' | 'regulation_changed' | 'evidence_pack_failed' | 'system_unmapped'
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in_triage' | 'in_progress' | 'resolved' | 'wont_fix'
  title: string
  description: string
  regulationRef?: string // Framework name
  obligationRef?: string // Obligation referenceCode
  systemRef?: string // System id
  assignedTo?: string // User id
  resolvedAt?: Date
  createdDaysAgo: number
}

export const ALERTS: AlertSeed[] = [
  // FinBank EU Alerts
  {
    id: 'finbank-eu-ALT-001',
    organizationId: 'finbank-eu',
    type: 'obligation_overdue',
    severity: 'critical',
    status: 'open',
    title: 'Third-party risk assessments overdue',
    description:
      'DORA Article 28 requires quarterly third-party risk assessments. Last assessment for cloud providers was completed 95 days ago. Immediate action required before regulatory deadline.',
    regulationRef: 'DORA',
    obligationRef: 'DORA-28-001',
    assignedTo: 'finbank-comp',
    createdDaysAgo: 5,
  },
  {
    id: 'finbank-eu-ALT-002',
    organizationId: 'finbank-eu',
    type: 'regulation_changed',
    severity: 'high',
    status: 'in_triage',
    title: 'New DORA technical standards published',
    description:
      'ESAs published final Regulatory Technical Standards (RTS) on ICT incident classification and reporting. Review required to assess impact on current incident management procedures.',
    regulationRef: 'DORA',
    assignedTo: 'finbank-auditor',
    createdDaysAgo: 3,
  },
  {
    id: 'finbank-eu-ALT-003',
    organizationId: 'finbank-eu',
    type: 'system_unmapped',
    severity: 'medium',
    status: 'open',
    title: 'Enterprise Data Lake has no DORA mappings',
    description:
      'The Enterprise Data Lake system has not been mapped to any DORA obligations. As a system processing customer data, it likely falls under multiple ICT risk management requirements.',
    systemRef: 'finbank-cloud-data-lake',
    regulationRef: 'DORA',
    createdDaysAgo: 12,
  },
  {
    id: 'finbank-eu-ALT-004',
    organizationId: 'finbank-eu',
    type: 'evidence_pack_failed',
    severity: 'low',
    status: 'resolved',
    title: 'GDPR evidence pack generation failed',
    description:
      'Evidence pack generation for GDPR Article 32 (Security of Processing) failed due to timeout when fetching system logs. Issue was transient - regeneration successful.',
    regulationRef: 'GDPR',
    resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdDaysAgo: 7,
  },
  {
    id: 'finbank-eu-ALT-005',
    organizationId: 'finbank-eu',
    type: 'obligation_overdue',
    severity: 'high',
    status: 'in_progress',
    title: 'Incident response procedure review overdue',
    description:
      'Annual review of ICT incident response procedures required by DORA Article 11 has not been completed. Last review was 14 months ago.',
    regulationRef: 'DORA',
    obligationRef: 'DORA-11-002',
    assignedTo: 'finbank-comp',
    createdDaysAgo: 20,
  },
  {
    id: 'finbank-eu-ALT-006',
    organizationId: 'finbank-eu',
    type: 'regulation_changed',
    severity: 'info',
    status: 'resolved',
    title: 'GDPR guidance updated for consent management',
    description:
      'EDPB issued updated guidelines on consent under GDPR. Review confirms current consent management system remains compliant.',
    regulationRef: 'GDPR',
    resolvedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    createdDaysAgo: 30,
  },

  // PayTech UK Alerts
  {
    id: 'paytech-uk-ALT-001',
    organizationId: 'paytech-uk',
    type: 'obligation_overdue',
    severity: 'critical',
    status: 'open',
    title: 'Digital resilience testing programme not established',
    description:
      'DORA Article 24 requires a comprehensive digital operational resilience testing programme. PayTech has not yet documented or implemented this programme.',
    regulationRef: 'DORA',
    obligationRef: 'DORA-24-001',
    assignedTo: 'paytech-comp',
    createdDaysAgo: 8,
  },
  {
    id: 'paytech-uk-ALT-002',
    organizationId: 'paytech-uk',
    type: 'system_unmapped',
    severity: 'high',
    status: 'in_triage',
    title: 'Settlement Engine missing obligation mappings',
    description:
      'The Settlement Engine is classified as critical but has only 2 obligation mappings. Similar systems typically require 10+ mappings for comprehensive coverage.',
    systemRef: 'paytech-settlement-engine',
    assignedTo: 'paytech-auditor',
    createdDaysAgo: 4,
  },
  {
    id: 'paytech-uk-ALT-003',
    organizationId: 'paytech-uk',
    type: 'regulation_changed',
    severity: 'medium',
    status: 'in_progress',
    title: 'PSD2 SCA exemptions updated',
    description:
      'FCA published updated guidance on Strong Customer Authentication exemptions. Review required to ensure Checkout API applies exemptions correctly.',
    regulationRef: 'PSD2',
    assignedTo: 'paytech-comp',
    createdDaysAgo: 15,
  },
  {
    id: 'paytech-uk-ALT-004',
    organizationId: 'paytech-uk',
    type: 'obligation_overdue',
    severity: 'medium',
    status: 'open',
    title: 'DPIA review for Fraud Engine overdue',
    description:
      'Data Protection Impact Assessment for the Risk & Fraud Engine ML model was due for annual review 30 days ago. GDPR Article 35 requires regular DPIA reviews for high-risk processing.',
    regulationRef: 'GDPR',
    obligationRef: 'GDPR-35-002',
    systemRef: 'paytech-fraud-engine',
    createdDaysAgo: 30,
  },
  {
    id: 'paytech-uk-ALT-005',
    organizationId: 'paytech-uk',
    type: 'evidence_pack_failed',
    severity: 'low',
    status: 'wont_fix',
    title: 'Archived evidence pack link expired',
    description:
      'Download link for Q2 2024 GDPR Article 32 evidence pack has expired. Evidence has been superseded by Q3 pack - no action needed.',
    regulationRef: 'GDPR',
    createdDaysAgo: 45,
  },
]

export function getAlertsForOrganization(orgId: string): AlertSeed[] {
  return ALERTS.filter((a) => a.organizationId === orgId)
}
