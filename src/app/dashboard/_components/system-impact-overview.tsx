'use client'

import Link from 'next/link'

import { LastUpdated } from '@/components/notification-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsGridSkeleton } from '@/components/ui/skeletons'
import { useTRPCPollingOptions } from '@/hooks/use-polling'
import { cn } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangleIcon,
  RefreshCwIcon,
  ServerIcon,
  ShieldAlertIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from 'lucide-react'

// =============================================================================
// Constants
// =============================================================================

const POLLING_INTERVAL = 60000 // 1 minute

// =============================================================================
// Mini Sparkline Component
// =============================================================================

function MiniChart({ color, trend }: { color: string; trend: 'up' | 'down' }) {
  const points =
    trend === 'up'
      ? 'M0,20 L10,18 L20,15 L30,12 L40,14 L50,10 L60,8 L70,5 L80,3'
      : 'M0,5 L10,8 L20,10 L30,8 L40,12 L50,15 L60,13 L70,18 L80,20'

  return (
    <svg className="h-6 w-20" viewBox="0 0 80 24" role="img" aria-hidden>
      <path d={points} fill="none" className={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
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

// =============================================================================
// Component
// =============================================================================

export function SystemImpactOverview() {
  const trpc = useTRPC()
  const pollingOptions = useTRPCPollingOptions({ interval: POLLING_INTERVAL })

  const statsQuery = useQuery({
    ...trpc.dashboard.getStats.queryOptions(),
    ...pollingOptions,
  })

  const { data, isLoading, error, dataUpdatedAt, refetch, isFetching } = statsQuery

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">System Impact Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <StatsGridSkeleton count={4} columns={2} />
        </CardContent>
      </Card>
    )
  }

  // Auth error - show demo
  if (error && isAuthError(error)) {
    const demoStats = {
      controlsAtRisk: 7,
      systemsImpacted: 3,
      evidencePacks: 12,
      activeAlerts: 5,
    }

    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">System Impact Overview</CardTitle>
            <span className="text-xs text-muted-foreground">Demo data</span>
          </div>
        </CardHeader>
        <CardContent>
          <StatsGrid stats={demoStats} isDemo />
          <div className="mt-4 text-right">
            <Button asChild size="sm">
              <Link href="/signin">Sign in</Link>
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
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">System Impact Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-6 text-center">
            <AlertTriangleIcon className="size-8 text-destructive/50" />
            <p className="mt-2 text-sm text-muted-foreground">Unable to load system stats</p>
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
  if (!data || data.totalSystems === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">System Impact Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-8 text-center">
            <div className="rounded-full bg-muted p-3">
              <ServerIcon className="size-6 text-muted-foreground" />
            </div>
            <h3 className="mt-3 font-medium">No systems configured</h3>
            <p className="mt-1 text-sm text-muted-foreground">Add systems to track regulatory impact.</p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/dashboard/system-map">Configure Systems</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Normal state
  const stats = {
    controlsAtRisk: data.controlsAtRisk,
    systemsImpacted: data.systemsImpacted,
    evidencePacks: data.evidencePacks,
    activeAlerts: data.activeAlerts,
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">System Impact Overview</CardTitle>
          <div className="flex items-center gap-2">
            <LastUpdated date={dataUpdatedAt ? new Date(dataUpdatedAt) : null} prefix="" />
            <Button variant="ghost" size="icon" className="size-7" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCwIcon className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <StatsGrid stats={stats} />
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Stats Grid Component
// =============================================================================

interface StatsGridProps {
  stats: {
    controlsAtRisk: number
    systemsImpacted: number
    evidencePacks: number
    activeAlerts: number
  }
  isDemo?: boolean
}

function StatsGrid({ stats, isDemo = false }: StatsGridProps) {
  const statItems = [
    {
      label: 'Controls at Risk',
      value: stats.controlsAtRisk,
      trend: { direction: 'up' as const, value: 3, isGood: false },
      color: 'text-orange-400',
      chartColor: 'stroke-orange-400',
      href: '/dashboard/obligations?filter=at_risk',
      icon: ShieldAlertIcon,
    },
    {
      label: 'Critical Systems',
      value: stats.systemsImpacted,
      trend: { direction: 'up' as const, value: 1, isGood: false },
      color: 'text-red-400',
      chartColor: 'stroke-red-400',
      href: '/dashboard/system-map',
      icon: ServerIcon,
    },
    {
      label: 'Evidence Packs',
      value: stats.evidencePacks,
      trend: { direction: 'up' as const, value: 5, isGood: true },
      color: 'text-blue-400',
      chartColor: 'stroke-blue-400',
      href: '/dashboard/evidence-packs',
      icon: ShieldAlertIcon,
    },
    {
      label: 'Active Alerts',
      value: stats.activeAlerts,
      trend: { direction: 'down' as const, value: 2, isGood: true },
      color: 'text-emerald-400',
      chartColor: 'stroke-emerald-400',
      href: '/dashboard/alerts',
      icon: AlertTriangleIcon,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {statItems.map((stat) => {
        const content = (
          <div key={stat.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <TrendIndicator trend={stat.trend} />
            </div>
            <div className="flex items-end justify-between">
              <span className={cn('text-3xl font-bold', stat.color)}>{stat.value}</span>
              <MiniChart color={stat.chartColor} trend={stat.trend.direction} />
            </div>
          </div>
        )

        if (isDemo) {
          return <div key={stat.label}>{content}</div>
        }

        return (
          <Link key={stat.label} href={stat.href} className="-m-1 rounded-lg p-1 transition-colors hover:bg-muted/50">
            {content}
          </Link>
        )
      })}
    </div>
  )
}

// =============================================================================
// Trend Indicator
// =============================================================================

interface TrendIndicatorProps {
  trend: {
    direction: 'up' | 'down'
    value: number
    isGood: boolean
  }
}

function TrendIndicator({ trend }: TrendIndicatorProps) {
  const Icon = trend.direction === 'up' ? TrendingUpIcon : TrendingDownIcon
  const colorClass = trend.isGood ? 'text-emerald-400' : 'text-red-400'

  return (
    <div className="flex items-center gap-1 text-xs">
      <Icon className={cn('size-3', colorClass)} />
      <span className={colorClass}>
        {trend.direction === 'up' ? '+' : '-'}
        {trend.value}
      </span>
    </div>
  )
}
