import { Metadata } from 'next'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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

function getComplianceColor(score: number) {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-yellow-400'
  return 'text-red-400'
}

export default function RegulationsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Regulations</h1>
        <p className="text-muted-foreground">
          Browse and manage regulatory frameworks affecting your organization
        </p>
      </div>

      <div className="grid gap-4">
        {regulations.map((regulation) => (
          <Link key={regulation.id} href={`/dashboard/regulations/${regulation.id}`}>
            <Card className="bg-card/50 hover:bg-card/80 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold">{regulation.name}</h2>
                      <Badge variant="outline" className="text-xs">
                        {regulation.jurisdiction}
                      </Badge>
                      {regulation.alertsCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {regulation.alertsCount} alerts
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{regulation.fullTitle}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Effective: {regulation.effectiveDate}</span>
                      <span>•</span>
                      <span>{regulation.articlesCount} articles</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-muted-foreground mb-1">Compliance</div>
                    <div className={cn('text-2xl font-bold', getComplianceColor(regulation.complianceScore))}>
                      {regulation.complianceScore}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
