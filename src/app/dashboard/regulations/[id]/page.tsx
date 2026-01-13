'use client'

import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  Loader2Icon,
  NetworkIcon,
  RefreshCwIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'

// =============================================================================
// Types & Styles
// =============================================================================

const impactStyles: Record<string, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-blue-400',
}

const statusStyles: Record<string, { label: string; className: string }> = {
  not_started: { label: 'Not Started', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  in_progress: { label: 'In Progress', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  implemented: { label: 'Implemented', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  under_review: { label: 'Under Review', className: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  verified: { label: 'Verified', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
}

// =============================================================================
// Component
// =============================================================================

export default function RegulationDetailPage() {
  const params = useParams()
  const trpc = useTRPC()

  const regulationId = typeof params.id === 'string' ? params.id : ''

  const regulationQuery = useQuery({
    ...trpc.regulations.getById.queryOptions({ id: regulationId }),
    enabled: !!regulationId,
  })

  const { data: regulation, isLoading, error, refetch, isFetching } = regulationQuery

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  // Error state
  if (error || !regulation) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <FileTextIcon className="size-12 text-muted-foreground/50" />
        <h2 className="mt-4 text-lg font-medium">Regulation not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The regulation you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/regulations">
            <ArrowLeftIcon className="mr-2 size-4" />
            Back to Regulations
          </Link>
        </Button>
      </div>
    )
  }

  const compliancePercent = regulation.compliancePercent ?? 0
  const stats = regulation.obligationStats ?? {
    total: 0,
    notStarted: 0,
    inProgress: 0,
    implemented: 0,
    underReview: 0,
    verified: 0,
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/regulations">Regulations</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{regulation.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{regulation.name}</h1>
            <Badge variant="outline">{regulation.jurisdiction ?? 'Global'}</Badge>
            {regulation.status && (
              <Badge variant="secondary" className="capitalize">
                {regulation.status}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-muted-foreground">{regulation.fullTitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCwIcon className={cn('mr-2 size-4', isFetching && 'animate-spin')} />
            Refresh
          </Button>
          {regulation.sourceUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={regulation.sourceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon className="mr-2 size-4" />
                Source
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/evidence-packs/generate?regulationId=${regulation.id}`}>
              <DownloadIcon className="mr-2 size-4" />
              Generate Evidence Pack
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column - Regulation details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Regulation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground">Framework</div>
                <div className="text-sm font-medium">{regulation.framework ?? '-'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Version</div>
                <div className="text-sm">{regulation.version ?? '-'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Jurisdiction</div>
                <div className="flex items-center gap-2 text-sm">{regulation.jurisdiction ?? 'Global'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Effective Date</div>
                <div className="text-sm">
                  {regulation.effectiveDate ? new Date(regulation.effectiveDate).toLocaleDateString() : '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Last Updated</div>
                <div className="text-sm">
                  {regulation.lastUpdated ? new Date(regulation.lastUpdated).toLocaleDateString() : '-'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compliance Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overall Progress</span>
                <span className="text-2xl font-bold">{compliancePercent}%</span>
              </div>
              <Progress value={compliancePercent} className="h-2" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg bg-slate-500/10 p-2 text-center">
                  <div className="text-lg font-semibold">{stats.notStarted}</div>
                  <div className="text-xs text-muted-foreground">Not Started</div>
                </div>
                <div className="rounded-lg bg-blue-500/10 p-2 text-center">
                  <div className="text-lg font-semibold">{stats.inProgress}</div>
                  <div className="text-xs text-muted-foreground">In Progress</div>
                </div>
                <div className="rounded-lg bg-amber-500/10 p-2 text-center">
                  <div className="text-lg font-semibold">{stats.implemented}</div>
                  <div className="text-xs text-muted-foreground">Implemented</div>
                </div>
                <div className="rounded-lg bg-emerald-500/10 p-2 text-center">
                  <div className="text-lg font-semibold">{stats.verified}</div>
                  <div className="text-xs text-muted-foreground">Verified</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle column - Articles */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{regulation.name} Articles</h2>
            <Badge variant="outline">{regulation.articles?.length ?? 0} articles</Badge>
          </div>

          <div className="space-y-3">
            {!regulation.articles || regulation.articles.length === 0 ? (
              <Card className="bg-card/50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileTextIcon className="size-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No articles found</p>
                  <p className="text-xs text-muted-foreground">Articles will appear here after ingestion</p>
                </CardContent>
              </Card>
            ) : (
              regulation.articles.slice(0, 10).map((article) => {
                const obligationCount = article.obligations?.length ?? 0
                const completedCount =
                  article.obligations?.filter((o) => o.status === 'verified' || o.status === 'implemented').length ?? 0

                return (
                  <Card key={article.id} className="bg-card/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-blue-500/20 bg-blue-500/10 text-blue-400">
                              Article {article.articleNumber}
                            </Badge>
                            {article.sectionTitle && (
                              <span className="text-xs text-muted-foreground">{article.sectionTitle}</span>
                            )}
                          </div>
                          {article.title && <p className="text-sm">{article.title}</p>}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{obligationCount} obligations</span>
                            {obligationCount > 0 && (
                              <>
                                <span>•</span>
                                <span>
                                  {completedCount}/{obligationCount} complete
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}

            {regulation.articles && regulation.articles.length > 10 && (
              <p className="text-center text-sm text-muted-foreground">
                And {regulation.articles.length - 10} more articles...
              </p>
            )}
          </div>

          {/* Recent Changes */}
          {regulation.regulatoryChanges && regulation.regulatoryChanges.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent Changes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {regulation.regulatoryChanges.slice(0, 3).map((change) => (
                  <div key={change.id} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                    <AlertTriangleIcon className="mt-0.5 size-4 text-amber-500" />
                    <div className="flex-1">
                      <p className="text-sm">{change.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {change.publishedAt ? new Date(change.publishedAt).toLocaleDateString() : 'Unknown date'}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'capitalize',
                        change.severity === 'critical'
                          ? 'bg-red-500/10 text-red-500'
                          : change.severity === 'high'
                            ? 'bg-orange-500/10 text-orange-500'
                            : 'bg-yellow-500/10 text-yellow-500'
                      )}
                    >
                      {change.severity}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Systems & Actions */}
        <div className="space-y-6">
          {/* Affected Systems */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Affected Systems</CardTitle>
              <CardDescription>{regulation.impactedSystems?.length ?? 0} systems mapped</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {!regulation.impactedSystems || regulation.impactedSystems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <NetworkIcon className="size-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No systems mapped yet</p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <Link href="/dashboard/system-map">Configure System Map</Link>
                  </Button>
                </div>
              ) : (
                regulation.impactedSystems.map((system) => (
                  <div key={system.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'size-2 rounded-full',
                          system.criticality === 'core'
                            ? 'bg-red-400'
                            : system.criticality === 'important'
                              ? 'bg-amber-400'
                              : 'bg-blue-400'
                        )}
                      />
                      <div>
                        <div className="text-sm font-medium">{system.name}</div>
                        {system.impactLevel && (
                          <div
                            className={cn(
                              'text-xs capitalize',
                              impactStyles[system.impactLevel] || 'text-muted-foreground'
                            )}
                          >
                            {system.impactLevel} Impact
                          </div>
                        )}
                      </div>
                    </div>
                    {system.criticality && (
                      <Badge variant="outline" className="capitalize">
                        {system.criticality}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/dashboard/obligations?regulationId=${regulation.id}`}>View Obligations</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/system-map">View System Map</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/dashboard/evidence-packs/generate?regulationId=${regulation.id}`}>
                  Generate Evidence Pack
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
