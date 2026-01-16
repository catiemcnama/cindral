'use client'

import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  EditIcon,
  FileTextIcon,
  Loader2Icon,
  NetworkIcon,
  RefreshCwIcon,
  Trash2Icon,
  UserIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { formatErrorForUser } from '@/lib/format-error'
import { cn } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// =============================================================================
// Types & Styles
// =============================================================================

type ObligationStatus = 'not_started' | 'in_progress' | 'implemented' | 'under_review' | 'verified'
type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

const statusStyles: Record<ObligationStatus, { color: string; icon: typeof CheckCircle2Icon }> = {
  not_started: { color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: ClockIcon },
  in_progress: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: ClockIcon },
  implemented: { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: CheckCircle2Icon },
  under_review: { color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: ClockIcon },
  verified: { color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2Icon },
}

const statusLabels: Record<ObligationStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  implemented: 'Implemented',
  under_review: 'Under Review',
  verified: 'Verified',
}

const riskLevelStyles: Record<RiskLevel, string> = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
}

const STATUS_ORDER: ObligationStatus[] = ['not_started', 'in_progress', 'implemented', 'under_review', 'verified']

// =============================================================================
// Component
// =============================================================================

export default function ObligationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  const obligationId = typeof params.id === 'string' ? params.id : ''

  const [isDeleting, setIsDeleting] = useState(false)

  // Query
  const obligationQuery = useQuery({
    ...trpc.obligations.getById.queryOptions({ id: obligationId }),
    enabled: !!obligationId,
  })

  const { data: obligation, isLoading, error, refetch, isFetching } = obligationQuery

  // Mutations
  const updateStatusMutation = useMutation({
    ...trpc.obligations.updateStatus.mutationOptions(),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: trpc.obligations.getById.queryKey({ id: obligationId }) })
      queryClient.invalidateQueries({ queryKey: trpc.obligations.list.queryKey() })
      const statusLabel = statusLabels[variables.status as ObligationStatus] || variables.status
      toast.success('Status updated', {
        description: `Changed to "${statusLabel}"`,
      })
    },
    onError: (error) => {
      toast.error('Failed to update status', {
        description: formatErrorForUser(error),
      })
    },
  })

  const deleteMutation = useMutation({
    ...trpc.obligations.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.obligations.list.queryKey() })
      toast.success('Obligation deleted')
      router.push('/dashboard/obligations')
    },
    onError: (error) => {
      setIsDeleting(false)
      toast.error('Failed to delete obligation', {
        description: formatErrorForUser(error),
      })
    },
  })

  const handleStatusChange = useCallback(
    (status: ObligationStatus) => {
      updateStatusMutation.mutate({ id: obligationId, status })
    },
    [updateStatusMutation, obligationId]
  )

  const handleDelete = useCallback(() => {
    setIsDeleting(true)
    deleteMutation.mutate({ id: obligationId })
  }, [deleteMutation, obligationId])

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  // Error state
  if (error || !obligation) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <FileTextIcon className="size-12 text-muted-foreground/50" />
        <h2 className="mt-4 text-lg font-medium">Obligation not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The obligation you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/obligations">
            <ArrowLeftIcon className="mr-2 size-4" />
            Back to Obligations
          </Link>
        </Button>
      </div>
    )
  }

  const status = (obligation.status as ObligationStatus) || 'not_started'
  const riskLevel = obligation.riskLevel as RiskLevel | null
  const statusStyle = statusStyles[status]
  const StatusIcon = statusStyle?.icon || ClockIcon
  const isDue = obligation.dueDate && new Date(obligation.dueDate) < new Date()

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/obligations">
              <ArrowLeftIcon className="size-4" />
            </Link>
          </Button>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">{obligation.id}</span>
              <Badge variant="outline" className={cn('gap-1', statusStyle?.color)}>
                <StatusIcon className="size-3" />
                {statusLabels[status]}
              </Badge>
              {riskLevel && (
                <Badge variant="outline" className={cn('capitalize', riskLevelStyles[riskLevel])}>
                  {riskLevel} Risk
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-semibold">{obligation.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCwIcon className={cn('mr-2 size-4', isFetching && 'animate-spin')} />
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <EditIcon className="mr-2 size-4" />
                Change Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {STATUS_ORDER.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={s === status || updateStatusMutation.isPending}
                >
                  {statusLabels[s]}
                  {s === status && ' (current)'}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting || deleteMutation.isPending}>
                {isDeleting ? (
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                ) : (
                  <Trash2Icon className="mr-2 size-4" />
                )}
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Obligation?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this obligation and all associated data. This action cannot be undone.
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
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Obligation details and requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {obligation.summary ? (
                <p className="text-sm leading-relaxed">{obligation.summary}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No summary provided</p>
              )}

              {obligation.referenceCode && (
                <div>
                  <p className="text-xs text-muted-foreground">Reference Code</p>
                  <p className="font-mono text-sm">{obligation.referenceCode}</p>
                </div>
              )}

              {obligation.requirementType && (
                <div>
                  <p className="text-xs text-muted-foreground">Requirement Type</p>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {obligation.requirementType}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Regulation & Article Context */}
          <Card>
            <CardHeader>
              <CardTitle>Regulatory Context</CardTitle>
              <CardDescription>Source regulation and article</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {obligation.regulation && (
                <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
                  <FileTextIcon className="mt-0.5 size-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/regulations/${obligation.regulation.id}`}
                        className="font-medium hover:underline"
                      >
                        {obligation.regulation.name}
                      </Link>
                      {obligation.regulation.jurisdiction && (
                        <Badge variant="outline">{obligation.regulation.jurisdiction}</Badge>
                      )}
                    </div>
                    {obligation.regulation.fullTitle && (
                      <p className="mt-1 text-sm text-muted-foreground">{obligation.regulation.fullTitle}</p>
                    )}
                  </div>
                </div>
              )}

              {obligation.article && (
                <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
                  <FileTextIcon className="mt-0.5 size-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">Article {obligation.article.articleNumber}</p>
                    {obligation.article.title && (
                      <p className="text-sm text-muted-foreground">{obligation.article.title}</p>
                    )}
                    {obligation.article.sectionTitle && (
                      <p className="mt-1 text-xs text-muted-foreground">Section: {obligation.article.sectionTitle}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mapped Systems */}
          <Card>
            <CardHeader>
              <CardTitle>Mapped Systems</CardTitle>
              <CardDescription>Systems impacted by this obligation</CardDescription>
            </CardHeader>
            <CardContent>
              {obligation.systemMappings && obligation.systemMappings.length > 0 ? (
                <div className="space-y-2">
                  {obligation.systemMappings.map((mapping) => (
                    <div
                      key={mapping.system.id}
                      className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <NetworkIcon className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{mapping.system.name}</p>
                          {mapping.system.criticality && (
                            <Badge variant="outline" className="mt-1 text-xs capitalize">
                              {mapping.system.criticality}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/dashboard/system-map">View Map</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <NetworkIcon className="size-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No systems mapped to this obligation</p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link href="/dashboard/system-map">Go to System Map</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <CalendarIcon className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Due Date</p>
                  {obligation.dueDate ? (
                    <p className={cn('text-xs', isDue ? 'font-medium text-red-500' : 'text-muted-foreground')}>
                      {new Date(obligation.dueDate).toLocaleDateString()}
                      {isDue && ' (Overdue)'}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">No due date set</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <UserIcon className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Owner</p>
                  {obligation.owner ? (
                    <div className="mt-1 flex items-center gap-2">
                      <Avatar className="size-5">
                        <AvatarFallback className="text-xs">{obligation.owner.name?.charAt(0) ?? '?'}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{obligation.owner.name}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Unassigned</p>
                  )}
                </div>
              </div>

              {obligation.ownerTeam && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <UserIcon className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Team</p>
                      <p className="text-xs text-muted-foreground">{obligation.ownerTeam}</p>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex items-center gap-3">
                <ClockIcon className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-xs text-muted-foreground">
                    {obligation.updatedAt ? new Date(obligation.updatedAt).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>

              {obligation.humanReviewedAt && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <CheckCircle2Icon className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Last Reviewed</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(obligation.humanReviewedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {obligation.regulation && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/dashboard/regulations/${obligation.regulation.id}`}>View Regulation</Link>
                </Button>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/evidence-packs/generate">Generate Evidence Pack</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/system-map">View System Map</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
