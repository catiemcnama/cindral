import { AlertCircleIcon, CheckCircleIcon, ClockIcon } from 'lucide-react'
import { Metadata } from 'next'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Obligations - Cindral',
  description: 'Track and manage compliance obligations',
}

// Mock data
const obligationsByRegulation = [
  {
    regulation: 'DORA',
    total: 24,
    compliant: 18,
    pending: 4,
    nonCompliant: 2,
    obligations: [
      { id: 'OBL-DORA-11-001', title: 'Monthly ICT risk assessments', status: 'pending' as const },
      { id: 'OBL-DORA-11-002', title: 'Full control of ICT services', status: 'compliant' as const },
      { id: 'OBL-DORA-28-001', title: '48-hour incident reporting', status: 'non_compliant' as const },
    ],
  },
  {
    regulation: 'GDPR',
    total: 32,
    compliant: 28,
    pending: 3,
    nonCompliant: 1,
    obligations: [
      { id: 'OBL-GDPR-35-001', title: 'DPIA for AI systems', status: 'pending' as const },
      { id: 'OBL-GDPR-35-002', title: 'Data minimization review', status: 'compliant' as const },
    ],
  },
  {
    regulation: 'AI Act',
    total: 18,
    compliant: 8,
    pending: 7,
    nonCompliant: 3,
    obligations: [
      { id: 'OBL-AI-52-001', title: 'Transparency disclosures', status: 'pending' as const },
      { id: 'OBL-AI-52-002', title: 'Human oversight documentation', status: 'non_compliant' as const },
    ],
  },
]

const statusStyles = {
  pending: {
    icon: ClockIcon,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  compliant: {
    icon: CheckCircleIcon,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  non_compliant: {
    icon: AlertCircleIcon,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
}

const statusLabels = {
  pending: 'Pending',
  compliant: 'Compliant',
  non_compliant: 'Non-Compliant',
}

export default function ObligationsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Obligations</h1>
        <p className="text-muted-foreground">Track compliance obligations across all regulatory frameworks</p>
      </div>

      <div className="space-y-6">
        {obligationsByRegulation.map((group) => {
          const compliancePercentage = Math.round((group.compliant / group.total) * 100)

          return (
            <Card key={group.regulation}>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold">{group.regulation}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="text-emerald-400">{group.compliant} compliant</span>
                      <span>•</span>
                      <span className="text-yellow-400">{group.pending} pending</span>
                      <span>•</span>
                      <span className="text-red-400">{group.nonCompliant} non-compliant</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{compliancePercentage}%</span>
                    <Progress value={compliancePercentage} className="h-2 w-32" />
                  </div>
                </div>

                <div className="space-y-2">
                  {group.obligations.map((obligation) => {
                    const style = statusStyles[obligation.status]
                    const Icon = style.icon

                    return (
                      <div
                        key={obligation.id}
                        className={cn('flex items-center justify-between rounded-lg p-3', style.bg)}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={cn('size-4', style.color)} />
                          <span className="text-sm">{obligation.title}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={style.color}>
                            {statusLabels[obligation.status]}
                          </Badge>
                          <span className="font-mono text-xs text-muted-foreground">{obligation.id}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
