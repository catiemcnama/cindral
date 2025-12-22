/**
 * Specialized Skeleton Components
 *
 * Pre-built skeletons that match our dashboard component layouts.
 * Use these for consistent loading states across the app.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// =============================================================================
// Dashboard Card Skeleton
// =============================================================================

interface DashboardCardSkeletonProps {
  /** Card title (optional, will show skeleton if not provided) */
  title?: string
  /** Number of content rows */
  rows?: number
  /** Height of content area */
  contentHeight?: string
  className?: string
}

export function DashboardCardSkeleton({ title, rows = 3, contentHeight, className }: DashboardCardSkeletonProps) {
  return (
    <Card className={cn('animate-pulse', className)}>
      <CardHeader className="pb-2">
        {title ? <CardTitle className="text-base font-medium">{title}</CardTitle> : <Skeleton className="h-5 w-32" />}
      </CardHeader>
      <CardContent className={contentHeight ? `h-[${contentHeight}]` : undefined}>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 flex-1" style={{ width: `${70 - i * 10}%` }} />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Stats Grid Skeleton
// =============================================================================

interface StatsGridSkeletonProps {
  /** Number of stat cards */
  count?: number
  /** Grid columns */
  columns?: 2 | 3 | 4
  className?: string
}

export function StatsGridSkeleton({ count = 4, columns = 2, className }: StatsGridSkeletonProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-6 w-full" />
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// Table Skeleton
// =============================================================================

interface TableSkeletonProps {
  /** Number of rows */
  rows?: number
  /** Number of columns */
  columns?: number
  /** Show header row */
  showHeader?: boolean
  className?: string
}

export function TableSkeleton({ rows = 5, columns = 4, showHeader = true, className }: TableSkeletonProps) {
  return (
    <div className={cn('w-full', className)}>
      {showHeader && (
        <div className="mb-4 flex gap-4 border-b pb-3">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 flex-1" style={{ opacity: 1 - rowIndex * 0.1 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Chart Skeleton
// =============================================================================

interface ChartSkeletonProps {
  /** Chart type for shape */
  type?: 'pie' | 'bar' | 'line' | 'area'
  /** Height of chart area */
  height?: string | number
  /** Show legend */
  showLegend?: boolean
  className?: string
}

export function ChartSkeleton({ type = 'pie', height = 200, showLegend = true, className }: ChartSkeletonProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center', className)} style={{ height }}>
      {type === 'pie' && (
        <>
          <div className="relative">
            <Skeleton className="size-32 rounded-full" />
            <div className="absolute inset-4">
              <Skeleton className="size-full rounded-full bg-background" />
            </div>
          </div>
          {showLegend && (
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="size-3 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {type === 'bar' && (
        <div className="flex h-full w-full items-end justify-around gap-2 pb-4">
          {/* Fixed heights to avoid impure Math.random() during render */}
          {[65, 45, 80, 55, 70, 40, 75].map((height, i) => (
            <Skeleton key={i} className="w-8 rounded-t" style={{ height: `${height}%` }} />
          ))}
        </div>
      )}

      {(type === 'line' || type === 'area') && (
        <div className="relative h-full w-full">
          <svg className="h-full w-full" viewBox="0 0 100 50" preserveAspectRatio="none">
            <path
              d="M0,40 Q10,35 20,38 T40,30 T60,35 T80,25 T100,30"
              fill="none"
              className="stroke-muted"
              strokeWidth="2"
            />
            {type === 'area' && (
              <path d="M0,40 Q10,35 20,38 T40,30 T60,35 T80,25 T100,30 L100,50 L0,50 Z" className="fill-muted/30" />
            )}
          </svg>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Feed Item Skeleton
// =============================================================================

interface FeedItemSkeletonProps {
  /** Number of items */
  count?: number
  /** Show badge */
  showBadge?: boolean
  className?: string
}

export function FeedItemSkeleton({ count = 3, showBadge = true, className }: FeedItemSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
              {showBadge && <Skeleton className="h-6 w-16 rounded-full" />}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// =============================================================================
// Alert Item Skeleton
// =============================================================================

export function AlertItemSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// Full Page Loading
// =============================================================================

export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DashboardCardSkeleton title="Loading..." rows={4} />
          <DashboardCardSkeleton rows={3} />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <StatsGridSkeleton count={4} columns={2} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <ChartSkeleton type="pie" height={200} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
