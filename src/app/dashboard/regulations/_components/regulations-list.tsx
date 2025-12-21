'use client'

import Link from 'next/link'
import { useMemo, useSyncExternalStore } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { readOnboardingState, subscribeToOnboarding } from '@/lib/onboarding-storage'
import { cn } from '@/lib/utils'

type RegulationSummary = {
  id: string
  name: string
  fullTitle: string
  jurisdiction: string
  effectiveDate: string
  articlesCount: number
  alertsCount: number
  complianceScore: number
}

type RegulationsListProps = {
  regulations: RegulationSummary[]
}

function getComplianceColor(score: number) {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-yellow-400'
  return 'text-red-400'
}

function RegulationCard({ regulation, highlighted }: { regulation: RegulationSummary; highlighted: boolean }) {
  return (
    <Link key={regulation.id} href={`/dashboard/regulations/${regulation.id}`}>
      <Card
        className={cn(
          'cursor-pointer bg-card/50 transition-colors hover:bg-card/80',
          highlighted && 'border-primary/60 bg-primary/5 hover:bg-primary/10'
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold">{regulation.name}</h2>
                <Badge variant="outline" className="text-xs">
                  {regulation.jurisdiction}
                </Badge>
                {highlighted && (
                  <Badge variant="secondary" className="text-xs">
                    In scope
                  </Badge>
                )}
                {regulation.alertsCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {regulation.alertsCount} alerts
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{regulation.fullTitle}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Effective: {regulation.effectiveDate}</span>
                <span>-</span>
                <span>{regulation.articlesCount} articles</span>
              </div>
            </div>

            <div className="text-right">
              <div className="mb-1 text-xs text-muted-foreground">Compliance</div>
              <div className={cn('text-2xl font-bold', getComplianceColor(regulation.complianceScore))}>
                {regulation.complianceScore}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function RegulationsList({ regulations }: RegulationsListProps) {
  const onboarding = useSyncExternalStore(
    subscribeToOnboarding,
    readOnboardingState,
    () => null
  )

  const scopedIds = useMemo(() => new Set(onboarding?.regulations ?? []), [onboarding])
  const scopedRegulations = useMemo(
    () => regulations.filter((regulation) => scopedIds.has(regulation.id)),
    [regulations, scopedIds]
  )
  const remainingRegulations = useMemo(
    () => regulations.filter((regulation) => !scopedIds.has(regulation.id)),
    [regulations, scopedIds]
  )

  const hasScope = scopedRegulations.length > 0
  const secondaryTitle = hasScope ? 'Other regulations' : 'All regulations'
  const secondarySubtitle = hasScope
    ? 'Additional frameworks you can track at any time.'
    : 'Browse every framework in your library.'
  const secondaryCount = hasScope ? remainingRegulations.length : regulations.length

  return (
    <div className="space-y-6">
      {hasScope && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Your scope</h2>
              <p className="text-sm text-muted-foreground">
                Based on the regulations you selected during onboarding.
              </p>
            </div>
            <Badge variant="outline">{scopedRegulations.length} regulations</Badge>
          </div>
          <div className="grid gap-4">
            {scopedRegulations.map((regulation) => (
              <RegulationCard key={regulation.id} regulation={regulation} highlighted />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">{secondaryTitle}</h2>
            <p className="text-sm text-muted-foreground">{secondarySubtitle}</p>
          </div>
          <Badge variant="outline">{secondaryCount} total</Badge>
        </div>
        <div className="grid gap-4">
          {(hasScope ? remainingRegulations : regulations).map((regulation) => (
            <RegulationCard
              key={regulation.id}
              regulation={regulation}
              highlighted={scopedIds.has(regulation.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
