'use client'

import { Button } from '@/components/ui/button'
import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Mini sparkline component
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

export function SystemImpactOverview() {
  const trpc = useTRPC()
  const statsQuery = useQuery(trpc.dashboard.getStats.queryOptions())

  if (statsQuery.isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">System Impact Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (statsQuery.error) {
    const isAuthError = (err: unknown) => {
      if (!err) return false
      const e = err as { data?: { httpStatus?: number }; message?: string }
      if (e?.data?.httpStatus === 401) return true
      const m = (e?.message || '').toString()
      return m.includes('401') || m.toLowerCase().includes('unauthorized')
    }

    if (isAuthError(statsQuery.error)) {
      const demo = {
        systemsAffected: 3,
        impactedServices: 5,
        compliancePercent: 67,
      }

      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">System Impact Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Systems Affected</div>
                  <div className="text-lg font-semibold">{demo.systemsAffected}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Impacted Services</div>
                  <div className="text-lg font-semibold">{demo.impactedServices}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Compliance</div>
                <div className="text-xl font-bold">{demo.compliancePercent}%</div>
              </div>
            </div>
            <div className="mt-4 text-right">
              <Button asChild>
                <Link href="/auth/signin">Sign in</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">System Impact Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">Unable to load system stats.</div>
        </CardContent>
      </Card>
    )
  }

  const s = statsQuery.data

  const stats = [
    {
      label: 'Controls at Risk',
      value: s?.controlsAtRisk ?? 0,
      trend: { direction: 'up' as const, value: 3 },
      color: 'text-orange-400',
      chartColor: 'stroke-orange-400',
    },
    {
      label: 'Critical Systems Impacted',
      value: s?.systemsImpacted ?? 0,
      trend: { direction: 'up' as const, value: 12 },
      color: 'text-red-400',
      chartColor: 'stroke-red-400',
    },
    {
      label: 'Evidence Gaps Detected',
      value: s?.evidencePacks ?? 0,
      trend: { direction: 'up' as const, value: 5 },
      color: 'text-blue-400',
      chartColor: 'stroke-blue-400',
    },
    {
      label: 'Active Alerts',
      value: s?.activeAlerts ?? 0,
      trend: { direction: 'down' as const, value: 1 },
      color: 'text-emerald-400',
      chartColor: 'stroke-emerald-400',
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">System Impact Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <div className="flex items-center gap-1 text-xs">
                  {stat.trend.direction === 'up' ? (
                    <TrendingUpIcon
                      className={cn(
                        'size-3',
                        stat.trend.direction === 'up' && stat.label !== 'Active Alerts'
                          ? 'text-red-400'
                          : 'text-emerald-400'
                      )}
                    />
                  ) : (
                    <TrendingDownIcon className="size-3 text-emerald-400" />
                  )}
                  <span
                    className={cn(
                      stat.trend.direction === 'up' && stat.label !== 'Active Alerts'
                        ? 'text-red-400'
                        : 'text-emerald-400'
                    )}
                  >
                    {stat.trend.direction === 'up' ? '+' : '-'}
                    {stat.trend.value}
                  </span>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <span className={cn('text-3xl font-bold', stat.color)}>{stat.value}</span>
                <MiniChart color={stat.chartColor} trend={stat.trend.direction} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
