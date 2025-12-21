'use client'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { RegulationsList } from '../regulations/_components/regulations-list'

export default function RegulationsLoader() {
  const trpc = useTRPC()
  const q = useQuery(trpc.dashboard.getComplianceByRegulation.queryOptions())

  if (q.isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Regulations</h1>
          <p className="text-muted-foreground">Browse and manage regulatory frameworks affecting your organization</p>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    )
  }

  if (q.error) {
    const isAuthError = (err: unknown) => {
      if (!err) return false
      const e = err as any
      if (e?.data?.httpStatus === 401) return true
      const m = (e?.message || '').toString()
      return m.includes('401') || m.toLowerCase().includes('unauthorized')
    }

    if (isAuthError(q.error)) {
      const demo = [
        { id: 'r1', title: 'DORA', slug: 'dora', percent: 67 },
        { id: 'r2', title: 'GDPR', slug: 'gdpr', percent: 54 },
        { id: 'r3', title: 'NIS2', slug: 'nis2', percent: 83 },
      ]

      return (
        <div className="space-y-3">
          {demo.map((d) => (
            <div key={d.id} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{d.title}</div>
                <div className="text-xs text-muted-foreground">{d.slug}</div>
              </div>
              <div className="text-sm font-semibold">{d.percent}%</div>
            </div>
          ))}
          <div className="mt-3 text-right">
            <Button asChild>
              <Link href="/auth/signin">Sign in</Link>
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Regulations</h1>
          <p className="text-muted-foreground">Browse and manage regulatory frameworks affecting your organization</p>
        </div>
        <div className="text-sm text-destructive">Unable to load regulations.</div>
      </div>
    )
  }

  const regs = (q.data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    fullTitle: r.name,
    jurisdiction: r.jurisdiction,
    effectiveDate: r.effectiveDate ?? '',
    articlesCount: r.total ?? 0,
    alertsCount: 0,
    complianceScore: r.complianceRate ?? 100,
  }))

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Regulations</h1>
        <p className="text-muted-foreground">Browse and manage regulatory frameworks affecting your organization</p>
      </div>

      <RegulationsList regulations={regs} />
    </div>
  )
}
