import { ArrowRightIcon } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Mock data matching the Figma mockup
const regulatoryChanges = [
  {
    id: '1',
    regulation: 'DORA',
    article: 'Article 11(1)',
    severity: 'critical' as const,
    title: 'Enhanced ICT third-party service provider oversight requirements now include monthly risk assessments',
    timeAgo: '2 hours ago',
  },
  {
    id: '2',
    regulation: 'AI Act',
    article: 'Article 52(3)',
    severity: 'high' as const,
    title: 'New transparency obligations for AI systems interacting with natural persons',
    timeAgo: '5 hours ago',
  },
  {
    id: '3',
    regulation: 'Basel III',
    article: 'CRR III Amendment',
    severity: 'medium' as const,
    title: 'Updated capital requirements for operational risk - Output floor implementation delayed to 2025',
    timeAgo: '1 day ago',
  },
  {
    id: '4',
    regulation: 'GDPR',
    article: 'Article 35(7)',
    severity: 'high' as const,
    title: 'Data Protection Impact Assessment requirements extended to include AI decision systems',
    timeAgo: '1 day ago',
  },
  {
    id: '5',
    regulation: 'ESG Disclosure',
    article: 'CSRD Article 19a',
    severity: 'medium' as const,
    title: 'Corporate Sustainability Reporting Directive updates for financial institutions',
    timeAgo: '2 days ago',
  },
]

const severityStyles = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
}

const regulationStyles: Record<string, string> = {
  DORA: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'AI Act': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Basel III': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  GDPR: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'ESG Disclosure': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

export function RegulatoryFeed() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Regulatory Change Feed</h2>
        <Button variant="link" className="text-primary" asChild>
          <Link href="/dashboard/regulations">
            View all <ArrowRightIcon className="ml-1 size-4" />
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        {regulatoryChanges.map((change) => (
          <Card key={change.id} className="bg-card/50 transition-colors hover:bg-card/80">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn('font-medium', regulationStyles[change.regulation] || 'bg-muted')}
                    >
                      {change.regulation}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{change.article}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{change.title}</p>
                  <p className="text-xs text-muted-foreground">{change.timeAgo}</p>
                </div>
                <Badge variant="outline" className={cn('shrink-0 capitalize', severityStyles[change.severity])}>
                  {change.severity}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
