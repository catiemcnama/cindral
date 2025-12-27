'use client'

import Link from 'next/link'
import { useMemo } from 'react'

import { LastUpdated, LiveIndicator } from '@/components/notification-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FeedItemSkeleton } from '@/components/ui/skeletons'
import { useTRPCPollingOptions } from '@/hooks/use-polling'
import { cn } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangleIcon, ArrowRightIcon, InboxIcon, RefreshCwIcon } from 'lucide-react'

// =============================================================================
// Constants
// =============================================================================

const POLLING_INTERVAL = 30000 // 30 seconds

const severityStyles: Record<string, string> = {
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

// =============================================================================
// Helper Functions
// =============================================================================

function isAuthError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { data?: { httpStatus?: number; code?: string }; message?: string }
  if (e?.data?.httpStatus === 401) return true
  const msg = String(e?.message || '')
  return msg.includes('401') || msg.toLowerCase().includes('unauthorized')
}

function isNoOrgError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as { data?: { httpStatus?: number; code?: string }; message?: string }
  if (e?.data?.httpStatus === 403) return true
  if (e?.data?.code === 'FORBIDDEN') return true
  const msg = String(e?.message || '')
  return (
    msg.includes('403') || msg.toLowerCase().includes('forbidden') || msg.toLowerCase().includes('active organization')
  )
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

// =============================================================================
// Component
// =============================================================================

export function RegulatoryFeed() {
  const trpc = useTRPC()
  const pollingOptions = useTRPCPollingOptions({ interval: POLLING_INTERVAL })

  const feedQuery = useQuery({
    ...trpc.dashboard.getRegulatoryFeed.queryOptions({ limit: 5 }),
    ...pollingOptions,
  })

  const { data, isLoading, error, dataUpdatedAt, refetch, isFetching } = feedQuery

  // Demo data for unauthenticated users
  const demoFeed = useMemo(() => {
    const now = new Date()
    const sixHoursAgo = new Date(now.getTime() - 1000 * 60 * 60 * 6)
    return [
      {
        id: 'd1',
        regulation: { name: 'DORA', framework: 'DORA' },
        articleId: 'Article 11(1)',
        severity: 'critical' as const,
        title: 'Demo: Monthly risk assessments required for major ICT providers',
        publishedAt: now.toISOString(),
      },
      {
        id: 'd2',
        regulation: { name: 'GDPR', framework: 'GDPR' },
        articleId: 'Article 35',
        severity: 'high' as const,
        title: 'Demo: DPIA requirements extended to AI processing',
        publishedAt: sixHoursAgo.toISOString(),
      },
    ]
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Regulatory Change Feed</h2>
        </div>
        <FeedItemSkeleton count={3} />
      </div>
    )
  }

  // No org error - show setup prompt
  if (error && isNoOrgError(error)) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Regulatory Change Feed</h2>
        </div>

        <Card className="border-dashed border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">Complete setup to view your feed</p>
              <p className="text-sm text-muted-foreground">Set up your organization to see regulatory changes.</p>
            </div>
            <Button asChild>
              <Link href="/dashboard/onboarding">Complete setup</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Auth error - show demo
  if (error && isAuthError(error)) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Regulatory Change Feed</h2>
          <span className="text-xs text-muted-foreground">Demo data</span>
        </div>

        <div className="space-y-3">
          {demoFeed.map((change) => (
            <FeedCard key={change.id} change={change} />
          ))}
        </div>

        <Card className="border-dashed">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">Sign in to view your feed</p>
              <p className="text-sm text-muted-foreground">See regulatory changes for your organization.</p>
            </div>
            <Button asChild>
              <Link href="/signin">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Other error
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Regulatory Change Feed</h2>
        </div>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <AlertTriangleIcon className="size-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Unable to load feed</p>
                <p className="text-sm text-muted-foreground">Please try again later.</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCwIcon className="mr-2 size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const changes = data ?? []

  return (
    <div className="space-y-4">
      {/* Header with refresh and status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Regulatory Change Feed</h2>
          <LiveIndicator isLive={!isFetching} pulse={false} label="" />
        </div>
        <div className="flex items-center gap-2">
          <LastUpdated date={dataUpdatedAt ? new Date(dataUpdatedAt) : null} />
          <Button variant="ghost" size="icon" className="size-8" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCwIcon className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="link" className="text-primary" asChild>
            <Link href="/dashboard/regulations">
              View all <ArrowRightIcon className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Feed content */}
      <div className="space-y-3">
        {changes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-3">
                <InboxIcon className="size-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-medium">No regulatory changes</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                When new regulatory changes are detected, they will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          changes.map((change) => <FeedCard key={change.id} change={change} />)
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Feed Card Component
// =============================================================================

interface FeedCardProps {
  change: {
    id: string | number
    regulation?: { name: string; framework?: string | null } | null
    articleId?: string | null
    severity: string
    title: string | null
    publishedAt: string | Date
  }
}

function FeedCard({ change }: FeedCardProps) {
  const regName = change.regulation?.name || 'Regulation'
  const publishedDate = new Date(change.publishedAt)

  return (
    <Card className="bg-card/50 transition-colors hover:bg-card/80">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn('font-medium', regulationStyles[regName] || 'bg-muted')}>
                {regName}
              </Badge>
              {change.articleId && <span className="text-sm text-muted-foreground">{change.articleId}</span>}
            </div>
            <p className="text-sm leading-relaxed">{change.title ?? 'Regulatory change'}</p>
            <p className="text-xs text-muted-foreground">{formatRelativeTime(publishedDate)}</p>
          </div>
          <Badge
            variant="outline"
            className={cn('shrink-0 capitalize', severityStyles[change.severity] || severityStyles.low)}
          >
            {change.severity}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
