/**
 * Database Seed Script
 * Populates the database with realistic demo data for Cindral
 *
 * Run with: npm run db:seed
 */

import { db } from './index'
import { alerts, articles, articleSystemImpacts, obligations, regulations, regulatoryChanges, systems } from './schema'

// ============================================================================
// REGULATIONS
// ============================================================================

const regulationsData = [
  {
    id: 'dora',
    name: 'DORA',
    fullTitle: 'Digital Operational Resilience Act (EU) 2022/2554',
    jurisdiction: 'European Union',
    effectiveDate: new Date('2025-01-17'),
    lastUpdated: new Date('2024-12-15'),
  },
  {
    id: 'gdpr',
    name: 'GDPR',
    fullTitle: 'General Data Protection Regulation (EU) 2016/679',
    jurisdiction: 'European Union',
    effectiveDate: new Date('2018-05-25'),
    lastUpdated: new Date('2024-11-20'),
  },
  {
    id: 'ai-act',
    name: 'AI Act',
    fullTitle: 'Artificial Intelligence Act (EU) 2024/1689',
    jurisdiction: 'European Union',
    effectiveDate: new Date('2025-08-02'),
    lastUpdated: new Date('2024-12-10'),
  },
  {
    id: 'basel-iii',
    name: 'Basel III',
    fullTitle: 'Basel III: International Regulatory Framework for Banks',
    jurisdiction: 'International',
    effectiveDate: new Date('2023-01-01'),
    lastUpdated: new Date('2024-10-05'),
  },
  {
    id: 'nis2',
    name: 'NIS2',
    fullTitle: 'Network and Information Security Directive (EU) 2022/2555',
    jurisdiction: 'European Union',
    effectiveDate: new Date('2024-10-17'),
    lastUpdated: new Date('2024-12-01'),
  },
]

// ============================================================================
// ARTICLES - Key articles from each regulation
// ============================================================================

const articlesData = [
  // DORA Articles
  {
    id: 'dora-art-5',
    regulationId: 'dora',
    articleNumber: 'Article 5',
    sectionTitle: 'ICT Risk Management Framework',
    description: 'Requirements for establishing and maintaining a sound ICT risk management framework.',
    fullText:
      'Financial entities shall have in place an internal governance and control framework that ensures an effective and prudent management of ICT risk, in accordance with Article 6(4), in order to achieve a high level of digital operational resilience.',
    riskLevel: 'critical' as const,
    aiSummary:
      'You must have a formal ICT risk management framework with clear governance. This means documented policies, assigned responsibilities, and regular board oversight of technology risks.',
  },
  {
    id: 'dora-art-6',
    regulationId: 'dora',
    articleNumber: 'Article 6',
    sectionTitle: 'ICT Systems and Tools',
    description: 'Requirements for ICT systems, protocols, and tools used by financial entities.',
    fullText:
      'Financial entities shall use and maintain updated ICT systems, protocols and tools that are appropriate to support the performance of their activities and the provision of services.',
    riskLevel: 'high' as const,
    aiSummary:
      'Keep all your IT systems up to date and fit for purpose. This includes regular patching, capacity planning, and ensuring systems can handle your business needs.',
  },
  {
    id: 'dora-art-11',
    regulationId: 'dora',
    articleNumber: 'Article 11',
    sectionTitle: 'ICT Third-Party Risk',
    description: 'Monthly risk assessments for third-party ICT service providers.',
    fullText:
      'Financial entities shall, on a continuous basis, identify all sources of ICT risk, in particular the risk exposure to and from other financial entities, and assess cyber threats and ICT vulnerabilities relevant to their ICT-supported business functions, information assets and ICT assets.',
    riskLevel: 'critical' as const,
    aiSummary:
      'You must assess risks from all your IT vendors monthly. Document which vendors have access to what, their security posture, and your contingency plans if they fail.',
  },
  {
    id: 'dora-art-17',
    regulationId: 'dora',
    articleNumber: 'Article 17',
    sectionTitle: 'ICT Incident Classification',
    description: 'Criteria for classifying ICT-related incidents and cyber threats.',
    fullText:
      'Financial entities shall classify ICT-related incidents and shall determine their impact on the basis of criteria including the number of clients affected, duration, geographical spread, data losses, criticality of services affected, and economic impact.',
    riskLevel: 'high' as const,
    aiSummary:
      'Create a classification system for IT incidents. Rate them by impact (users affected, downtime, data loss) and have predefined response procedures for each severity level.',
  },
  {
    id: 'dora-art-19',
    regulationId: 'dora',
    articleNumber: 'Article 19',
    sectionTitle: 'Incident Reporting',
    description: 'Requirements for reporting major ICT-related incidents to authorities.',
    fullText:
      'Financial entities shall report major ICT-related incidents to the relevant competent authority. The initial notification shall be submitted within 4 hours of classification, with intermediate and final reports following.',
    riskLevel: 'critical' as const,
    aiSummary:
      'Major IT incidents must be reported to regulators within 4 hours. Have templates ready and know exactly who to contact. Late reporting = regulatory action.',
  },
  {
    id: 'dora-art-24',
    regulationId: 'dora',
    articleNumber: 'Article 24',
    sectionTitle: 'Digital Operational Resilience Testing',
    description: 'Requirements for testing ICT systems and resilience capabilities.',
    fullText:
      'Financial entities shall establish, maintain and review a sound and comprehensive digital operational resilience testing programme as an integral part of their ICT risk management framework.',
    riskLevel: 'high' as const,
    aiSummary:
      'Regularly test your IT systems can withstand attacks and failures. This includes penetration testing, disaster recovery drills, and scenario-based exercises.',
  },
  {
    id: 'dora-art-28',
    regulationId: 'dora',
    articleNumber: 'Article 28',
    sectionTitle: 'ICT Third-Party Service Providers',
    description: 'Due diligence and contractual requirements for ICT service providers.',
    fullText:
      'Financial entities shall manage ICT third-party risk as an integral component of ICT risk within their ICT risk management framework and in accordance with principles of proportionality.',
    riskLevel: 'critical' as const,
    aiSummary:
      'Every IT vendor contract needs specific clauses: audit rights, incident notification, exit planning, subcontracting limits. No exceptions for cloud providers.',
  },

  // GDPR Articles
  {
    id: 'gdpr-art-5',
    regulationId: 'gdpr',
    articleNumber: 'Article 5',
    sectionTitle: 'Principles of Processing',
    description: 'Core principles relating to processing of personal data.',
    fullText:
      'Personal data shall be processed lawfully, fairly and in a transparent manner; collected for specified, explicit and legitimate purposes; adequate, relevant and limited to what is necessary; accurate and kept up to date; kept no longer than necessary; processed securely.',
    riskLevel: 'critical' as const,
    aiSummary:
      'The golden rules: Only collect data you need, be transparent about why, keep it accurate, delete it when done, and protect it always. Violate these = massive fines.',
  },
  {
    id: 'gdpr-art-6',
    regulationId: 'gdpr',
    articleNumber: 'Article 6',
    sectionTitle: 'Lawfulness of Processing',
    description: 'Legal bases for processing personal data.',
    fullText:
      'Processing shall be lawful only if and to the extent that at least one of the following applies: consent, contract, legal obligation, vital interests, public task, or legitimate interests.',
    riskLevel: 'critical' as const,
    aiSummary:
      'You need a legal reason to process personal data. Pick one: consent, contract necessity, legal requirement, or legitimate interest. Document your choice for every data type.',
  },
  {
    id: 'gdpr-art-17',
    regulationId: 'gdpr',
    articleNumber: 'Article 17',
    sectionTitle: 'Right to Erasure',
    description: 'The right to be forgotten - requirements for data deletion.',
    fullText:
      'The data subject shall have the right to obtain from the controller the erasure of personal data concerning him or her without undue delay where one of several grounds applies.',
    riskLevel: 'high' as const,
    aiSummary:
      'Users can request you delete all their data. You have 30 days to comply. This includes backups, logs, and third-party systems. Know where all your data lives.',
  },
  {
    id: 'gdpr-art-25',
    regulationId: 'gdpr',
    articleNumber: 'Article 25',
    sectionTitle: 'Data Protection by Design',
    description: 'Building privacy into systems from the start.',
    fullText:
      'The controller shall implement appropriate technical and organisational measures designed to implement data-protection principles, such as data minimisation, in an effective manner and to integrate the necessary safeguards into the processing.',
    riskLevel: 'high' as const,
    aiSummary:
      'Privacy must be built into every new system from day one, not added later. Default settings should be the most private option. Document this in your design process.',
  },
  {
    id: 'gdpr-art-32',
    regulationId: 'gdpr',
    articleNumber: 'Article 32',
    sectionTitle: 'Security of Processing',
    description: 'Technical and organizational security measures.',
    fullText:
      'The controller and the processor shall implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk, including encryption, pseudonymisation, resilience, and regular testing.',
    riskLevel: 'critical' as const,
    aiSummary:
      'Encrypt data at rest and in transit. Control access. Test your security regularly. The measures must match the sensitivity of the data you hold.',
  },
  {
    id: 'gdpr-art-33',
    regulationId: 'gdpr',
    articleNumber: 'Article 33',
    sectionTitle: 'Breach Notification',
    description: 'Notification of personal data breaches to supervisory authorities.',
    fullText:
      'In the case of a personal data breach, the controller shall without undue delay and, where feasible, not later than 72 hours after having become aware of it, notify the personal data breach to the supervisory authority.',
    riskLevel: 'critical' as const,
    aiSummary:
      'Data breach? You have 72 hours to notify regulators. Have your incident response plan ready. Know what constitutes a breach and who makes the call.',
  },
  {
    id: 'gdpr-art-35',
    regulationId: 'gdpr',
    articleNumber: 'Article 35',
    sectionTitle: 'Data Protection Impact Assessment',
    description: 'When and how to conduct DPIAs for high-risk processing.',
    fullText:
      'Where a type of processing is likely to result in a high risk to the rights and freedoms of natural persons, the controller shall carry out an assessment of the impact of the envisaged processing operations on the protection of personal data.',
    riskLevel: 'high' as const,
    aiSummary:
      'New AI system? Large-scale profiling? Sensitive data? You need a DPIA before you start. Document the risks, mitigations, and get DPO sign-off.',
  },

  // AI Act Articles
  {
    id: 'ai-act-art-6',
    regulationId: 'ai-act',
    articleNumber: 'Article 6',
    sectionTitle: 'High-Risk AI Classification',
    description: 'Classification rules for high-risk AI systems.',
    fullText:
      'An AI system that is a product or a safety component of a product covered by Union harmonisation legislation listed in Annex I, or intended to be used for biometric identification, critical infrastructure, education, employment, essential services, law enforcement, migration, or justice, shall be considered high-risk.',
    riskLevel: 'critical' as const,
    aiSummary:
      'AI used for hiring, credit decisions, or customer-facing decisions is likely high-risk. This triggers extensive compliance requirements. Classify all your AI systems now.',
  },
  {
    id: 'ai-act-art-9',
    regulationId: 'ai-act',
    articleNumber: 'Article 9',
    sectionTitle: 'Risk Management System',
    description: 'Requirements for AI risk management systems.',
    fullText:
      'A risk management system shall be established, implemented, documented and maintained in relation to high-risk AI systems. It shall be a continuous iterative process planned and run throughout the entire lifecycle of the high-risk AI system.',
    riskLevel: 'high' as const,
    aiSummary:
      'High-risk AI needs a documented risk management system covering its entire lifecycle. Regular risk assessments, mitigation measures, and continuous monitoring.',
  },
  {
    id: 'ai-act-art-13',
    regulationId: 'ai-act',
    articleNumber: 'Article 13',
    sectionTitle: 'Transparency and Information',
    description: 'Transparency requirements for high-risk AI systems.',
    fullText:
      "High-risk AI systems shall be designed and developed in such a way as to ensure that their operation is sufficiently transparent to enable deployers to interpret a system's output and use it appropriately.",
    riskLevel: 'high' as const,
    aiSummary:
      'Your AI must be explainable. Users need to understand how decisions are made. Keep documentation on training data, model logic, and known limitations.',
  },
  {
    id: 'ai-act-art-14',
    regulationId: 'ai-act',
    articleNumber: 'Article 14',
    sectionTitle: 'Human Oversight',
    description: 'Requirements for human oversight of AI systems.',
    fullText:
      'High-risk AI systems shall be designed and developed in such a way as to enable natural persons to oversee their functioning effectively, including through appropriate human-machine interface tools.',
    riskLevel: 'critical' as const,
    aiSummary:
      'Humans must be able to override AI decisions. Build in review mechanisms, appeal processes, and the ability to shut down AI systems when needed.',
  },
  {
    id: 'ai-act-art-52',
    regulationId: 'ai-act',
    articleNumber: 'Article 52',
    sectionTitle: 'Transparency for Users',
    description: 'Transparency obligations for AI systems interacting with humans.',
    fullText:
      'Providers shall ensure that AI systems intended to interact with natural persons are designed and developed in such a way that the natural persons concerned are informed that they are interacting with an AI system.',
    riskLevel: 'high' as const,
    aiSummary:
      'If users interact with AI (chatbots, automated decisions), they must be told. No pretending AI is human. Clear disclosure at point of interaction.',
  },

  // Basel III Articles
  {
    id: 'basel-iii-pillar-1',
    regulationId: 'basel-iii',
    articleNumber: 'Pillar 1',
    sectionTitle: 'Minimum Capital Requirements',
    description: 'Rules for calculating minimum capital requirements for credit, market, and operational risk.',
    fullText:
      'Banks must maintain minimum capital ratios: Common Equity Tier 1 (CET1) of 4.5%, Tier 1 capital of 6%, and Total Capital of 8% of risk-weighted assets.',
    riskLevel: 'critical' as const,
    aiSummary:
      'Maintain minimum capital buffers against risks. Your IT systems must accurately calculate risk-weighted assets. Errors here = regulatory capital breach.',
  },
  {
    id: 'basel-iii-pillar-2',
    regulationId: 'basel-iii',
    articleNumber: 'Pillar 2',
    sectionTitle: 'Supervisory Review',
    description: 'Requirements for internal capital adequacy assessment and supervisory review.',
    fullText:
      'Banks shall have an internal process for assessing their capital adequacy in relation to their risk profile and a strategy for maintaining their capital levels. Supervisors shall review this assessment.',
    riskLevel: 'high' as const,
    aiSummary:
      'You need internal processes to assess if you have enough capital. Regulators will review your methodology. IT systems must support stress testing.',
  },
  {
    id: 'basel-iii-pillar-3',
    regulationId: 'basel-iii',
    articleNumber: 'Pillar 3',
    sectionTitle: 'Market Discipline',
    description: 'Disclosure requirements to promote market discipline.',
    fullText:
      'Banks shall publish comprehensive and timely information about their risk exposures, risk assessment processes, and capital adequacy to allow market participants to assess key information.',
    riskLevel: 'medium' as const,
    aiSummary:
      'Publish your risk and capital information regularly. Your reporting systems must produce accurate, timely disclosures. Public scrutiny keeps you honest.',
  },
  {
    id: 'basel-iii-op-risk',
    regulationId: 'basel-iii',
    articleNumber: 'Operational Risk',
    sectionTitle: 'Standardised Approach for Operational Risk',
    description: 'New standardised approach for calculating operational risk capital.',
    fullText:
      "Banks shall calculate operational risk capital using the standardised approach, which combines a measure of a bank's income with its historical losses to determine required capital.",
    riskLevel: 'high' as const,
    aiSummary:
      'Operational risk capital now factors in your loss history. Better IT systems = fewer incidents = lower capital requirements. Track every operational loss.',
  },

  // NIS2 Articles
  {
    id: 'nis2-art-21',
    regulationId: 'nis2',
    articleNumber: 'Article 21',
    sectionTitle: 'Cybersecurity Risk Management',
    description: 'Risk management measures for essential and important entities.',
    fullText:
      'Essential and important entities shall take appropriate and proportionate technical, operational and organisational measures to manage the risks posed to the security of network and information systems.',
    riskLevel: 'critical' as const,
    aiSummary:
      'Comprehensive cybersecurity measures required: risk assessments, incident handling, business continuity, supply chain security, encryption, access control, and vulnerability management.',
  },
  {
    id: 'nis2-art-23',
    regulationId: 'nis2',
    articleNumber: 'Article 23',
    sectionTitle: 'Incident Reporting',
    description: 'Reporting obligations for significant incidents.',
    fullText:
      'Essential and important entities shall notify the competent authority or CSIRT of any incident that has a significant impact on the provision of their services. Early warning within 24 hours, incident notification within 72 hours.',
    riskLevel: 'critical' as const,
    aiSummary:
      '24-hour early warning for significant incidents, full notification within 72 hours. This is faster than GDPR. Have your incident response team ready.',
  },
]

// ============================================================================
// SYSTEMS - Realistic IT systems for a financial institution
// ============================================================================

const systemsData = [
  {
    id: 'core-banking',
    name: 'Core Banking System',
    description:
      'Central system for managing customer accounts, transactions, and banking operations. Handles deposits, withdrawals, transfers, and account management.',
    criticality: 'critical' as const,
  },
  {
    id: 'payment-gateway',
    name: 'Payment Gateway',
    description:
      'Processes card payments, SEPA transfers, and real-time payment rails. Interfaces with SWIFT, card networks, and instant payment systems.',
    criticality: 'critical' as const,
  },
  {
    id: 'mobile-app',
    name: 'Mobile Banking App',
    description:
      'Customer-facing iOS and Android application for account access, payments, and self-service banking features.',
    criticality: 'high' as const,
  },
  {
    id: 'web-portal',
    name: 'Online Banking Portal',
    description: 'Web-based customer portal for account management, statements, transfers, and secure messaging.',
    criticality: 'high' as const,
  },
  {
    id: 'crm',
    name: 'Customer Relationship Management',
    description:
      'Salesforce-based CRM for customer data, interactions, marketing campaigns, and relationship management.',
    criticality: 'high' as const,
  },
  {
    id: 'analytics-engine',
    name: 'Analytics Engine',
    description:
      'Data warehouse and analytics platform for business intelligence, risk modeling, and regulatory reporting.',
    criticality: 'high' as const,
  },
  {
    id: 'fraud-detection',
    name: 'Fraud Detection System',
    description: 'Real-time transaction monitoring using ML models to detect suspicious activity and prevent fraud.',
    criticality: 'critical' as const,
  },
  {
    id: 'customer-db',
    name: 'Customer Database',
    description: 'Master data repository for customer personal information, KYC documents, and consent records.',
    criticality: 'critical' as const,
  },
  {
    id: 'regulatory-reporting',
    name: 'Regulatory Reporting',
    description: 'Automated reporting system for Basel III, COREP, FINREP, and other regulatory submissions.',
    criticality: 'high' as const,
  },
  {
    id: 'aws-cloud',
    name: 'AWS Cloud Infrastructure',
    description: 'Cloud infrastructure hosting non-core applications, disaster recovery, and development environments.',
    criticality: 'medium' as const,
  },
  {
    id: 'email-system',
    name: 'Email & Communication',
    description: 'Microsoft 365 email, Teams collaboration, and SharePoint document management.',
    criticality: 'medium' as const,
  },
  {
    id: 'identity-mgmt',
    name: 'Identity Management',
    description: 'Okta-based identity and access management for single sign-on, MFA, and user provisioning.',
    criticality: 'critical' as const,
  },
]

// ============================================================================
// ARTICLE-SYSTEM IMPACTS - Which articles affect which systems
// ============================================================================

const impactsData = [
  // DORA impacts
  {
    articleId: 'dora-art-5',
    systemId: 'core-banking',
    impactLevel: 'critical' as const,
    notes: 'Core system requires comprehensive ICT risk framework',
  },
  {
    articleId: 'dora-art-5',
    systemId: 'payment-gateway',
    impactLevel: 'critical' as const,
    notes: 'Payment systems must be covered by risk framework',
  },
  {
    articleId: 'dora-art-5',
    systemId: 'fraud-detection',
    impactLevel: 'high' as const,
    notes: 'Critical for operational resilience',
  },
  {
    articleId: 'dora-art-11',
    systemId: 'aws-cloud',
    impactLevel: 'critical' as const,
    notes: 'Third-party cloud provider requires monthly assessment',
  },
  {
    articleId: 'dora-art-11',
    systemId: 'crm',
    impactLevel: 'high' as const,
    notes: 'Salesforce is third-party ICT service',
  },
  {
    articleId: 'dora-art-11',
    systemId: 'identity-mgmt',
    impactLevel: 'high' as const,
    notes: 'Okta is critical third-party provider',
  },
  {
    articleId: 'dora-art-19',
    systemId: 'core-banking',
    impactLevel: 'critical' as const,
    notes: 'Incidents affecting core banking must be reported',
  },
  {
    articleId: 'dora-art-19',
    systemId: 'payment-gateway',
    impactLevel: 'critical' as const,
    notes: 'Payment disruptions trigger reporting requirements',
  },
  {
    articleId: 'dora-art-24',
    systemId: 'core-banking',
    impactLevel: 'high' as const,
    notes: 'Regular penetration testing required',
  },
  {
    articleId: 'dora-art-24',
    systemId: 'fraud-detection',
    impactLevel: 'high' as const,
    notes: 'ML models must be tested for resilience',
  },
  {
    articleId: 'dora-art-28',
    systemId: 'aws-cloud',
    impactLevel: 'critical' as const,
    notes: 'Cloud contracts must meet DORA requirements',
  },
  {
    articleId: 'dora-art-28',
    systemId: 'identity-mgmt',
    impactLevel: 'critical' as const,
    notes: 'IAM vendor contract review required',
  },

  // GDPR impacts
  {
    articleId: 'gdpr-art-5',
    systemId: 'customer-db',
    impactLevel: 'critical' as const,
    notes: 'Core repository of personal data',
  },
  { articleId: 'gdpr-art-5', systemId: 'crm', impactLevel: 'high' as const, notes: 'Customer data processing' },
  {
    articleId: 'gdpr-art-5',
    systemId: 'analytics-engine',
    impactLevel: 'high' as const,
    notes: 'Data minimization in analytics',
  },
  {
    articleId: 'gdpr-art-17',
    systemId: 'customer-db',
    impactLevel: 'critical' as const,
    notes: 'Erasure requests must be handled',
  },
  { articleId: 'gdpr-art-17', systemId: 'crm', impactLevel: 'high' as const, notes: 'CRM data must be erasable' },
  {
    articleId: 'gdpr-art-17',
    systemId: 'analytics-engine',
    impactLevel: 'high' as const,
    notes: 'Analytics data subject to erasure',
  },
  {
    articleId: 'gdpr-art-32',
    systemId: 'customer-db',
    impactLevel: 'critical' as const,
    notes: 'Encryption and access controls required',
  },
  {
    articleId: 'gdpr-art-32',
    systemId: 'core-banking',
    impactLevel: 'critical' as const,
    notes: 'Security measures for financial data',
  },
  {
    articleId: 'gdpr-art-33',
    systemId: 'customer-db',
    impactLevel: 'critical' as const,
    notes: 'Breach notification procedures',
  },
  {
    articleId: 'gdpr-art-35',
    systemId: 'fraud-detection',
    impactLevel: 'high' as const,
    notes: 'DPIA required for automated profiling',
  },
  {
    articleId: 'gdpr-art-35',
    systemId: 'analytics-engine',
    impactLevel: 'high' as const,
    notes: 'DPIA for large-scale processing',
  },

  // AI Act impacts
  {
    articleId: 'ai-act-art-6',
    systemId: 'fraud-detection',
    impactLevel: 'critical' as const,
    notes: 'ML-based fraud detection likely high-risk',
  },
  {
    articleId: 'ai-act-art-6',
    systemId: 'analytics-engine',
    impactLevel: 'high' as const,
    notes: 'Creditworthiness models are high-risk',
  },
  {
    articleId: 'ai-act-art-14',
    systemId: 'fraud-detection',
    impactLevel: 'critical' as const,
    notes: 'Human review of fraud decisions required',
  },
  {
    articleId: 'ai-act-art-52',
    systemId: 'mobile-app',
    impactLevel: 'high' as const,
    notes: 'AI chatbot transparency required',
  },
  {
    articleId: 'ai-act-art-52',
    systemId: 'web-portal',
    impactLevel: 'high' as const,
    notes: 'Disclose AI-powered features',
  },

  // Basel III impacts
  {
    articleId: 'basel-iii-pillar-1',
    systemId: 'regulatory-reporting',
    impactLevel: 'critical' as const,
    notes: 'Capital calculations must be accurate',
  },
  {
    articleId: 'basel-iii-pillar-1',
    systemId: 'analytics-engine',
    impactLevel: 'high' as const,
    notes: 'Risk-weighted asset calculations',
  },
  {
    articleId: 'basel-iii-op-risk',
    systemId: 'core-banking',
    impactLevel: 'high' as const,
    notes: 'Operational loss tracking required',
  },
  {
    articleId: 'basel-iii-op-risk',
    systemId: 'fraud-detection',
    impactLevel: 'high' as const,
    notes: 'Fraud losses affect capital requirements',
  },

  // NIS2 impacts
  {
    articleId: 'nis2-art-21',
    systemId: 'core-banking',
    impactLevel: 'critical' as const,
    notes: 'Essential service - full cybersecurity measures',
  },
  {
    articleId: 'nis2-art-21',
    systemId: 'payment-gateway',
    impactLevel: 'critical' as const,
    notes: 'Critical infrastructure protection',
  },
  {
    articleId: 'nis2-art-21',
    systemId: 'identity-mgmt',
    impactLevel: 'critical' as const,
    notes: 'Access control is key security measure',
  },
  {
    articleId: 'nis2-art-23',
    systemId: 'core-banking',
    impactLevel: 'critical' as const,
    notes: '24-hour incident reporting',
  },
  {
    articleId: 'nis2-art-23',
    systemId: 'payment-gateway',
    impactLevel: 'critical' as const,
    notes: 'Payment incidents require rapid notification',
  },
]

// ============================================================================
// OBLIGATIONS - Specific compliance requirements
// ============================================================================

const obligationsData = [
  // DORA Obligations
  {
    id: 'OBL-DORA-5-001',
    articleId: 'dora-art-5',
    title: 'Document ICT risk management framework',
    description:
      'Establish and maintain documented policies and procedures for ICT risk management, approved by the management body.',
    status: 'compliant' as const,
  },
  {
    id: 'OBL-DORA-5-002',
    articleId: 'dora-art-5',
    title: 'Assign ICT risk management responsibilities',
    description:
      'Designate roles and responsibilities for ICT risk management, including a dedicated ICT risk management function.',
    status: 'compliant' as const,
  },
  {
    id: 'OBL-DORA-11-001',
    articleId: 'dora-art-11',
    title: 'Assess all risks from ICT service providers on a monthly basis',
    description: 'Conduct and document monthly risk assessments for all third-party ICT service providers.',
    status: 'pending' as const,
  },
  {
    id: 'OBL-DORA-11-002',
    articleId: 'dora-art-11',
    title: 'Maintain full control of ICT services at all times',
    description:
      'Ensure contractual arrangements provide for oversight, audit rights, and exit planning for all ICT services.',
    status: 'compliant' as const,
  },
  {
    id: 'OBL-DORA-11-003',
    articleId: 'dora-art-11',
    title: 'Maintain effective third-party risk management framework',
    description:
      'Implement a framework for identifying, assessing, and mitigating risks from ICT third-party dependencies.',
    status: 'pending' as const,
  },
  {
    id: 'OBL-DORA-19-001',
    articleId: 'dora-art-19',
    title: 'Establish incident reporting procedures',
    description:
      'Create and test procedures for reporting major ICT incidents to competent authorities within required timeframes.',
    status: 'compliant' as const,
  },
  {
    id: 'OBL-DORA-19-002',
    articleId: 'dora-art-19',
    title: 'Prepare incident report templates',
    description: 'Maintain pre-approved templates for initial, intermediate, and final incident reports.',
    status: 'compliant' as const,
  },
  {
    id: 'OBL-DORA-24-001',
    articleId: 'dora-art-24',
    title: 'Conduct annual penetration testing',
    description: 'Perform threat-led penetration testing (TLPT) on critical systems at least annually.',
    status: 'pending' as const,
  },
  {
    id: 'OBL-DORA-28-001',
    articleId: 'dora-art-28',
    title: 'Review all ICT vendor contracts',
    description:
      'Ensure all ICT third-party contracts include required DORA clauses for audit, reporting, and exit rights.',
    status: 'non_compliant' as const,
  },

  // GDPR Obligations
  {
    id: 'OBL-GDPR-5-001',
    articleId: 'gdpr-art-5',
    title: 'Maintain records of processing activities',
    description:
      'Document all processing activities including purposes, categories, recipients, and retention periods.',
    status: 'compliant' as const,
  },
  {
    id: 'OBL-GDPR-6-001',
    articleId: 'gdpr-art-6',
    title: 'Document legal basis for each processing activity',
    description: 'Identify and record the legal basis relied upon for each type of personal data processing.',
    status: 'compliant' as const,
  },
  {
    id: 'OBL-GDPR-17-001',
    articleId: 'gdpr-art-17',
    title: 'Implement data erasure procedures',
    description: 'Establish processes to handle erasure requests within 30 days across all systems.',
    status: 'pending' as const,
  },
  {
    id: 'OBL-GDPR-32-001',
    articleId: 'gdpr-art-32',
    title: 'Implement encryption for personal data',
    description: 'Encrypt personal data at rest and in transit using industry-standard encryption.',
    status: 'compliant' as const,
  },
  {
    id: 'OBL-GDPR-33-001',
    articleId: 'gdpr-art-33',
    title: 'Establish 72-hour breach notification process',
    description: 'Create incident response procedures ensuring supervisory authority notification within 72 hours.',
    status: 'compliant' as const,
  },
  {
    id: 'OBL-GDPR-35-001',
    articleId: 'gdpr-art-35',
    title: 'Complete DPIA for AI decision systems',
    description: 'Conduct Data Protection Impact Assessments for all automated decision-making systems.',
    status: 'pending' as const,
  },

  // AI Act Obligations
  {
    id: 'OBL-AI-6-001',
    articleId: 'ai-act-art-6',
    title: 'Classify all AI systems by risk level',
    description: 'Inventory and classify all AI systems according to the AI Act risk categories.',
    status: 'pending' as const,
  },
  {
    id: 'OBL-AI-14-001',
    articleId: 'ai-act-art-14',
    title: 'Implement human oversight for high-risk AI',
    description: 'Ensure human review and override capabilities for all high-risk AI decisions.',
    status: 'non_compliant' as const,
  },
  {
    id: 'OBL-AI-52-001',
    articleId: 'ai-act-art-52',
    title: 'Disclose AI interactions to users',
    description: 'Inform users when they are interacting with AI systems including chatbots.',
    status: 'pending' as const,
  },

  // Basel III Obligations
  {
    id: 'OBL-BASEL-1-001',
    articleId: 'basel-iii-pillar-1',
    title: 'Calculate capital ratios accurately',
    description: 'Ensure systems correctly calculate CET1, Tier 1, and Total Capital ratios.',
    status: 'compliant' as const,
  },
  {
    id: 'OBL-BASEL-OP-001',
    articleId: 'basel-iii-op-risk',
    title: 'Track all operational losses',
    description: 'Maintain comprehensive database of operational losses for capital calculations.',
    status: 'compliant' as const,
  },

  // NIS2 Obligations
  {
    id: 'OBL-NIS2-21-001',
    articleId: 'nis2-art-21',
    title: 'Implement supply chain security measures',
    description: 'Assess and manage cybersecurity risks in the supply chain and third-party relationships.',
    status: 'pending' as const,
  },
  {
    id: 'OBL-NIS2-23-001',
    articleId: 'nis2-art-23',
    title: 'Establish 24-hour early warning capability',
    description: 'Create processes for providing early warning to CSIRT within 24 hours of significant incidents.',
    status: 'pending' as const,
  },
]

// ============================================================================
// ALERTS - Current regulatory change alerts
// ============================================================================

const alertsData = [
  {
    id: 'ALT-001',
    title: 'DORA Article 11: Monthly third-party risk assessments now required',
    description:
      'Enhanced ICT third-party service provider oversight requirements now include monthly risk assessments. Financial entities must immediately begin monthly assessment cycles for all critical and important ICT service providers.',
    severity: 'critical' as const,
    status: 'open' as const,
    regulationId: 'dora',
    articleId: 'dora-art-11',
  },
  {
    id: 'ALT-002',
    title: 'AI Act Article 52: New transparency requirements for customer-facing AI',
    description:
      'AI systems interacting with natural persons must now clearly disclose their AI nature. Chatbots, virtual assistants, and automated decision systems require prominent disclosure.',
    severity: 'high' as const,
    status: 'in_progress' as const,
    regulationId: 'ai-act',
    articleId: 'ai-act-art-52',
  },
  {
    id: 'ALT-003',
    title: 'DORA Article 28: Incident reporting timeline reduced to 48 hours',
    description:
      'Updated technical standards now require incident reporting within 48 hours for certain incident categories. Review and update your incident response procedures.',
    severity: 'critical' as const,
    status: 'open' as const,
    regulationId: 'dora',
    articleId: 'dora-art-19',
  },
  {
    id: 'ALT-004',
    title: 'GDPR Article 35: DPIA requirements extended to AI decision systems',
    description:
      'European Data Protection Board guidance clarifies that all AI-based automated decision-making systems processing personal data require a Data Protection Impact Assessment.',
    severity: 'high' as const,
    status: 'in_progress' as const,
    regulationId: 'gdpr',
    articleId: 'gdpr-art-35',
  },
  {
    id: 'ALT-005',
    title: 'Basel III: Output floor implementation confirmed for 2025',
    description:
      'Updated capital requirements for operational risk via the standardised approach. Output floor implementation phases begin January 2025.',
    severity: 'medium' as const,
    status: 'open' as const,
    regulationId: 'basel-iii',
    articleId: 'basel-iii-op-risk',
  },
]

// ============================================================================
// REGULATORY CHANGES - Feed items for dashboard
// ============================================================================

const regulatoryChangesData = [
  {
    regulationId: 'dora',
    articleId: 'dora-art-11',
    title: 'Enhanced ICT third-party service provider oversight requirements now include monthly risk assessments',
    description:
      'Financial entities must conduct monthly assessments of ICT third-party service providers, documenting risk levels and mitigation measures.',
    severity: 'critical' as const,
    changesCount: 3,
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    regulationId: 'ai-act',
    articleId: 'ai-act-art-52',
    title: 'New transparency obligations for AI systems interacting with natural persons',
    description:
      'All AI systems that interact directly with users must clearly disclose their AI nature. This applies to chatbots, virtual assistants, and recommendation systems.',
    severity: 'high' as const,
    changesCount: 1,
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },
  {
    regulationId: 'basel-iii',
    articleId: 'basel-iii-op-risk',
    title: 'Updated capital requirements for operational risk - Output floor implementation delayed to 2025',
    description:
      'The Basel Committee has confirmed the implementation timeline for the output floor, with phased introduction beginning January 2025.',
    severity: 'medium' as const,
    changesCount: 2,
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    regulationId: 'gdpr',
    articleId: 'gdpr-art-35',
    title: 'Data Protection Impact Assessment requirements extended to include AI decision systems',
    description:
      'EDPB guidance clarifies that all AI systems making decisions about individuals require a DPIA before deployment.',
    severity: 'high' as const,
    changesCount: 1,
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    regulationId: 'nis2',
    articleId: 'nis2-art-21',
    title: 'NIS2 enforcement begins - Essential entities must demonstrate compliance',
    description:
      'NIS2 Directive is now in effect. Essential and important entities must have implemented all required cybersecurity measures.',
    severity: 'critical' as const,
    changesCount: 5,
    publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
  },
  {
    regulationId: 'dora',
    articleId: 'dora-art-28',
    title: 'ICT third-party contract requirements clarified in final technical standards',
    description:
      'Final regulatory technical standards specify exact contractual clauses required for ICT third-party service providers.',
    severity: 'high' as const,
    changesCount: 4,
    publishedAt: new Date(Date.now() - 72 * 60 * 60 * 1000), // 3 days ago
  },
]

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seed() {
  console.log('🌱 Starting database seed...\n')

  try {
    // Clear existing data (in reverse order of dependencies)
    console.log('🗑️  Clearing existing data...')
    await db.delete(regulatoryChanges)
    await db.delete(alerts)
    await db.delete(obligations)
    await db.delete(articleSystemImpacts)
    await db.delete(systems)
    await db.delete(articles)
    await db.delete(regulations)
    console.log('   ✓ Cleared existing data\n')

    // Seed regulations
    console.log('📜 Seeding regulations...')
    await db.insert(regulations).values(regulationsData)
    console.log(`   ✓ Inserted ${regulationsData.length} regulations\n`)

    // Seed articles
    console.log('📄 Seeding articles...')
    await db.insert(articles).values(articlesData)
    console.log(`   ✓ Inserted ${articlesData.length} articles\n`)

    // Seed systems
    console.log('🖥️  Seeding systems...')
    await db.insert(systems).values(systemsData)
    console.log(`   ✓ Inserted ${systemsData.length} systems\n`)

    // Seed article-system impacts
    console.log('🔗 Seeding article-system impacts...')
    await db.insert(articleSystemImpacts).values(impactsData)
    console.log(`   ✓ Inserted ${impactsData.length} impact mappings\n`)

    // Seed obligations
    console.log('✅ Seeding obligations...')
    await db.insert(obligations).values(obligationsData)
    console.log(`   ✓ Inserted ${obligationsData.length} obligations\n`)

    // Seed alerts
    console.log('🚨 Seeding alerts...')
    await db.insert(alerts).values(alertsData)
    console.log(`   ✓ Inserted ${alertsData.length} alerts\n`)

    // Seed regulatory changes
    console.log('📰 Seeding regulatory changes...')
    await db.insert(regulatoryChanges).values(regulatoryChangesData)
    console.log(`   ✓ Inserted ${regulatoryChangesData.length} regulatory changes\n`)

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Database seeded successfully!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`
Summary:
  • ${regulationsData.length} regulations (DORA, GDPR, AI Act, Basel III, NIS2)
  • ${articlesData.length} articles with AI summaries
  • ${systemsData.length} IT systems
  • ${impactsData.length} article-system impact mappings
  • ${obligationsData.length} compliance obligations
  • ${alertsData.length} active alerts
  • ${regulatoryChangesData.length} regulatory feed items

Compliance Status:
  • Compliant: ${obligationsData.filter((o) => o.status === 'compliant').length}
  • Pending: ${obligationsData.filter((o) => o.status === 'pending').length}
  • Non-Compliant: ${obligationsData.filter((o) => o.status === 'non_compliant').length}
`)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  }
}

// Run the seed
seed()
  .then(() => {
    console.log('🎉 Seed complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed to seed database:', error)
    process.exit(1)
  })
