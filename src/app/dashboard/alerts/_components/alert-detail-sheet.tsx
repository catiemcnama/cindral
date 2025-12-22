'use client'

import {
  AlertTriangleIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  ClockIcon,
  FileTextIcon,
  LinkIcon,
  Loader2Icon,
  MessageSquareIcon,
  NetworkIcon,
  UserIcon,
  XCircleIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// =============================================================================
// Types
// =============================================================================

interface AlertDetailSheetProps {
  alertId: string | null
  open: boolean
  onClose: () => void
}

type AlertStatus = 'open' | 'in_triage' | 'in_progress' | 'resolved' | 'wont_fix'
type AlertSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical'

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

const STATUS_WORKFLOW: AlertStatus[] = ['open', 'in_triage', 'in_progress', 'resolved']

// =============================================================================
// Component
// =============================================================================

export function AlertDetailSheet({ alertId, open, onClose }: AlertDetailSheetProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [resolutionNotes, setResolutionNotes] = useState('')

  // Query
  const {
    data: alert,
    isLoading,
    error,
  } = useQuery({
    ...trpc.alerts.getById.queryOptions({ id: alertId! }),
    enabled: !!alertId && open,
  })

  // Mutations
  const updateStatusMutation = useMutation({
    ...trpc.alerts.updateStatus.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.alerts.list.queryKey() })
      queryClient.invalidateQueries({ queryKey: trpc.alerts.getById.queryKey({ id: alertId! }) })
      setResolutionNotes('')
    },
  })

  const assignMutation = useMutation({
    ...trpc.alerts.assign.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.alerts.list.queryKey() })
      queryClient.invalidateQueries({ queryKey: trpc.alerts.getById.queryKey({ id: alertId! }) })
    },
  })

  // Handlers
  const handleStatusChange = useCallback(
    (newStatus: AlertStatus) => {
      if (!alertId) return

      const needsNotes = newStatus === 'resolved' || newStatus === 'wont_fix'

      updateStatusMutation.mutate({
        id: alertId,
        status: newStatus,
        resolutionNotes: needsNotes ? resolutionNotes : undefined,
      })
    },
    [alertId, resolutionNotes, updateStatusMutation]
  )

  const currentStatusIndex = alert ? STATUS_WORKFLOW.indexOf(alert.status) : -1

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {isLoading ? (
          <div className="space-y-6 pt-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center">
            <AlertTriangleIcon className="size-12 text-destructive" />
            <p className="mt-4 text-sm">Failed to load alert</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : alert ? (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <Badge className={cn('capitalize', severityStyles[alert.severity])}>{alert.severity}</Badge>
                <Badge variant="outline" className={statusStyles[alert.status]}>
                  {statusLabels[alert.status]}
                </Badge>
              </div>
              <SheetTitle className="text-left">{alert.title}</SheetTitle>
              <SheetDescription className="text-left">
                <span className="font-mono">{alert.id}</span>
                <span className="mx-2">•</span>
                Created {new Date(alert.createdAt).toLocaleDateString()}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Status Workflow */}
              <div className="space-y-3">
                <Label>Status Workflow</Label>
                <div className="flex items-center gap-1">
                  {STATUS_WORKFLOW.map((status, idx) => {
                    const isActive = status === alert.status
                    const isPast = idx < currentStatusIndex
                    const isFuture = idx > currentStatusIndex

                    return (
                      <div key={status} className="flex flex-1 items-center">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(status)}
                          disabled={updateStatusMutation.isPending}
                          className={cn(
                            'flex h-10 flex-1 items-center justify-center rounded-lg border text-xs font-medium transition',
                            isActive && 'border-primary bg-primary text-primary-foreground',
                            isPast && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
                            isFuture && 'border-muted bg-muted/50 text-muted-foreground hover:bg-muted'
                          )}
                        >
                          {updateStatusMutation.isPending && updateStatusMutation.variables?.status === status ? (
                            <Loader2Icon className="size-4 animate-spin" />
                          ) : isPast ? (
                            <CheckCircle2Icon className="mr-1 size-3" />
                          ) : null}
                          {statusLabels[status]}
                        </button>
                        {idx < STATUS_WORKFLOW.length - 1 && (
                          <ChevronRightIcon className="mx-1 size-4 text-muted-foreground" />
                        )}
                      </div>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => handleStatusChange('wont_fix')}
                  disabled={updateStatusMutation.isPending || alert.status === 'wont_fix'}
                >
                  <XCircleIcon className="mr-2 size-4" />
                  Won&apos;t Fix
                </Button>
              </div>

              {/* Resolution Notes (for resolving) */}
              {(alert.status === 'in_progress' || alert.status === 'in_triage') && (
                <div className="space-y-2">
                  <Label htmlFor="resolution-notes">Resolution Notes</Label>
                  <Textarea
                    id="resolution-notes"
                    placeholder="Add notes when resolving this alert..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              <Separator />

              {/* Description */}
              {alert.description && (
                <div className="space-y-2">
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                </div>
              )}

              {/* Assignment */}
              <div className="space-y-2">
                <Label>Assigned To</Label>
                {alert.assignedTo ? (
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <Avatar className="size-8">
                      <AvatarImage src={alert.assignedTo.image ?? undefined} />
                      <AvatarFallback>{alert.assignedTo.name?.charAt(0) ?? '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.assignedTo.name}</p>
                      <p className="text-xs text-muted-foreground">{alert.assignedTo.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => assignMutation.mutate({ id: alert.id, assignedToUserId: null })}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-lg border border-dashed p-3">
                    <UserIcon className="size-8 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">No one assigned</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Assign
                    </Button>
                  </div>
                )}
              </div>

              {/* Due Date */}
              {alert.dueDate && (
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="size-4 text-muted-foreground" />
                    {new Date(alert.dueDate).toLocaleDateString()}
                  </div>
                </div>
              )}

              <Separator />

              {/* Related Items */}
              <div className="space-y-3">
                <Label>Related Items</Label>

                {/* Regulation */}
                {alert.regulation && (
                  <Link
                    href={`/dashboard/regulations?id=${alert.regulation.id}`}
                    className="flex items-center gap-3 rounded-lg border p-3 transition hover:bg-muted/50"
                  >
                    <FileTextIcon className="size-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.regulation.name}</p>
                      <p className="text-xs text-muted-foreground">Regulation</p>
                    </div>
                    <LinkIcon className="size-4 text-muted-foreground" />
                  </Link>
                )}

                {/* Article */}
                {alert.article && (
                  <Link
                    href={`/dashboard/regulations?article=${alert.article.id}`}
                    className="flex items-center gap-3 rounded-lg border p-3 transition hover:bg-muted/50"
                  >
                    <FileTextIcon className="size-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Article {alert.article.articleNumber}
                        {alert.article.sectionTitle && ` - ${alert.article.sectionTitle}`}
                      </p>
                      <p className="text-xs text-muted-foreground">Article</p>
                    </div>
                    <LinkIcon className="size-4 text-muted-foreground" />
                  </Link>
                )}

                {/* System */}
                {alert.system && (
                  <Link
                    href={`/dashboard/system-map?id=${alert.system.id}`}
                    className="flex items-center gap-3 rounded-lg border p-3 transition hover:bg-muted/50"
                  >
                    <NetworkIcon className="size-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.system.name}</p>
                      <p className="text-xs text-muted-foreground">System</p>
                    </div>
                    <LinkIcon className="size-4 text-muted-foreground" />
                  </Link>
                )}

                {/* Obligation */}
                {alert.obligation && (
                  <Link
                    href={`/dashboard/obligations?id=${alert.obligation.id}`}
                    className="flex items-center gap-3 rounded-lg border p-3 transition hover:bg-muted/50"
                  >
                    <CheckCircle2Icon className="size-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.obligation.title}</p>
                      <p className="text-xs text-muted-foreground">Obligation • {alert.obligation.status}</p>
                    </div>
                    <LinkIcon className="size-4 text-muted-foreground" />
                  </Link>
                )}
              </div>

              {/* Resolution Info */}
              {alert.resolvedAt && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Resolution</Label>
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <ClockIcon className="size-4 text-muted-foreground" />
                        Resolved on {new Date(alert.resolvedAt).toLocaleDateString()}
                        {alert.resolvedBy && ` by ${alert.resolvedBy.name}`}
                      </div>
                      {alert.resolutionNotes && (
                        <p className="mt-2 text-sm text-muted-foreground">{alert.resolutionNotes}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Actions */}
              <Separator />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href={`/dashboard/evidence-packs/generate?alertId=${alert.id}`}>Generate Evidence Pack</Link>
                </Button>
                <Button variant="outline" className="flex-1">
                  <MessageSquareIcon className="mr-2 size-4" />
                  Add Comment
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
