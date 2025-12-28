'use client'

import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
  DownloadIcon,
  FileTextIcon,
  Loader2Icon,
  RefreshCwIcon,
  Trash2Icon,
  UserIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// =============================================================================
// Types & Styles
// =============================================================================

type PackStatus = 'draft' | 'generating' | 'ready' | 'failed' | 'archived'

const statusStyles: Record<PackStatus, string> = {
  draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  generating: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  ready: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  failed: 'bg-red-500/10 text-red-500 border-red-500/20',
  archived: 'bg-muted text-muted-foreground border-muted',
}

const statusLabels: Record<PackStatus, string> = {
  draft: 'Draft',
  generating: 'Generating',
  ready: 'Ready',
  failed: 'Failed',
  archived: 'Archived',
}

const obligationStatusStyles: Record<string, string> = {
  not_started: 'bg-slate-500/10 text-slate-500',
  in_progress: 'bg-blue-500/10 text-blue-500',
  implemented: 'bg-emerald-500/10 text-emerald-500',
  under_review: 'bg-amber-500/10 text-amber-500',
  verified: 'bg-emerald-500/10 text-emerald-600',
}

// =============================================================================
// Component
// =============================================================================

export default function EvidencePackDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  const packId = typeof params.id === 'string' ? parseInt(params.id, 10) : NaN

  // Query
  const packQuery = useQuery({
    ...trpc.evidencePacks.getById.queryOptions({ id: packId }),
    enabled: !isNaN(packId),
  })

  const { data: pack, isLoading, error, refetch, isFetching } = packQuery

  // Mutations
  const deleteMutation = useMutation({
    ...trpc.evidencePacks.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.evidencePacks.list.queryKey() })
      router.push('/dashboard/evidence-packs')
    },
  })

  const handleDelete = useCallback(() => {
    if (confirm('Are you sure you want to delete this evidence pack? This action cannot be undone.')) {
      deleteMutation.mutate({ id: packId })
    }
  }, [deleteMutation, packId])

  const handleDownload = useCallback(() => {
    // In production, this would trigger a file download
    // For now, we'll just show an alert
    alert('Download functionality coming soon! The evidence pack will be available in the selected format.')
  }, [])

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (error || !pack) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <FileTextIcon className="size-12 text-muted-foreground/50" />
        <h2 className="mt-4 text-lg font-medium">Evidence pack not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The evidence pack you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/evidence-packs">
            <ArrowLeftIcon className="mr-2 size-4" />
            Back to Evidence Packs
          </Link>
        </Button>
      </div>
    )
  }

  const status = (pack.status as PackStatus) || 'draft'

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/evidence-packs">
              <ArrowLeftIcon className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{pack.title}</h1>
              <Badge variant="outline" className={cn('capitalize', statusStyles[status])}>
                {statusLabels[status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {pack.description || 'No description provided'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCwIcon className={cn('mr-2 size-4', isFetching && 'animate-spin')} />
            Refresh
          </Button>
          {status === 'ready' && (
            <Button onClick={handleDownload}>
              <DownloadIcon className="mr-2 size-4" />
              Download
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <Loader2Icon className="mr-2 size-4 animate-spin" />
            ) : (
              <Trash2Icon className="mr-2 size-4" />
            )}
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pack Details */}
          <Card>
            <CardHeader>
              <CardTitle>Pack Details</CardTitle>
              <CardDescription>Information about this evidence pack</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Regulation</dt>
                  <dd className="mt-1">
                    {pack.regulation ? (
                      <Badge variant="outline">{pack.regulation.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground">Not specified</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Format</dt>
                  <dd className="mt-1 font-medium uppercase">{pack.exportFormat || 'JSON'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Intended Audience</dt>
                  <dd className="mt-1 capitalize">{pack.intendedAudience || 'Internal'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Framework</dt>
                  <dd className="mt-1">{pack.framework || pack.regulation?.framework || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Jurisdiction</dt>
                  <dd className="mt-1">{pack.jurisdiction || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">System</dt>
                  <dd className="mt-1">{pack.system?.name || 'All systems'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Related Obligations */}
          <Card>
            <CardHeader>
              <CardTitle>Related Obligations</CardTitle>
              <CardDescription>
                Obligations covered by this evidence pack ({pack.obligations?.length || 0} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!pack.obligations || pack.obligations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircleIcon className="size-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No obligations linked to this pack</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead className="w-32">Article</TableHead>
                      <TableHead className="w-28">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pack.obligations.slice(0, 10).map((obligation) => (
                      <TableRow key={obligation.id}>
                        <TableCell className="font-medium">{obligation.title}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {obligation.articleId || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              'capitalize',
                              obligationStatusStyles[obligation.status] || obligationStatusStyles.not_started
                            )}
                          >
                            {obligation.status?.replace('_', ' ') || 'Not Started'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {pack.obligations && pack.obligations.length > 10 && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  And {pack.obligations.length - 10} more obligations...
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <CalendarIcon className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Generated</p>
                  <p className="text-xs text-muted-foreground">
                    {pack.generatedAt
                      ? new Date(pack.generatedAt).toLocaleString()
                      : 'Not generated yet'}
                  </p>
                </div>
              </div>
              {pack.lastGeneratedAt && (
                <div className="flex items-center gap-3">
                  <RefreshCwIcon className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(pack.lastGeneratedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              <Separator />
              <div className="flex items-center gap-3">
                <UserIcon className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Requested By</p>
                  <p className="text-xs text-muted-foreground">
                    {pack.requestedBy?.name || pack.requestedBy?.email || 'Unknown'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {status === 'ready' && (
                <Button className="w-full" onClick={handleDownload}>
                  <DownloadIcon className="mr-2 size-4" />
                  Download Pack
                </Button>
              )}
              {status === 'draft' && (
                <Button className="w-full" disabled>
                  <Loader2Icon className="mr-2 size-4" />
                  Generate Pack
                </Button>
              )}
              {pack.regulation && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/dashboard/regulations/${pack.regulation.id}`}>
                    View Regulation
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

