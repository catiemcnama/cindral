/**
 * Deterministic Obligation Seed Data
 * Realistic compliance requirements derived from DORA and GDPR articles
 */

export interface ObligationSeed {
  articleRef: string // Reference to article by articleNumber
  referenceCode: string
  title: string
  summary: string
  status: 'not_started' | 'in_progress' | 'implemented' | 'under_review' | 'verified'
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  requirementType: 'process' | 'technical' | 'reporting'
  dueInDays: number // Days from seed date
}

// =============================================================================
// DORA Obligations - Specific actionable requirements
// =============================================================================

export const DORA_OBLIGATIONS: ObligationSeed[] = [
  // Article 5 - Governance
  {
    articleRef: 'Article 5',
    referenceCode: 'DORA-5-001',
    title: 'Establish ICT Risk Governance Framework',
    summary:
      'Implement internal governance and control framework for effective ICT risk management with defined roles, responsibilities, and reporting lines.',
    status: 'in_progress',
    riskLevel: 'critical',
    requirementType: 'process',
    dueInDays: 30,
  },
  {
    articleRef: 'Article 5',
    referenceCode: 'DORA-5-002',
    title: 'Board ICT Risk Oversight Documentation',
    summary:
      'Document management body approval of ICT risk policies, digital resilience strategy, and risk tolerance levels with meeting minutes and sign-off records.',
    status: 'not_started',
    riskLevel: 'high',
    requirementType: 'process',
    dueInDays: 45,
  },
  {
    articleRef: 'Article 5',
    referenceCode: 'DORA-5-003',
    title: 'ICT Budget Allocation Process',
    summary:
      'Establish process for allocating and reviewing budget for digital operational resilience, including security awareness programs and training.',
    status: 'verified',
    riskLevel: 'medium',
    requirementType: 'process',
    dueInDays: -30, // Already past due (completed)
  },

  // Article 6 - ICT Risk Management Framework
  {
    articleRef: 'Article 6',
    referenceCode: 'DORA-6-001',
    title: 'ICT Risk Management Framework Documentation',
    summary:
      'Document comprehensive ICT risk management framework including strategies, policies, procedures, protocols, and tools for protecting information assets.',
    status: 'in_progress',
    riskLevel: 'critical',
    requirementType: 'process',
    dueInDays: 60,
  },
  {
    articleRef: 'Article 6',
    referenceCode: 'DORA-6-002',
    title: 'Asset Protection Technical Controls',
    summary:
      'Implement technical controls to protect all ICT assets (software, hardware, servers) and physical infrastructure from unauthorized access and damage.',
    status: 'implemented',
    riskLevel: 'critical',
    requirementType: 'technical',
    dueInDays: 15,
  },
  {
    articleRef: 'Article 6',
    referenceCode: 'DORA-6-003',
    title: 'ICT Risk Assessment Procedures',
    summary:
      'Establish procedures for continuous ICT risk identification, assessment, and monitoring with documented risk registers and treatment plans.',
    status: 'under_review',
    riskLevel: 'high',
    requirementType: 'process',
    dueInDays: 30,
  },

  // Article 11 - Business Continuity
  {
    articleRef: 'Article 11',
    referenceCode: 'DORA-11-001',
    title: 'ICT Business Continuity Policy',
    summary:
      'Develop and maintain comprehensive ICT business continuity policy ensuring continuity of critical functions during disruptions.',
    status: 'in_progress',
    riskLevel: 'critical',
    requirementType: 'process',
    dueInDays: 45,
  },
  {
    articleRef: 'Article 11',
    referenceCode: 'DORA-11-002',
    title: 'Incident Response Procedures',
    summary:
      'Document and test incident response procedures for rapid containment, damage limitation, and recovery from ICT-related incidents.',
    status: 'not_started',
    riskLevel: 'critical',
    requirementType: 'process',
    dueInDays: 60,
  },
  {
    articleRef: 'Article 11',
    referenceCode: 'DORA-11-003',
    title: 'Crisis Communication Plan',
    summary:
      'Establish communication protocols for internal staff, external stakeholders, and regulatory authorities during ICT incidents.',
    status: 'in_progress',
    riskLevel: 'high',
    requirementType: 'process',
    dueInDays: 30,
  },

  // Article 17 - Incident Management
  {
    articleRef: 'Article 17',
    referenceCode: 'DORA-17-001',
    title: 'Incident Detection and Monitoring',
    summary:
      'Deploy early warning indicators and monitoring systems to detect ICT-related incidents and cyber threats in real-time.',
    status: 'implemented',
    riskLevel: 'critical',
    requirementType: 'technical',
    dueInDays: -15, // Already past due (completed)
  },
  {
    articleRef: 'Article 17',
    referenceCode: 'DORA-17-002',
    title: 'Incident Classification Framework',
    summary:
      'Implement procedures to classify ICT incidents by priority, severity, and service criticality with defined escalation paths.',
    status: 'verified',
    riskLevel: 'high',
    requirementType: 'process',
    dueInDays: -30,
  },
  {
    articleRef: 'Article 17',
    referenceCode: 'DORA-17-003',
    title: 'Root Cause Analysis Process',
    summary:
      'Establish procedures for incident root cause analysis, documentation, and remediation to prevent recurrence.',
    status: 'in_progress',
    riskLevel: 'medium',
    requirementType: 'process',
    dueInDays: 45,
  },

  // Article 19 - Incident Reporting
  {
    articleRef: 'Article 19',
    referenceCode: 'DORA-19-001',
    title: 'Major Incident Reporting Procedure',
    summary:
      'Implement procedure for reporting major ICT incidents to competent authority within required timeframes (end of business day / 4 hours).',
    status: 'not_started',
    riskLevel: 'critical',
    requirementType: 'reporting',
    dueInDays: 30,
  },
  {
    articleRef: 'Article 19',
    referenceCode: 'DORA-19-002',
    title: 'Incident Reporting Templates',
    summary:
      'Prepare standardized templates for initial, intermediate, and final incident reports to regulatory authorities.',
    status: 'in_progress',
    riskLevel: 'high',
    requirementType: 'reporting',
    dueInDays: 21,
  },

  // Article 24 - Resilience Testing
  {
    articleRef: 'Article 24',
    referenceCode: 'DORA-24-001',
    title: 'Digital Operational Resilience Testing Programme',
    summary:
      'Establish comprehensive testing programme including vulnerability assessments, penetration testing, and scenario-based tests.',
    status: 'not_started',
    riskLevel: 'high',
    requirementType: 'process',
    dueInDays: 90,
  },
  {
    articleRef: 'Article 24',
    referenceCode: 'DORA-24-002',
    title: 'Annual Penetration Testing',
    summary: 'Conduct annual threat-led penetration testing of critical systems following risk-based approach.',
    status: 'not_started',
    riskLevel: 'critical',
    requirementType: 'technical',
    dueInDays: 75,
  },

  // Article 28 - Third-Party Risk
  {
    articleRef: 'Article 28',
    referenceCode: 'DORA-28-001',
    title: 'Third-Party Risk Management Policy',
    summary:
      'Develop policy for managing ICT third-party risk including due diligence, contractual requirements, and ongoing monitoring.',
    status: 'in_progress',
    riskLevel: 'critical',
    requirementType: 'process',
    dueInDays: 45,
  },
  {
    articleRef: 'Article 28',
    referenceCode: 'DORA-28-002',
    title: 'Third-Party Register',
    summary:
      'Maintain comprehensive register of all ICT third-party service providers with criticality assessments and contract details.',
    status: 'implemented',
    riskLevel: 'high',
    requirementType: 'process',
    dueInDays: 0, // Due today
  },
  {
    articleRef: 'Article 28',
    referenceCode: 'DORA-28-003',
    title: 'Third-Party Exit Strategy',
    summary:
      'Document exit strategies for critical ICT third-party providers including data portability and transition plans.',
    status: 'not_started',
    riskLevel: 'high',
    requirementType: 'process',
    dueInDays: 60,
  },
]

// =============================================================================
// GDPR Obligations - Specific actionable requirements
// =============================================================================

export const GDPR_OBLIGATIONS: ObligationSeed[] = [
  // Article 5 - Principles
  {
    articleRef: 'Article 5',
    referenceCode: 'GDPR-5-001',
    title: 'Data Processing Transparency',
    summary:
      'Document and communicate how personal data is processed, including purposes, legal basis, and data subject rights.',
    status: 'verified',
    riskLevel: 'critical',
    requirementType: 'process',
    dueInDays: -60,
  },
  {
    articleRef: 'Article 5',
    referenceCode: 'GDPR-5-002',
    title: 'Data Minimization Controls',
    summary:
      'Implement controls ensuring personal data collected is adequate, relevant, and limited to what is necessary.',
    status: 'implemented',
    riskLevel: 'high',
    requirementType: 'technical',
    dueInDays: -30,
  },
  {
    articleRef: 'Article 5',
    referenceCode: 'GDPR-5-003',
    title: 'Data Accuracy Procedures',
    summary:
      'Establish procedures to keep personal data accurate and up to date, including regular data quality reviews.',
    status: 'in_progress',
    riskLevel: 'medium',
    requirementType: 'process',
    dueInDays: 30,
  },

  // Article 6 - Lawfulness
  {
    articleRef: 'Article 6',
    referenceCode: 'GDPR-6-001',
    title: 'Processing Legal Basis Register',
    summary: 'Document legal basis for all personal data processing activities with justification and evidence.',
    status: 'implemented',
    riskLevel: 'critical',
    requirementType: 'process',
    dueInDays: -45,
  },
  {
    articleRef: 'Article 6',
    referenceCode: 'GDPR-6-002',
    title: 'Consent Management System',
    summary:
      'Implement system to capture, record, and manage data subject consent with audit trail and withdrawal capability.',
    status: 'verified',
    riskLevel: 'critical',
    requirementType: 'technical',
    dueInDays: -90,
  },

  // Article 17 - Erasure
  {
    articleRef: 'Article 17',
    referenceCode: 'GDPR-17-001',
    title: 'Data Erasure Request Process',
    summary:
      'Implement process to handle data subject erasure requests within required timeframe (without undue delay).',
    status: 'implemented',
    riskLevel: 'high',
    requirementType: 'process',
    dueInDays: -30,
  },
  {
    articleRef: 'Article 17',
    referenceCode: 'GDPR-17-002',
    title: 'Automated Data Deletion',
    summary:
      'Implement technical controls for automated data deletion based on retention policies and legal requirements.',
    status: 'in_progress',
    riskLevel: 'high',
    requirementType: 'technical',
    dueInDays: 45,
  },

  // Article 25 - Privacy by Design
  {
    articleRef: 'Article 25',
    referenceCode: 'GDPR-25-001',
    title: 'Privacy by Design Framework',
    summary:
      'Integrate data protection into system design and development processes with documented privacy requirements.',
    status: 'under_review',
    riskLevel: 'high',
    requirementType: 'process',
    dueInDays: 30,
  },
  {
    articleRef: 'Article 25',
    referenceCode: 'GDPR-25-002',
    title: 'Default Privacy Settings',
    summary: 'Configure systems to process only necessary personal data by default with privacy-protective settings.',
    status: 'implemented',
    riskLevel: 'medium',
    requirementType: 'technical',
    dueInDays: -15,
  },

  // Article 32 - Security
  {
    articleRef: 'Article 32',
    referenceCode: 'GDPR-32-001',
    title: 'Personal Data Encryption',
    summary: 'Implement encryption for personal data at rest and in transit using industry-standard algorithms.',
    status: 'verified',
    riskLevel: 'critical',
    requirementType: 'technical',
    dueInDays: -60,
  },
  {
    articleRef: 'Article 32',
    referenceCode: 'GDPR-32-002',
    title: 'Security Testing Programme',
    summary:
      'Conduct regular testing of security measures protecting personal data including penetration tests and audits.',
    status: 'in_progress',
    riskLevel: 'high',
    requirementType: 'technical',
    dueInDays: 60,
  },

  // Article 33 - Breach Notification
  {
    articleRef: 'Article 33',
    referenceCode: 'GDPR-33-001',
    title: 'Breach Notification Procedure',
    summary:
      'Establish procedure for notifying supervisory authority within 72 hours of becoming aware of personal data breach.',
    status: 'implemented',
    riskLevel: 'critical',
    requirementType: 'reporting',
    dueInDays: -30,
  },
  {
    articleRef: 'Article 33',
    referenceCode: 'GDPR-33-002',
    title: 'Breach Documentation Register',
    summary: 'Maintain register of all personal data breaches including facts, effects, and remedial actions taken.',
    status: 'verified',
    riskLevel: 'high',
    requirementType: 'process',
    dueInDays: -45,
  },

  // Article 35 - DPIA
  {
    articleRef: 'Article 35',
    referenceCode: 'GDPR-35-001',
    title: 'DPIA Process and Templates',
    summary: 'Establish Data Protection Impact Assessment process with templates for high-risk processing activities.',
    status: 'implemented',
    riskLevel: 'high',
    requirementType: 'process',
    dueInDays: -15,
  },
  {
    articleRef: 'Article 35',
    referenceCode: 'GDPR-35-002',
    title: 'High-Risk Processing Register',
    summary:
      'Maintain register of processing activities requiring DPIA with completed assessments and risk mitigation.',
    status: 'in_progress',
    riskLevel: 'high',
    requirementType: 'process',
    dueInDays: 30,
  },
]

/**
 * Get obligations for a regulation by framework
 */
export function getObligationsForFramework(framework: string): ObligationSeed[] {
  switch (framework.toUpperCase()) {
    case 'DORA':
      return DORA_OBLIGATIONS
    case 'GDPR':
      return GDPR_OBLIGATIONS
    default:
      return []
  }
}
