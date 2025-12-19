import { AlertCircleIcon, CheckCircleIcon, ClockIcon, DownloadIcon, ExternalLinkIcon, FileTextIcon } from 'lucide-react'
import { Metadata } from 'next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Evidence Packs - Cindral',
  description: 'Generate and export compliance evidence documentation',
}

// Mock data matching the Figma mockup
const evidencePackData = {
  regulation: {
    id: 'dora',
    name: 'DORA',
    fullTitle: 'Digital Operational Resilience Act (EU) 2022/2554',
  },
  article: {
    id: 'article-11-1',
    number: 'Article 11(1)',
    title: 'ICT third-party service providers',
  },
  obligations: [
    {
      id: 'OBL-DORA-11-001',
      title: 'Assess all risks from ICT service providers on a monthly basis',
      lastUpdated: '2024-10-15',
      status: 'pending' as const,
    },
    {
      id: 'OBL-DORA-11-002',
      title: 'Maintain full control of ICT services at all times',
      lastUpdated: '2024-11-10',
      status: 'compliant' as const,
    },
    {
      id: 'OBL-DORA-11-003',
      title: 'Maintain effective third-party risk management framework',
      lastUpdated: '2024-11-05',
      status: 'compliant' as const,
    },
  ],
}

const obligationStatusStyles = {
  pending: {
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    icon: ClockIcon,
    iconColor: 'text-yellow-400',
  },
  compliant: {
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    icon: CheckCircleIcon,
    iconColor: 'text-emerald-400',
  },
  non_compliant: {
    bg: 'bg-red-500/10 border-red-500/20',
    icon: AlertCircleIcon,
    iconColor: 'text-red-400',
  },
}

export default function EvidencePacksPage() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Evidence Pack Generator</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <ExternalLinkIcon className="mr-2 size-4" />
            Export to Confluence
          </Button>
          <Button variant="outline">
            <ExternalLinkIcon className="mr-2 size-4" />
            Export to Jira
          </Button>
          <Button>
            <DownloadIcon className="mr-2 size-4" />
            Export to PDF
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Regulation Card */}
        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                <FileTextIcon className="size-6 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Regulation</div>
                <h2 className="text-xl font-semibold">{evidencePackData.regulation.name}</h2>
                <p className="text-sm text-muted-foreground">{evidencePackData.regulation.fullTitle}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection line */}
        <div className="flex justify-center">
          <div className="h-8 w-0.5 bg-border" />
        </div>

        {/* Article Card */}
        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex size-12 items-center justify-center rounded-lg bg-blue-500/10">
                <span className="text-sm font-semibold text-blue-400">Art</span>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Article</div>
                <h3 className="text-lg font-semibold">{evidencePackData.article.number}</h3>
                <p className="text-sm text-muted-foreground">{evidencePackData.article.title}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection line */}
        <div className="flex justify-center">
          <div className="h-8 w-0.5 bg-border" />
        </div>

        {/* Obligations Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Obligations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {evidencePackData.obligations.map((obligation) => {
              const statusStyle = obligationStatusStyles[obligation.status]
              const StatusIcon = statusStyle.icon

              return (
                <div key={obligation.id} className={cn('flex items-start gap-4 rounded-lg border p-4', statusStyle.bg)}>
                  <StatusIcon className={cn('mt-0.5 size-5 shrink-0', statusStyle.iconColor)} />
                  <div className="flex-1">
                    <p className="text-sm">{obligation.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <ClockIcon className="size-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Last updated: {obligation.lastUpdated}</span>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">{obligation.id}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
