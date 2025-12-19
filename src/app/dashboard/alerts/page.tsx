import { ChevronRightIcon, DownloadIcon } from 'lucide-react'
import { Metadata } from 'next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Alerts - Cindral',
  description: 'Regulatory change alerts and compliance notifications',
}

// Mock data matching the Figma mockup
const alerts = [
  {
    id: 'ALT-001',
    severity: 'critical' as const,
    regulation: 'DORA',
    status: 'open' as const,
    title: 'DORA Article 11: Monthly third-party risk assessments now required',
    owner: 'John Smith',
    timeAgo: '2 hours ago',
  },
  {
    id: 'ALT-002',
    severity: 'high' as const,
    regulation: 'AI Act',
    status: 'in_progress' as const,
    title: 'AI Act Article 52: New transparency requirements for customer-facing AI',
    owner: 'Sarah Johnson',
    timeAgo: '5 hours ago',
  },
  {
    id: 'ALT-003',
    severity: 'critical' as const,
    regulation: 'DORA',
    status: 'open' as const,
    title: 'DORA Article 28: Incident reporting timeline reduced to 48 hours',
    owner: 'Mike Chen',
    timeAgo: '1 day ago',
  },
  {
    id: 'ALT-004',
    severity: 'high' as const,
    regulation: 'GDPR',
    status: 'in_progress' as const,
    title: 'GDPR Article 35: DPIA requirements extended to AI decision systems',
    owner: 'Emma Wilson',
    timeAgo: '1 day ago',
  },
  {
    id: 'ALT-005',
    severity: 'medium' as const,
    regulation: 'ESG Disclosure',
    status: 'resolved' as const,
    title: 'CSRD reporting framework updates for Q1 2025',
    owner: 'Alex Thompson',
    timeAgo: '2 days ago',
  },
]

const severityStyles = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-black',
  low: 'bg-blue-500 text-white',
}

const statusStyles = {
  open: 'bg-red-500/10 text-red-400 border-red-500/20',
  in_progress: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

const statusLabels = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}

const regulationStyles: Record<string, string> = {
  DORA: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'AI Act': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  GDPR: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'ESG Disclosure': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

export default function AlertsPage() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Alerts Center</h1>
        </div>
        <div className="text-sm text-muted-foreground">{alerts.length} alerts</div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <Select defaultValue="all">
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="all">
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Regulation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regulations</SelectItem>
            <SelectItem value="dora">DORA</SelectItem>
            <SelectItem value="gdpr">GDPR</SelectItem>
            <SelectItem value="ai-act">AI Act</SelectItem>
            <SelectItem value="esg">ESG Disclosure</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="all">
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <Card key={alert.id} className="bg-card/50 transition-colors hover:bg-card/80">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-1 items-start gap-3">
                  <ChevronRightIcon className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">{alert.id}</span>
                      <Badge className={cn('capitalize', severityStyles[alert.severity])}>{alert.severity}</Badge>
                      <Badge variant="outline" className={regulationStyles[alert.regulation]}>
                        {alert.regulation}
                      </Badge>
                      <Badge variant="outline" className={statusStyles[alert.status]}>
                        {statusLabels[alert.status]}
                      </Badge>
                    </div>
                    <p className="text-sm">{alert.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Owner: {alert.owner}</span>
                      <span>•</span>
                      <span>{alert.timeAgo}</span>
                    </div>
                  </div>
                </div>

                <Button variant="default" size="sm" className="shrink-0">
                  <DownloadIcon className="mr-2 size-4" />
                  Generate Evidence Pack
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
