import { AlertTriangleIcon, DownloadIcon } from 'lucide-react'
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Mock data for regulations (same as list but with more detail)
const regulationsData: Record<
  string,
  {
    id: string
    name: string
    fullTitle: string
    jurisdiction: string
    jurisdictionFlag: string
    lastUpdated: string
    effectiveDate: string
    articles: Array<{
      id: string
      number: string
      section: string
      title: string
      changesCount: number
      riskLevel: 'critical' | 'high' | 'medium' | 'low'
    }>
    aiSummary: string
    affectedSystems: Array<{
      name: string
      impact: 'critical' | 'high' | 'medium' | 'low'
      status: 'action_required' | 'in_progress' | 'compliant'
    }>
  }
> = {
  dora: {
    id: 'dora',
    name: 'DORA',
    fullTitle: 'Regulation (EU) 2022/2554',
    jurisdiction: 'European Union',
    jurisdictionFlag: '🇪🇺',
    lastUpdated: 'November 14, 2024 at 14:32 CET',
    effectiveDate: 'January 17, 2025',
    articles: [
      {
        id: 'dora-article-11',
        number: 'Article 11',
        section: 'Section I - ICT Risk Management',
        title: 'ICT third-party service providers',
        changesCount: 2,
        riskLevel: 'critical',
      },
      {
        id: 'dora-article-28',
        number: 'Article 28',
        section: 'Section II - Incident Reporting',
        title: 'Major ICT-related incident reporting',
        changesCount: 2,
        riskLevel: 'high',
      },
    ],
    aiSummary:
      'DORA establishes comprehensive requirements for financial institutions to build resilience against ICT disruptions. Recent updates emphasize faster incident response and more frequent third-party risk assessments, reflecting the increasing dependency on cloud and external service providers.',
    affectedSystems: [
      { name: 'AWS Cloud Infrastructure', impact: 'high', status: 'action_required' },
      { name: 'Core Banking System', impact: 'critical', status: 'action_required' },
      { name: 'Payment Gateway', impact: 'high', status: 'in_progress' },
      { name: 'Customer Data Platform', impact: 'medium', status: 'compliant' },
    ],
  },
  gdpr: {
    id: 'gdpr',
    name: 'GDPR',
    fullTitle: 'Regulation (EU) 2016/679',
    jurisdiction: 'European Union',
    jurisdictionFlag: '🇪🇺',
    lastUpdated: 'December 1, 2024 at 10:15 CET',
    effectiveDate: 'May 25, 2018',
    articles: [
      {
        id: 'gdpr-article-35',
        number: 'Article 35',
        section: 'Section 3 - Data Protection Impact Assessment',
        title: 'Data Protection Impact Assessment',
        changesCount: 1,
        riskLevel: 'high',
      },
    ],
    aiSummary:
      'GDPR continues to be the foundational data protection regulation. Recent interpretations have expanded DPIA requirements to cover AI-based decision making systems that process personal data.',
    affectedSystems: [
      { name: 'Customer Data Platform', impact: 'high', status: 'in_progress' },
      { name: 'Analytics Engine', impact: 'medium', status: 'compliant' },
    ],
  },
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const regulation = regulationsData[id]

  return {
    title: regulation ? `${regulation.name} - Regulations - Cindral` : 'Regulation Not Found',
    description: regulation?.fullTitle || 'Regulation details',
  }
}

const impactStyles = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-blue-400',
}

const statusStyles = {
  action_required: { label: 'Action Required', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  in_progress: { label: 'In Progress', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  compliant: { label: 'Compliant', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
}

export default async function RegulationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const regulation = regulationsData[id]

  if (!regulation) {
    notFound()
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/regulations">Regulations</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{regulation.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column - Regulation details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Regulation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground">Full Title</div>
                <div className="text-sm">{regulation.fullTitle}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Jurisdiction</div>
                <div className="flex items-center gap-2 text-sm">
                  <span>{regulation.jurisdictionFlag}</span>
                  {regulation.jurisdiction}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Last Updated</div>
                <div className="text-sm">{regulation.lastUpdated}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Effective Date</div>
                <div className="text-sm">{regulation.effectiveDate}</div>
              </div>

              <Button variant="outline" className="w-full">
                <DownloadIcon className="mr-2 size-4" />
                Download PDF
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Middle column - Articles */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{regulation.name}</h2>
            <Button variant="outline" size="sm">
              Show Changes
            </Button>
          </div>

          <div className="space-y-3">
            {regulation.articles.map((article) => (
              <Card key={article.id} className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-blue-500/20 bg-blue-500/10 text-blue-400">
                          {article.number}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{article.section}</span>
                      </div>
                      <p className="text-sm">{article.title}</p>
                    </div>
                    {article.changesCount > 0 && (
                      <Badge className="shrink-0 bg-orange-500 text-white">{article.changesCount} changes</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Key Recitals placeholder */}
          <Card className="bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Key Recitals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">(12) ICT risk management provisions...</div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - AI Interpretation */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
                  AI
                </div>
                <CardTitle className="text-base">AI Interpretation</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 text-xs text-muted-foreground">Plain English Summary</div>
                <p className="text-sm leading-relaxed">{regulation.aiSummary}</p>
              </div>

              <div>
                <div className="mb-2 text-xs text-muted-foreground">Risk Level</div>
                <div className="flex items-center gap-2">
                  <AlertTriangleIcon className="size-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">Critical</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Affected Systems</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {regulation.affectedSystems.map((system) => (
                <div key={system.name} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'size-2 rounded-full',
                        system.status === 'compliant'
                          ? 'bg-emerald-400'
                          : system.status === 'in_progress'
                            ? 'bg-yellow-400'
                            : 'bg-red-400'
                      )}
                    />
                    <div>
                      <div className="text-sm font-medium">{system.name}</div>
                      <div className={cn('text-xs capitalize', impactStyles[system.impact])}>
                        {system.impact} Impact
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={statusStyles[system.status].className}>
                    {statusStyles[system.status].label}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
