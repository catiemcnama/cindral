import { Metadata } from 'next'
import { RegulationsList } from './_components/regulations-list'

export const metadata: Metadata = {
  title: 'Regulations - Cindral',
  description: 'Browse regulatory frameworks and compliance requirements',
}

// Mock data matching the Figma mockup
const regulations = [
  {
    id: 'dora',
    name: 'DORA',
    fullTitle: 'Digital Operational Resilience Act (EU) 2022/2554',
    jurisdiction: 'European Union',
    effectiveDate: 'January 17, 2025',
    articlesCount: 64,
    alertsCount: 3,
    complianceScore: 72,
  },
  {
    id: 'gdpr',
    name: 'GDPR',
    fullTitle: 'General Data Protection Regulation (EU) 2016/679',
    jurisdiction: 'European Union',
    effectiveDate: 'May 25, 2018',
    articlesCount: 99,
    alertsCount: 2,
    complianceScore: 85,
  },
  {
    id: 'ai-act',
    name: 'AI Act',
    fullTitle: 'Artificial Intelligence Act (EU) 2024/1689',
    jurisdiction: 'European Union',
    effectiveDate: 'August 1, 2024',
    articlesCount: 113,
    alertsCount: 4,
    complianceScore: 45,
  },
  {
    id: 'basel-iii',
    name: 'Basel III',
    fullTitle: 'Basel III: International Regulatory Framework for Banks',
    jurisdiction: 'International',
    effectiveDate: 'January 1, 2023',
    articlesCount: 42,
    alertsCount: 1,
    complianceScore: 91,
  },
  {
    id: 'nis2',
    name: 'NIS2',
    fullTitle: 'Network and Information Security Directive 2 (EU) 2022/2555',
    jurisdiction: 'European Union',
    effectiveDate: 'October 17, 2024',
    articlesCount: 46,
    alertsCount: 2,
    complianceScore: 68,
  },
]

export default function RegulationsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Regulations</h1>
        <p className="text-muted-foreground">Browse and manage regulatory frameworks affecting your organization</p>
      </div>

      <RegulationsList regulations={regulations} />
    </div>
  )
}
