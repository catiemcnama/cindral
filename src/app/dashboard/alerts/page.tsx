'use client'

import {
  BellIcon,
  ChevronDownIcon,
  DownloadIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
  UserIcon,
  XIcon,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertDetailSheet } from './_components/alert-detail-sheet'

// =============================================================================
// Types
// =============================================================================

type AlertStatus = 'open' | 'in_triage' | 'in_progress' | 'resolved' | 'wont_fix'
type AlertSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical'
type AlertType = 'obligation_overdue' | 'regulation_changed' | 'evidence_pack_failed' | 'system_unmapped'

// =============================================================================
// Styles
// =============================================================================

const severityStyles: Record<AlertSeverity, string> = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-black',
  low: 'bg-blue-500 text-white',
  info: 'bg-slate-500 text-white',
}

const statusStyles: Record<AlertStatus, string> = {
  open: 'bg-red-500/10 text-red-500 border-red-500/20',
  in_triage: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  wont_fix: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

const statusLabels: Record<AlertStatus, string> = {
  open: 'Open',
  in_triage: 'In Triage',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  wont_fix: "Won't Fix",
}

// =============================================================================
// Component
// =============================================================================

export default function AlertsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  // State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [detailAlertId, setDetailAlertId] = useState<string | null>(searchParams.get('id'))

  // Filters
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<AlertType | 'all'>('all')

  // Pagination
  const [page, setPage] = useState(0)
  const pageSize = 20 // Fixed page size for now
  const [sortBy, setSortBy] = useState<'createdAt' | 'severity' | 'status' | 'dueDate'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Query
  const alertsQuery = useQuery({
    ...trpc.alerts.list.queryOptions({
      severity: severityFilter !== 'all' ? severityFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      limit: pageSize,
      offset: page * pageSize,
      sortBy,
      sortOrder,
    }),
    staleTime: 30000,
  })

  const { data, isLoading, error, refetch, isFetching } = alertsQuery
  const items = data?.items

  // Mutations
  const bulkStatusMutation = useMutation({
    ...trpc.alerts.bulkUpdateStatus.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.alerts.list.queryKey() })
      setSelectedIds(new Set())
    },
  })

  // Handlers
  const handleSelectAll = useCallback(() => {
    if (!items) return
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map((a) => a.id)))
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
    (status: AlertStatus) => {
      bulkStatusMutation.mutate({
        ids: Array.from(selectedIds),
        status,
      })
    },
    [selectedIds, bulkStatusMutation]
  )

  const handleOpenDetail = useCallback(
    (id: string) => {
      setDetailAlertId(id)
      router.push(`/dashboard/alerts?id=${id}`, { scroll: false })
    },
    [router]
  )

  const handleCloseDetail = useCallback(() => {
    setDetailAlertId(null)
    router.push('/dashboard/alerts', { scroll: false })
  }, [router])

  // Filter and search
  const filteredAlerts = useMemo(() => {
    if (!items) return []
    if (!searchQuery) return items

    const q = searchQuery.toLowerCase()
    return items.filter(
      (a) =>
        a.id.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.regulation?.name?.toLowerCase().includes(q)
    )
  }, [items, searchQuery])

  const hasSelection = selectedIds.size > 0
  const allSelected = items && selectedIds.size === items.length

  // Stats
  const stats = data?.stats ?? { open: 0, inTriage: 0, inProgress: 0, critical: 0 }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <BellIcon className="size-6" />
            Alerts Center
          </h1>
          <p className="text-sm text-muted-foreground">Monitor and manage compliance alerts across your organization</p>
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <div className="size-4 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Triage</CardTitle>
            <div className="size-4 rounded-full bg-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inTriage}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <div className="size-4 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-500">Critical</CardTitle>
            <div className="size-4 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.critical}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-64">
            <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Severity Filter */}
          <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as AlertSeverity | 'all')}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AlertStatus | 'all')}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_triage">In Triage</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="wont_fix">Won&apos;t Fix</SelectItem>
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as AlertType | 'all')}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="obligation_overdue">Obligation Overdue</SelectItem>
              <SelectItem value="regulation_changed">Regulation Changed</SelectItem>
              <SelectItem value="evidence_pack_failed">Evidence Pack Failed</SelectItem>
              <SelectItem value="system_unmapped">System Unmapped</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {(severityFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSeverityFilter('all')
                setStatusFilter('all')
                setTypeFilter('all')
              }}
            >
              <XIcon className="mr-1 size-3" />
              Clear
            </Button>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created</SelectItem>
              <SelectItem value="severity">Severity</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="dueDate">Due Date</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}>
            <ChevronDownIcon className={cn('size-4 transition', sortOrder === 'asc' && 'rotate-180')} />
          </Button>
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
              <DropdownMenuItem onClick={() => handleBulkStatus('open')}>Open</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkStatus('in_triage')}>In Triage</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkStatus('in_progress')}>In Progress</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkStatus('resolved')}>Resolved</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkStatus('wont_fix')}>Won&apos;t Fix</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm">
            <UserIcon className="mr-2 size-4" />
            Assign
          </Button>
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
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 flex-1" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">Failed to load alerts</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <BellIcon className="size-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm font-medium">No alerts found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Try adjusting your search or filters' : 'All clear! No alerts to show.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} aria-label="Select all" />
                </TableHead>
                <TableHead className="w-24">ID</TableHead>
                <TableHead className="w-24">Severity</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-32">Regulation</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-40">Assigned To</TableHead>
                <TableHead className="w-32">Created</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.map((alert) => (
                <TableRow key={alert.id} className="cursor-pointer" onClick={() => handleOpenDetail(alert.id)}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(alert.id)}
                      onCheckedChange={() => handleSelectOne(alert.id)}
                      aria-label={`Select ${alert.id}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{alert.id}</TableCell>
                  <TableCell>
                    <Badge className={cn('capitalize', severityStyles[alert.severity])}>{alert.severity}</Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate">{alert.title}</TableCell>
                  <TableCell>
                    {alert.regulation?.name && <Badge variant="outline">{alert.regulation.name}</Badge>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusStyles[alert.status]}>
                      {statusLabels[alert.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {alert.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarImage src={alert.assignedTo.image ?? undefined} />
                          <AvatarFallback className="text-xs">{alert.assignedTo.name?.charAt(0) ?? '?'}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{alert.assignedTo.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDetail(alert.id)}>View Details</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2Icon className="mr-2 size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
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

      {/* Detail Sheet */}
      <AlertDetailSheet alertId={detailAlertId} open={!!detailAlertId} onClose={handleCloseDetail} />
    </div>
  )
}
