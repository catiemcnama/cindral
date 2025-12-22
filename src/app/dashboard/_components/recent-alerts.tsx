'use client'

import Link from 'next/link'
import { useEffect } from 'react'

import { LastUpdated, SidebarBadge } from '@/components/notification-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertItemSkeleton } from '@/components/ui/skeletons'
import { useTRPCPollingOptions } from '@/hooks/use-polling'
import { useLastSeen, useNewItemsCount } from '@/lib/last-seen'
import { cn } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  BellIcon,
  CheckCircleIcon,
  CircleIcon,
  RefreshCwIcon,
  XCircleIcon,
} from 'lucide-react'

// =============================================================================
// Constants
// =============================================================================

const POLLING_INTERVAL = 30000 // 30 seconds

const severityConfig = {
  critical: {
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: XCircleIcon,
  },
  high: {
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    icon: AlertTriangleIcon,
  },
  medium: {
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    icon: CircleIcon,
  },
  low: {
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: CheckCircleIcon,
  },
  info: {
    color: 'text-gray-500',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/20',
    icon: CircleIcon,
  },
}

const statusConfig = {
  open: { label: 'Open', color: 'text-red-500' },
  in_triage: { label: 'Triage', color: 'text-orange-500' },
  in_progress: { label: 'In Progress', color: 'text-yellow-500' },
  resolved: { label: 'Resolved', color: 'text-green-500' },
  wont_fix: { label: "Won't Fix", color: 'text-gray-500' },
}

// =============================================================================
// Helper Functions
// =============================================================================

function isAuthError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { data?: { httpStatus?: number }; message?: string }
  if (e?.data?.httpStatus === 401) return true
  const msg = String(e?.message || '')
  return msg.includes('401') || msg.toLowerCase().includes('unauthorized')
}

function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// =============================================================================
// Component
// =============================================================================

export function RecentAlerts() {
  const trpc = useTRPC()
  const pollingOptions = useTRPCPollingOptions({ interval: POLLING_INTERVAL })
  const { markSeen } = useLastSeen('alerts')

  const alertsQuery = useQuery({
    ...trpc.dashboard.getRecentAlerts.queryOptions({ limit: 5 }),
    ...pollingOptions,
  })

  const { data, isLoading, error, dataUpdatedAt, refetch, isFetching } = alertsQuery
  const alerts = data ?? []

  // Count new alerts since last seen
  const newCount = useNewItemsCount('alerts', alerts)

  // Demo alerts for unauthenticated users - static dates to avoid impure function calls
  const demoAlerts = [
    {
      id: 'a1',
      title: 'Third-party vendor risk spike',
      severity: 'high' as const,
      status: 'open' as const,
      regulation: { name: 'DORA' },
      createdAt: '2024-12-22T12:00:00.000Z', // Today
    },
    {
      id: 'a2',
      title: 'Data processing change detected',
      severity: 'medium' as const,
      status: 'in_triage' as const,
      regulation: { name: 'GDPR' },
      createdAt: '2024-12-21T12:00:00.000Z', // Yesterday
    },
  ]

  // Mark as seen when component is viewed (after data loads)
  useEffect(() => {
    if (alerts.length > 0) {
      markSeen()
    }
  }, [alerts.length, markSeen])

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <BellIcon className="size-4" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AlertItemSkeleton count={3} />
        </CardContent>
      </Card>
    )
  }

  // Auth error - show demo
  if (error && isAuthError(error)) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <BellIcon className="size-4" />
              Recent Alerts
            </CardTitle>
            <span className="text-xs text-muted-foreground">Demo data</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {demoAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} isDemo />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <Button asChild size="sm">
              <Link href="/signin">Sign in</Link>
            </Button>
            <Button variant="link" size="sm" asChild>
              <Link href="/dashboard/alerts">
                View all <ArrowRightIcon className="ml-1 size-3" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Other error
  if (error) {
    return (
      <Card className="border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <BellIcon className="size-4" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-6 text-center">
            <AlertTriangleIcon className="size-8 text-destructive/50" />
            <p className="mt-2 text-sm text-muted-foreground">Unable to load alerts</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              <RefreshCwIcon className="mr-2 size-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <BellIcon className="size-4" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-8 text-center">
            <div className="rounded-full bg-emerald-500/10 p-3">
              <CheckCircleIcon className="size-6 text-emerald-500" />
            </div>
            <h3 className="mt-3 font-medium">All clear!</h3>
            <p className="mt-1 text-sm text-muted-foreground">No alerts require your attention.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Normal state
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <BellIcon className="size-4" />
            Recent Alerts
            {newCount > 0 && <SidebarBadge count={newCount} />}
          </CardTitle>
          <div className="flex items-center gap-2">
            <LastUpdated date={dataUpdatedAt ? new Date(dataUpdatedAt) : null} prefix="" />
            <Button variant="ghost" size="icon" className="size-7" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCwIcon className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </div>

        <div className="mt-4 text-right">
          <Button variant="link" size="sm" asChild>
            <Link href="/dashboard/alerts">
              View all alerts <ArrowRightIcon className="ml-1 size-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Alert Row Component
// =============================================================================

interface AlertRowProps {
  alert: {
    id: string
    title?: string | null
    description?: string | null
    severity: string
    status?: string | null
    regulation?: { name: string } | null
    createdAt: string | Date
  }
  isDemo?: boolean
}

function AlertRow({ alert, isDemo = false }: AlertRowProps) {
  const severity = (alert.severity as keyof typeof severityConfig) || 'low'
  const config = severityConfig[severity] || severityConfig.low
  const StatusIcon = config.icon
  const status = (alert.status as keyof typeof statusConfig) || 'open'
  const statusInfo = statusConfig[status] || statusConfig.open

  const createdDate = new Date(alert.createdAt)

  return (
    <Link
      href={isDemo ? '#' : `/dashboard/alerts?id=${alert.id}`}
      className={cn(
        'group flex items-start gap-3 rounded-lg p-2 transition-colors',
        'hover:bg-muted/50',
        isDemo && 'pointer-events-none'
      )}
    >
      <div className={cn('mt-0.5 rounded-full p-1', config.bg)}>
        <StatusIcon className={cn('size-3', config.color)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium group-hover:text-primary">
          {alert.title ?? alert.description ?? 'Alert'}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          {alert.regulation && (
            <Badge variant="outline" className="px-1.5 py-0 text-xs">
              {alert.regulation.name}
            </Badge>
          )}
          <span className={cn('text-xs', statusInfo.color)}>{statusInfo.label}</span>
        </div>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeDate(createdDate)}</span>
    </Link>
  )
}

export default RecentAlerts
