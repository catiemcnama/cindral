'use client'

import Link from 'next/link'
import { ArrowRightIcon, ShieldCheckIcon, SparklesIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useOnboardingStatus } from '@/hooks/use-onboarding'

export function OnboardingCta() {
  const { isComplete, isLoading } = useOnboardingStatus()

  // Don't show if loading or if onboarding is complete
  if (isLoading || isComplete) {
    return null
  }

  return (
    <Card className="relative overflow-hidden border bg-gradient-to-br from-primary/10 via-background to-background">
      <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <Badge variant="outline" className="w-fit bg-background/80">
            Onboarding
          </Badge>
          <div>
            <h2 className="text-xl font-semibold">Set your regulatory scope</h2>
            <p className="text-sm text-muted-foreground">
              Choose your industry and get a tailored regulation list in under two minutes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <SparklesIcon className="size-3.5" />
              Auto-preselect regs
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheckIcon className="size-3.5" />
              Adjust anytime
            </span>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/onboarding">
            Start setup
            <ArrowRightIcon className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
