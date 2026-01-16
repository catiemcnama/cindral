'use client'

import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CheckSquareIcon,
  ChevronDownIcon,
  ClockIcon,
  DownloadIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
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

type ObligationStatus = 'not_started' | 'in_progress' | 'implemented' | 'under_review' | 'verified'

const statusStyles: Record<ObligationStatus, { color: string; icon: typeof CheckCircle2Icon }> = {
  not_started: { color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: ClockIcon },
  in_progress: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: ClockIcon },
  implemented: { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: CheckCircle2Icon },
  under_review: { color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: AlertCircleIcon },
  verified: { color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2Icon },
}

const statusLabels: Record<ObligationStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  implemented: 'Implemented',
  under_review: 'Under Review',
  verified: 'Verified',
}

const STATUS_ORDER: ObligationStatus[] = ['not_started', 'in_progress', 'implemented', 'under_review', 'verified']

// =============================================================================
// Component
// =============================================================================

export default function ObligationsPage() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  // State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ObligationStatus | 'all'>('all')
  const [regulationFilter, setRegulationFilter] = useState<string | 'all'>('all')

  // Pagination
  const [page, setPage] = useState(0)
  const [pageSize] = useState(25)

  // Query obligations
  const obligationsQuery = useQuery({
    ...trpc.obligations.list.queryOptions({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      regulationId: regulationFilter !== 'all' ? regulationFilter : undefined,
      limit: pageSize,
      offset: page * pageSize,
    }),
    staleTime: 30000,
  })

  // Query regulations for filter
  const regulationsQuery = useQuery({
    ...trpc.regulations.list.queryOptions({ limit: 50 }),
    staleTime: 60000,
  })

  const { data, isLoading, error, refetch, isFetching } = obligationsQuery

  // Mutations with optimistic updates for instant UI feedback
  const bulkStatusMutation = useMutation({
    ...trpc.obligations.bulkUpdateStatus.mutationOptions(),
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: trpc.obligations.list.queryKey() })

      // Snapshot previous value
      const previousData = queryClient.getQueryData(
        trpc.obligations.list.queryKey({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          regulationId: regulationFilter !== 'all' ? regulationFilter : undefined,
          limit: pageSize,
          offset: page * pageSize,
        })
      )

      // Optimistically update the cache
      queryClient.setQueryData(
        trpc.obligations.list.queryKey({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          regulationId: regulationFilter !== 'all' ? regulationFilter : undefined,
          limit: pageSize,
          offset: page * pageSize,
        }),
        (old: typeof previousData) => {
          if (!old) return old
          return {
            ...old,
            items: old.items.map((item: { id: string; status: string }) =>
              variables.ids.includes(item.id) ? { ...item, status: variables.status } : item
            ),
          }
        }
      )

      return { previousData }
    },
    onError: (_err, _variables, context) => {
      // Roll back on error
      if (context?.previousData) {
        queryClient.setQueryData(
          trpc.obligations.list.queryKey({
            status: statusFilter !== 'all' ? statusFilter : undefined,
            regulationId: regulationFilter !== 'all' ? regulationFilter : undefined,
            limit: pageSize,
            offset: page * pageSize,
          }),
          context.previousData
        )
      }
      toast.error('Failed to update obligations', {
        description: 'Changes have been reverted. Please try again.',
      })
    },
    onSuccess: (_data, variables) => {
      const count = variables.ids.length
      const statusLabel = statusLabels[variables.status as ObligationStatus] || variables.status
      toast.success(`Updated ${count} obligation${count === 1 ? '' : 's'}`, {
        description: `Status changed to "${statusLabel}"`,
      })
      setSelectedIds(new Set())
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: trpc.obligations.list.queryKey() })
    },
  })

  // Handlers
  const items = data?.items
  const handleSelectAll = useCallback(() => {
    if (!items) return
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map((o) => o.id)))
    }
  }, [items, selectedIds.size])

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleBulkStatus = useCallback(
    (status: ObligationStatus) => {
      bulkStatusMutation.mutate({
        ids: Array.from(selectedIds),
        status,
      })
    },
    [selectedIds, bulkStatusMutation]
  )

  // Filter by search
  const filteredObligations = useMemo(() => {
    if (!items) return []
    if (!searchQuery) return items

    const q = searchQuery.toLowerCase()
    return items.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.title.toLowerCase().includes(q) ||
        o.article?.regulation?.name?.toLowerCase().includes(q)
    )
  }, [items, searchQuery])

  const hasSelection = selectedIds.size > 0
  const allSelected = items && selectedIds.size === items.length

  // Stats
  const stats = data?.stats ?? {
    total: 0,
    notStarted: 0,
    inProgress: 0,
    implemented: 0,
    underReview: 0,
    verified: 0,
  }

  const compliantCount = stats.verified + stats.implemented
  const complianceRate = stats.total > 0 ? Math.round((compliantCount / stats.total) * 100) : 0

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <CheckSquareIcon className="size-6" />
            Obligations
          </h1>
          <p className="text-sm text-muted-foreground">Track and manage compliance obligations across regulations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCwIcon className={cn('mr-2 size-4', isFetching && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <DownloadIcon className="mr-2 size-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceRate}%</div>
            <Progress value={complianceRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Started</CardTitle>
            <div className="size-3 rounded-full bg-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.notStarted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <div className="size-3 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <div className="size-3 rounded-full bg-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.underReview}</div>
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-500">Verified</CardTitle>
            <CheckCircle2Icon className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{stats.verified}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-64">
            <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search obligations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ObligationStatus | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="implemented">Implemented</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
            </SelectContent>
          </Select>

          {/* Regulation Filter */}
          <Select value={regulationFilter} onValueChange={(v) => setRegulationFilter(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Regulation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regulations</SelectItem>
              {regulationsQuery.data?.items.map((reg) => (
                <SelectItem key={reg.id} value={reg.id}>
                  {reg.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {(statusFilter !== 'all' || regulationFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter('all')
                setRegulationFilter('all')
              }}
            >
              <XIcon className="mr-1 size-3" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {hasSelection && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="mx-2 h-4 w-px bg-border" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Change Status
                <ChevronDownIcon className="ml-1 size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {STATUS_ORDER.map((status) => (
                <DropdownMenuItem key={status} onClick={() => handleBulkStatus(status)}>
                  {statusLabels[status]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            Clear Selection
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border">
        {isLoading ? (
          <div className="p-8">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          </div>
        ) : error && isNoOrgError(error) ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">Complete setup to view obligations</p>
            <Button size="sm" className="mt-3" asChild>
              <Link href="/dashboard/onboarding">Complete setup</Link>
            </Button>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircleIcon className="size-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">Failed to load obligations</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : filteredObligations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckSquareIcon className="size-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm font-medium">No obligations found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Try adjusting your search or filters' : 'Obligations will appear here after ingestion'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} aria-label="Select all" />
                </TableHead>
                <TableHead className="w-36">ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-28">Regulation</TableHead>
                <TableHead className="w-20">Article</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-28">Due Date</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredObligations.map((obligation) => {
                const statusStyle = statusStyles[obligation.status as ObligationStatus]
                const StatusIcon = statusStyle?.icon ?? ClockIcon
                const isDue = obligation.dueDate && new Date(obligation.dueDate) < new Date()

                return (
                  <TableRow key={obligation.id} className="cursor-pointer">
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(obligation.id)}
                        onCheckedChange={() => handleSelectOne(obligation.id)}
                        aria-label={`Select ${obligation.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <Link href={`/dashboard/obligations/${obligation.id}`} className="hover:underline">
                        {obligation.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/obligations/${obligation.id}`} className="block">
                        <p className="max-w-md truncate font-medium hover:underline">{obligation.title}</p>
                        {obligation.summary && (
                          <p className="max-w-md truncate text-xs text-muted-foreground">{obligation.summary}</p>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {obligation.article?.regulation?.name && (
                        <Badge variant="outline">{obligation.article.regulation.name}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {obligation.article?.articleNumber ?? '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('gap-1', statusStyle?.color)}>
                        <StatusIcon className="size-3" />
                        {statusLabels[obligation.status as ObligationStatus] ?? obligation.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {obligation.dueDate ? (
                        <span className={cn('text-sm', isDue && 'font-medium text-red-500')}>
                          {new Date(obligation.dueDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontalIcon className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/obligations/${obligation.id}`}>View Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {STATUS_ORDER.map((status) => (
                            <DropdownMenuItem
                              key={status}
                              onClick={() => bulkStatusMutation.mutate({ ids: [obligation.id], status })}
                              disabled={obligation.status === status}
                            >
                              Mark as {statusLabels[status]}
                            </DropdownMenuItem>
                          ))}
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

      {/* Pagination */}
      {data && data.total > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, data.total)} of {data.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * pageSize >= data.total}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
