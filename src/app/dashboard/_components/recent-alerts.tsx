'use client'

import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function RecentAlerts() {
  const trpc = useTRPC()
  const q = useQuery(trpc.dashboard.getRecentAlerts.queryOptions({ limit: 5 }))

  if (q.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (q.error) {
    // Show demo alerts if unauthenticated
    const isAuthError = (err: unknown) => {
      if (!err) return false
      const e = err as { data?: { httpStatus?: number }; message?: string }
      if (e?.data?.httpStatus === 401) return true
      const m = (e?.message || '').toString()
      return m.includes('401') || m.toLowerCase().includes('unauthorized')
    }

    if (isAuthError(q.error)) {
      const demo = [
        {
          id: 'a1',
          title: 'Demo: Third-party vendor risk spike',
          regulation: { name: 'DORA' },
          createdAt: new Date().toISOString(),
        },
        {
          id: 'a2',
          title: 'Demo: Data processing change detected',
          regulation: { name: 'GDPR' },
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ]

      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demo.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{a.title}</div>
                    <div className="text-xs text-muted-foreground">{a.regulation?.name}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-2 text-right">
              <Button asChild>
                <Link href="/auth/signin">Sign in</Link>
              </Button>
              <Button variant="link" asChild>
                <Link href="/dashboard/alerts">View all</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">Unable to load alerts.</div>
        </CardContent>
      </Card>
    )
  }

  const alerts = q.data ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-sm text-muted-foreground">No recent alerts.</div>
          ) : (
            alerts.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm font-medium">{a.title ?? a.description ?? 'Alert'}</div>
                  <div className="text-xs text-muted-foreground">{a.regulation?.name ?? '—'}</div>
                </div>
                <div className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 text-right">
          <Button variant="link" asChild>
            <Link href="/dashboard/alerts">View all</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default RecentAlerts
