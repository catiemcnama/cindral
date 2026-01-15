'use client'

import {
  AlertCircleIcon,
  CheckCircleIcon,
  DownloadIcon,
  FileTextIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PackageIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// =============================================================================
// Helpers
// =============================================================================

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

// =============================================================================
// Types & Styles
// =============================================================================

type PackStatus = 'draft' | 'generating' | 'ready' | 'failed' | 'archived'
type PackAudience = 'internal' | 'auditor' | 'regulator'
type PackFormat = 'pdf' | 'confluence' | 'jira' | 'json'

const statusStyles: Record<PackStatus, { color: string; icon: typeof CheckCircleIcon }> = {
  draft: { color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: FileTextIcon },
  generating: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Loader2Icon },
  ready: { color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircleIcon },
  failed: { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: AlertCircleIcon },
  archived: { color: 'bg-muted text-muted-foreground border-muted', icon: PackageIcon },
}

const statusLabels: Record<PackStatus, string> = {
  draft: 'Draft',
  generating: 'Generating',
  ready: 'Ready',
  failed: 'Failed',
  archived: 'Archived',
}

const audienceLabels: Record<PackAudience, string> = {
  internal: 'Internal',
  auditor: 'Auditor',
  regulator: 'Regulator',
}

const formatLabels: Record<PackFormat, string> = {
  pdf: 'PDF',
  confluence: 'Confluence',
  jira: 'Jira',
  json: 'JSON',
}

// =============================================================================
// Component
// =============================================================================

export default function EvidencePacksPage() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<PackStatus | 'all'>('all')
  const [audienceFilter, setAudienceFilter] = useState<PackAudience | 'all'>('all')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // Query
  const packsQuery = useQuery({
    ...trpc.evidencePacks.list.queryOptions({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      intendedAudience: audienceFilter !== 'all' ? audienceFilter : undefined,
      limit: 50,
    }),
    staleTime: 30000,
  })

  const { data, isLoading, error, refetch, isFetching } = packsQuery
  const items = data?.items

  // Mutations
  const deleteMutation = useMutation({
    ...trpc.evidencePacks.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.evidencePacks.list.queryKey() })
      toast.success('Evidence pack deleted')
    },
    onError: (error) => {
      toast.error('Failed to delete evidence pack', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    },
  })

  // Filter by search
  const filteredPacks = useMemo(() => {
    if (!items) return []
    if (!searchQuery) return items

    const q = searchQuery.toLowerCase()
    return items.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.regulation?.name?.toLowerCase().includes(q) ||
        p.exportFormat?.toLowerCase().includes(q)
    )
  }, [items, searchQuery])

  const handleDelete = useCallback(() => {
    if (deleteId !== null) {
      deleteMutation.mutate({ id: deleteId })
      setDeleteId(null)
    }
  }, [deleteMutation, deleteId])

  const stats = data?.stats ?? { draft: 0, ready: 0, failed: 0 }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Evidence Pack?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this evidence pack. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <PackageIcon className="size-6" />
            Evidence Packs
          </h1>
          <p className="text-sm text-muted-foreground">Generate compliance evidence for audits and regulators</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCwIcon className={cn('mr-2 size-4', isFetching && 'animate-spin')} />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/dashboard/evidence-packs/generate">
              <PlusIcon className="mr-2 size-4" />
              Generate Pack
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready</CardTitle>
            <CheckCircleIcon className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ready}</div>
            <p className="text-xs text-muted-foreground">Available for download</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <FileTextIcon className="size-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">Awaiting generation</p>
          </CardContent>
        </Card>
        <Card className={stats.failed > 0 ? 'border-red-500/20 bg-red-500/5' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={cn('text-sm font-medium', stats.failed > 0 && 'text-red-500')}>Failed</CardTitle>
            <AlertCircleIcon className={cn('size-4', stats.failed > 0 ? 'text-red-500' : 'text-muted-foreground')} />
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold', stats.failed > 0 && 'text-red-500')}>{stats.failed}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative w-64">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search packs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PackStatus | 'all')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="generating">Generating</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        {/* Audience Filter */}
        <Select value={audienceFilter} onValueChange={(v) => setAudienceFilter(v as PackAudience | 'all')}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Audience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Audiences</SelectItem>
            <SelectItem value="internal">Internal</SelectItem>
            <SelectItem value="auditor">Auditor</SelectItem>
            <SelectItem value="regulator">Regulator</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {(statusFilter !== 'all' || audienceFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter('all')
              setAudienceFilter('all')
            }}
          >
            <XIcon className="mr-1 size-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        {isLoading ? (
          <div className="p-8">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          </div>
        ) : error && isNoOrgError(error) ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">Complete setup to view evidence packs</p>
            <Button size="sm" className="mt-3" asChild>
              <Link href="/dashboard/onboarding">Complete setup</Link>
            </Button>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircleIcon className="size-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">Failed to load evidence packs</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : filteredPacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <PackageIcon className="size-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm font-medium">No evidence packs found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Generate your first evidence pack to get started'}
            </p>
            {!searchQuery && (
              <Button asChild className="mt-4">
                <Link href="/dashboard/evidence-packs/generate">
                  <PlusIcon className="mr-2 size-4" />
                  Generate Pack
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="w-28">Regulation</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-24">Format</TableHead>
                <TableHead className="w-24">Audience</TableHead>
                <TableHead className="w-32">Generated</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPacks.map((pack) => {
                const statusStyle = statusStyles[pack.status as PackStatus]
                const StatusIcon = statusStyle?.icon ?? FileTextIcon

                return (
                  <TableRow key={pack.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                          <FileTextIcon className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{pack.title}</p>
                          {pack.description && (
                            <p className="max-w-xs truncate text-xs text-muted-foreground">{pack.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {pack.regulation?.name && <Badge variant="outline">{pack.regulation.name}</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('gap-1', statusStyle?.color)}>
                        <StatusIcon className={cn('size-3', pack.status === 'generating' && 'animate-spin')} />
                        {statusLabels[pack.status as PackStatus] ?? pack.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatLabels[pack.exportFormat as PackFormat] ?? pack.exportFormat}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {audienceLabels[pack.intendedAudience as PackAudience] ?? pack.intendedAudience}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {pack.generatedAt ? new Date(pack.generatedAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontalIcon className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {pack.status === 'ready' && (
                            <DropdownMenuItem
                              onClick={() => {
                                // In production, this would trigger actual file download
                                alert(
                                  `Download for "${pack.title}" coming soon!\n\nFormat: ${pack.exportFormat?.toUpperCase() || 'JSON'}`
                                )
                              }}
                            >
                              <DownloadIcon className="mr-2 size-4" />
                              Download
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/evidence-packs/${pack.id}`}>View Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(pack.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2Icon className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination placeholder */}
      {data && data.total > 50 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredPacks.length} of {data.total}
          </p>
        </div>
      )}
    </div>
  )
}
