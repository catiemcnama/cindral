'use client'

import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { ArrowRightIcon } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const severityStyles: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
}

const regulationStyles: Record<string, string> = {
  DORA: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'AI Act': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Basel III': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  GDPR: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'ESG Disclosure': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

export function RegulatoryFeed() {
  const trpc = useTRPC()
  const feedQuery = useQuery(trpc.dashboard.getRegulatoryFeed.queryOptions({ limit: 5 }))
  const { data, isLoading, error } = feedQuery

  // Demo fallback when user is unauthenticated or API returns 401
  const isAuthError = (err: unknown) => {
    if (!err) return false
    const e = err as any
    if (e?.data?.httpStatus === 401) return true
    const msg = (e?.message || '').toString()
    return msg.includes('401') || msg.toLowerCase().includes('unauthorized')
  }

  const demoFeed = [
    {
      id: 'd1',
      regulation: 'DORA',
      articleRef: 'Article 11(1)',
      severity: 'critical',
      title: 'Demo: Monthly risk assessments required for major ICT providers',
      publishedAt: new Date().toISOString(),
    },
    {
      id: 'd2',
      regulation: 'GDPR',
      articleRef: 'Article 35',
      severity: 'high',
      title: 'Demo: DPIA requirements extended to AI processing',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Regulatory Change Feed</h2>
        <Button variant="link" className="text-primary" asChild>
          <Link href="/dashboard/regulations">
            View all <ArrowRightIcon className="ml-1 size-4" />
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading && (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {error && isAuthError(error) && (
          <>
            {demoFeed.map((change) => (
              <Card key={change.id} className="bg-card/50 transition-colors hover:bg-card/80">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn('font-medium', regulationStyles[change.regulation] || 'bg-muted')}
                        >
                          {change.regulation}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{change.articleRef}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{change.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(change.publishedAt).toLocaleString()}</p>
                    </div>
                    <Badge variant="outline" className={cn('shrink-0 capitalize', severityStyles['critical'])}>
                      {change.severity}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Signed out — demo content shown</p>
                    <p className="text-sm text-muted-foreground">Sign in to view your organization feed.</p>
                  </div>
                  <Button asChild>
                    <Link href="/auth/signin">Sign in</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!isLoading && !error && (
          <>
            {(data ?? []).map((change: any) => (
              <Card key={change.id} className="bg-card/50 transition-colors hover:bg-card/80">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            'font-medium',
                            regulationStyles[change.regulation?.name || change.regulation?.id] || 'bg-muted'
                          )}
                        >
                          {change.regulation?.name ?? 'Regulation'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {change.articleRef ?? change.articleId ?? ''}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{change.title ?? change.summary ?? 'Regulatory change'}</p>
                      <p className="text-xs text-muted-foreground">
                        {change.publishedAt ? new Date(change.publishedAt).toLocaleString() : ''}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('shrink-0 capitalize', severityStyles[(change.severity as string) || 'medium'])}
                    >
                      {change.severity ?? 'medium'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
