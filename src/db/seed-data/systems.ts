/**
 * IT Systems Seed Data
 * Realistic enterprise systems for compliance mapping
 */

export interface SystemSeed {
  id: string
  organizationId: string
  name: string
  description: string
  category: string
  criticality: 'critical' | 'high' | 'medium' | 'low'
  owner?: string // User name
  vendor?: string
  version?: string
  tags: string[]
  externalId?: string // CMDB reference
  metadata?: {
    dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted'
    personalData?: boolean
    cloudProvider?: string
    deploymentModel?: 'on-premise' | 'cloud' | 'hybrid'
    backupFrequency?: string
  }
}

export const SYSTEMS: Record<string, SystemSeed[]> = {
  'finbank-eu': [
    {
      id: 'finbank-core-banking',
      organizationId: 'finbank-eu',
      name: 'CoreBanking Platform',
      description:
        'Central banking platform handling account management, transactions, and customer data. Mission-critical system with 99.99% SLA.',
      category: 'core banking',
      criticality: 'critical',
      owner: 'Elena Kowalski',
      vendor: 'Temenos',
      version: 'T24 R21',
      tags: ['core', 'payments', 'accounts', 'tier-1'],
      externalId: 'CMDB-FIN-001',
      metadata: {
        dataClassification: 'restricted',
        personalData: true,
        deploymentModel: 'hybrid',
        backupFrequency: 'continuous',
      },
    },
    {
      id: 'finbank-payments-switch',
      organizationId: 'finbank-eu',
      name: 'PaymentsSwitch',
      description:
        'Real-time payment routing and clearing system. Handles SEPA, SWIFT, and instant payments processing.',
      category: 'payments',
      criticality: 'critical',
      owner: 'Marcus Chen',
      vendor: 'FIS',
      version: 'ISO20022 v3.2',
      tags: ['payments', 'sepa', 'swift', 'iso20022'],
      externalId: 'CMDB-FIN-002',
      metadata: {
        dataClassification: 'restricted',
        personalData: true,
        deploymentModel: 'on-premise',
        backupFrequency: 'hourly',
      },
    },
    {
      id: 'finbank-customer-portal',
      organizationId: 'finbank-eu',
      name: 'Digital Banking Portal',
      description:
        'Customer-facing web and mobile banking application. Provides account access, transfers, and self-service features.',
      category: 'customer facing',
      criticality: 'high',
      owner: 'James Murphy',
      vendor: 'In-house',
      version: '4.5.2',
      tags: ['digital', 'customer', 'mobile', 'web'],
      externalId: 'CMDB-FIN-003',
      metadata: {
        dataClassification: 'confidential',
        personalData: true,
        cloudProvider: 'AWS',
        deploymentModel: 'cloud',
        backupFrequency: 'daily',
      },
    },
    {
      id: 'finbank-cloud-data-lake',
      organizationId: 'finbank-eu',
      name: 'Enterprise Data Lake',
      description:
        'Centralized data repository for analytics, reporting, and ML workloads. Contains aggregated customer and transaction data.',
      category: 'data',
      criticality: 'high',
      owner: 'Sofia Andersson',
      vendor: 'Databricks',
      version: 'Runtime 14.0',
      tags: ['data', 'analytics', 'ml', 'reporting'],
      externalId: 'CMDB-FIN-004',
      metadata: {
        dataClassification: 'restricted',
        personalData: true,
        cloudProvider: 'Azure',
        deploymentModel: 'cloud',
        backupFrequency: 'daily',
      },
    },
    {
      id: 'finbank-fraud-detection',
      organizationId: 'finbank-eu',
      name: 'Fraud Detection Engine',
      description:
        'Real-time transaction monitoring and fraud scoring system using ML models. Integrated with payments switch.',
      category: 'security',
      criticality: 'critical',
      owner: 'Marcus Chen',
      vendor: 'FICO',
      version: 'Falcon v11',
      tags: ['fraud', 'security', 'ml', 'monitoring'],
      externalId: 'CMDB-FIN-005',
      metadata: {
        dataClassification: 'restricted',
        personalData: true,
        deploymentModel: 'hybrid',
        backupFrequency: 'continuous',
      },
    },
    {
      id: 'finbank-id-verification',
      organizationId: 'finbank-eu',
      name: 'Identity Verification Service',
      description:
        'KYC and AML verification service for customer onboarding. Integrates with external identity providers.',
      category: 'compliance',
      criticality: 'high',
      owner: 'Sofia Andersson',
      vendor: 'Onfido',
      version: 'API v3.6',
      tags: ['kyc', 'aml', 'identity', 'compliance'],
      externalId: 'CMDB-FIN-006',
      metadata: {
        dataClassification: 'restricted',
        personalData: true,
        cloudProvider: 'AWS',
        deploymentModel: 'cloud',
        backupFrequency: 'daily',
      },
    },
  ],
  'paytech-uk': [
    {
      id: 'paytech-checkout-api',
      organizationId: 'paytech-uk',
      name: 'Checkout API',
      description:
        'Primary payment gateway API for merchant integrations. Handles card processing, 3DS, and alternative payment methods.',
      category: 'payments',
      criticality: 'critical',
      owner: 'Oliver Williams',
      vendor: 'In-house',
      version: 'v2.4.0',
      tags: ['api', 'payments', 'gateway', 'merchants'],
      externalId: 'CMDB-PAY-001',
      metadata: {
        dataClassification: 'restricted',
        personalData: true,
        cloudProvider: 'GCP',
        deploymentModel: 'cloud',
        backupFrequency: 'continuous',
      },
    },
    {
      id: 'paytech-fraud-engine',
      organizationId: 'paytech-uk',
      name: 'Risk & Fraud Engine',
      description:
        'ML-powered transaction risk scoring and fraud prevention. Evaluates every transaction in real-time.',
      category: 'security',
      criticality: 'critical',
      owner: 'Emma Thompson',
      vendor: 'In-house',
      version: 'v3.1.0',
      tags: ['fraud', 'risk', 'ml', 'security'],
      externalId: 'CMDB-PAY-002',
      metadata: {
        dataClassification: 'restricted',
        personalData: true,
        cloudProvider: 'GCP',
        deploymentModel: 'cloud',
        backupFrequency: 'hourly',
      },
    },
    {
      id: 'paytech-support-desk',
      organizationId: 'paytech-uk',
      name: 'Merchant Support Portal',
      description: 'Support ticketing and knowledge base for merchant queries. Includes dispute management workflow.',
      category: 'support',
      criticality: 'medium',
      owner: 'Charlotte Davies',
      vendor: 'Zendesk',
      version: 'Enterprise',
      tags: ['support', 'ticketing', 'merchants', 'disputes'],
      externalId: 'CMDB-PAY-003',
      metadata: {
        dataClassification: 'confidential',
        personalData: true,
        cloudProvider: 'Zendesk Cloud',
        deploymentModel: 'cloud',
        backupFrequency: 'daily',
      },
    },
    {
      id: 'paytech-compliance-grc',
      organizationId: 'paytech-uk',
      name: 'Compliance GRC Platform',
      description: 'Governance, risk, and compliance management platform. Tracks regulatory requirements and evidence.',
      category: 'compliance',
      criticality: 'high',
      owner: 'Emma Thompson',
      vendor: 'ServiceNow',
      version: 'Tokyo',
      tags: ['grc', 'compliance', 'audit', 'risk'],
      externalId: 'CMDB-PAY-004',
      metadata: {
        dataClassification: 'confidential',
        personalData: false,
        cloudProvider: 'ServiceNow Cloud',
        deploymentModel: 'cloud',
        backupFrequency: 'daily',
      },
    },
    {
      id: 'paytech-merchant-dashboard',
      organizationId: 'paytech-uk',
      name: 'Merchant Dashboard',
      description: 'Self-service portal for merchants to view transactions, analytics, and manage settings.',
      category: 'customer facing',
      criticality: 'high',
      owner: 'Oliver Williams',
      vendor: 'In-house',
      version: 'v2.0.0',
      tags: ['dashboard', 'merchants', 'analytics', 'self-service'],
      externalId: 'CMDB-PAY-005',
      metadata: {
        dataClassification: 'confidential',
        personalData: true,
        cloudProvider: 'GCP',
        deploymentModel: 'cloud',
        backupFrequency: 'daily',
      },
    },
    {
      id: 'paytech-settlement-engine',
      organizationId: 'paytech-uk',
      name: 'Settlement Engine',
      description: 'Processes merchant settlements and fund disbursements. Handles multi-currency reconciliation.',
      category: 'payments',
      criticality: 'critical',
      owner: 'Amir Patel',
      vendor: 'In-house',
      version: 'v1.8.0',
      tags: ['settlement', 'payments', 'reconciliation', 'treasury'],
      externalId: 'CMDB-PAY-006',
      metadata: {
        dataClassification: 'restricted',
        personalData: false,
        cloudProvider: 'GCP',
        deploymentModel: 'cloud',
        backupFrequency: 'continuous',
      },
    },
  ],
}

export function getSystemsForOrganization(orgId: string): SystemSeed[] {
  return SYSTEMS[orgId] || []
}
