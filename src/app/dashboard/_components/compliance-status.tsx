'use client'

import dynamic from 'next/dynamic'

import { LastUpdated } from '@/components/notification-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartSkeleton } from '@/components/ui/skeletons'
import { useTRPCPollingOptions } from '@/hooks/use-polling'
import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

type ComplianceDatum = { name: string; value: number; fill: string }

// =============================================================================
// Constants
// =============================================================================

const STATUS_COLORS = {
  verified: 'hsl(var(--chart-1))', // Green - fully compliant
  implemented: 'hsl(var(--chart-2))', // Blue - implemented, awaiting verification
  underReview: 'hsl(var(--chart-3))', // Yellow - under review
  inProgress: 'hsl(var(--chart-4))', // Orange - work in progress
  notStarted: 'hsl(var(--chart-5))', // Red - not started
}

// =============================================================================
// Lazy-loaded Chart Component
// =============================================================================

const LazyCompliancePie = dynamic(() => import('./compliance-pie').then((m) => m.CompliancePie), {
  ssr: false,
  loading: () => <ChartSkeleton type="pie" height={200} showLegend={false} />,
})

// =============================================================================
// Component
// =============================================================================

export function ComplianceStatus() {
  const trpc = useTRPC()
  const pollingOptions = useTRPCPollingOptions({ interval: 60000 }) // 1 minute polling

  const statsQuery = useQuery({
    ...trpc.dashboard.getStats.queryOptions(),
    ...pollingOptions,
  })

  const { data, isLoading, error, dataUpdatedAt, refetch, isFetching } = statsQuery

  // Transform API data into chart format
  const complianceData: ComplianceDatum[] = data?.obligations
    ? [
        { name: 'Verified', value: data.obligations.verified, fill: STATUS_COLORS.verified },
        { name: 'Implemented', value: data.obligations.implemented, fill: STATUS_COLORS.implemented },
        { name: 'Under Review', value: data.obligations.underReview, fill: STATUS_COLORS.underReview },
        { name: 'In Progress', value: data.obligations.inProgress, fill: STATUS_COLORS.inProgress },
        { name: 'Not Started', value: data.obligations.notStarted, fill: STATUS_COLORS.notStarted },
      ].filter((d) => d.value > 0) // Only show non-zero segments
    : []

  const totalObligations = data?.totalObligations ?? 0
  const complianceRate = data?.complianceRate ?? 0

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Compliance Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <ChartSkeleton type="pie" height={200} />
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    const isAuthError =
      error.message.includes('401') ||
      error.message.toLowerCase().includes('unauthorized') ||
      (error as { data?: { httpStatus?: number } })?.data?.httpStatus === 401

    if (isAuthError) {
      // Show demo data for unauthenticated users
      const demoData: ComplianceDatum[] = [
        { name: 'Verified', value: 45, fill: STATUS_COLORS.verified },
        { name: 'Implemented', value: 22, fill: STATUS_COLORS.implemented },
        { name: 'Under Review', value: 8, fill: STATUS_COLORS.underReview },
        { name: 'In Progress', value: 15, fill: STATUS_COLORS.inProgress },
        { name: 'Not Started', value: 10, fill: STATUS_COLORS.notStarted },
      ]

      return (
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Compliance Status</CardTitle>
              <span className="text-xs text-muted-foreground">Demo data</span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-50 w-full">
              <LazyCompliancePie complianceData={demoData} />
            </div>
            <ComplianceLegend data={demoData} />
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="border-destructive/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Compliance Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <AlertTriangleIcon className="size-8 text-destructive/50" />
          <p className="mt-2 text-sm text-muted-foreground">Unable to load compliance data</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            <RefreshCwIcon className="mr-2 size-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (totalObligations === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Compliance Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-muted p-3">
            <AlertTriangleIcon className="size-6 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm font-medium">No obligations yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Add regulations to start tracking compliance</p>
        </CardContent>
      </Card>
    )
  }

  // Normal state with data
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Compliance Status</CardTitle>
          <div className="flex items-center gap-2">
            <LastUpdated date={dataUpdatedAt ? new Date(dataUpdatedAt) : null} prefix="" />
            <Button variant="ghost" size="icon" className="size-7" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCwIcon className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="h-50 w-full">
          <LazyCompliancePie complianceData={complianceData} />
        </div>

        {/* Accessible summary for screen readers */}
        <div className="sr-only" aria-live="polite">
          Overall compliance {complianceRate}%. {complianceData.map((d) => `${d.name} ${d.value}`).join(', ')}{' '}
          obligations.
        </div>

        <ComplianceLegend data={complianceData} />

        {/* Summary stats */}
        <div className="mt-4 flex w-full justify-between border-t pt-3 text-xs text-muted-foreground">
          <span>{totalObligations} total obligations</span>
          <span className="font-medium text-foreground">{complianceRate}% compliant</span>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Legend Component
// =============================================================================

function ComplianceLegend({ data }: { data: ComplianceDatum[] }) {
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
      {data.map((entry) => (
        <div key={entry.name} className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
          <span className="text-xs text-muted-foreground">
            {entry.name} ({entry.value})
          </span>
        </div>
      ))}
    </div>
  )
}
