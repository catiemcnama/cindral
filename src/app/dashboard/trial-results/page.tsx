'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { organization, useActiveOrganization } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  Loader2,
  Plus,
  Server,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// =============================================================================
// Types from trial analysis
// =============================================================================

interface TrialSystem {
  name: string
  description?: string
  category?: string
  dataTypes?: string[]
  type?: string
}

interface ComplianceGap {
  regulation: string
  article: string
  articleTitle: string
  requirement: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  affectedSystems: string[]
  remediation: string
  deadline?: string
}

interface TrialAnalysis {
  detectedSystems: TrialSystem[]
  applicableArticles: Array<{ regulation: string; articleNumber: string; title: string }>
  complianceGaps: ComplianceGap[]
  evidenceSummary: {
    totalGaps: number
    criticalGaps: number
    highGaps: number
    immediateActions: string[]
  }
  pricing?: {
    recommended: string
    tier: string
    monthlyPrice: number
    reason: string
  }
}

// =============================================================================
// Component
// =============================================================================

export default function TrialResultsPage() {
  const router = useRouter()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  // State
  const [trialData, setTrialData] = useState<TrialAnalysis | null>(null)
  const [trialSystems, setTrialSystems] = useState<TrialSystem[]>([])
  const [selectedSystems, setSelectedSystems] = useState<Set<number>>(new Set())
  const [isImporting, setIsImporting] = useState(false)
  const [importComplete, setImportComplete] = useState(false)
  const [companyName, setCompanyName] = useState<string | null>(null)

  // Check for existing org
  const { data: activeOrg } = useActiveOrganization()

  // Create system mutation
  const createSystemMutation = useMutation({
    ...trpc.systems.create.mutationOptions(),
  })

  // Load trial data from sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    const analysisJson = sessionStorage.getItem('trial_analysis')
    const systemsJson = sessionStorage.getItem('trial_systems')
    const company = sessionStorage.getItem('trial_company')

    if (analysisJson) {
      try {
        const analysis = JSON.parse(analysisJson) as TrialAnalysis
        setTrialData(analysis)
      } catch {
        // Invalid JSON, redirect to onboarding
        router.push('/dashboard/onboarding')
      }
    } else {
      // No trial data, redirect to regular onboarding
      router.push('/dashboard/onboarding')
    }

    if (systemsJson) {
      try {
        const systems = JSON.parse(systemsJson) as TrialSystem[]
        setTrialSystems(systems)
        // Select all systems by default
        setSelectedSystems(new Set(systems.map((_, i) => i)))
      } catch {
        // Ignore invalid systems JSON
      }
    }

    if (company) {
      setCompanyName(company)
    }
  }, [router])

  // Create org if needed and import systems
  const handleImportSystems = async () => {
    if (selectedSystems.size === 0) return

    setIsImporting(true)

    try {
      // Check if user needs to create an org first
      const hasOrg = !!activeOrg

      if (!hasOrg && companyName) {
        // Create organization first using better-auth client
        const slug = companyName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')

        await organization.create({
          name: companyName,
          slug,
        })

        // Set the new org as active
        await organization.setActive({ organizationSlug: slug })

        // Invalidate org queries to refresh
        await queryClient.invalidateQueries()

        // Wait a bit for the org to be created and set active
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      // Import selected systems
      const systemsToImport = trialSystems.filter((_, i) => selectedSystems.has(i))

      for (const system of systemsToImport) {
        await createSystemMutation.mutateAsync({
          name: system.name,
          description: system.description || `Imported from trial analysis`,
          category: system.category || system.type || 'other',
          criticality: 'medium', // Default
        })
      }

      // Clear trial data from sessionStorage
      sessionStorage.removeItem('trial_analysis')
      sessionStorage.removeItem('trial_systems')
      sessionStorage.removeItem('trial_company')

      setImportComplete(true)
    } catch (error) {
      console.error('Failed to import systems:', error)
    } finally {
      setIsImporting(false)
    }
  }

  const toggleSystem = (index: number) => {
    const newSelected = new Set(selectedSystems)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedSystems(newSelected)
  }

  const selectAll = () => {
    setSelectedSystems(new Set(trialSystems.map((_, i) => i)))
  }

  const selectNone = () => {
    setSelectedSystems(new Set())
  }

  // Loading state
  if (!trialData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your analysis...</p>
        </div>
      </div>
    )
  }

  // Import complete state
  if (importComplete) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold">Systems Imported Successfully!</h2>
              <p className="mt-1 text-muted-foreground">
                {selectedSystems.size} system{selectedSystems.size !== 1 ? 's' : ''} have been added to your account.
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/dashboard/system-map">
                  View System Map
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/regulations">View Regulations</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Show gaps summary */}
        {trialData.complianceGaps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Next: Address Compliance Gaps
              </CardTitle>
              <CardDescription>
                We identified {trialData.complianceGaps.length} gaps that need attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trialData.complianceGaps.slice(0, 3).map((gap, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                    <Badge
                      variant={
                        gap.priority === 'critical' ? 'destructive' : gap.priority === 'high' ? 'default' : 'secondary'
                      }
                    >
                      {gap.priority}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-medium">{gap.requirement}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {gap.regulation} {gap.article}
                      </p>
                    </div>
                  </div>
                ))}
                {trialData.complianceGaps.length > 3 && (
                  <p className="text-center text-sm text-muted-foreground">
                    +{trialData.complianceGaps.length - 3} more gaps to review
                  </p>
                )}
              </div>
              <div className="mt-4">
                <Button asChild className="w-full">
                  <Link href="/dashboard/obligations">
                    Review All Obligations
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Main results view
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Compliance Analysis</h1>
          <p className="text-muted-foreground">Review your results and import your systems to get started</p>
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered Analysis
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Server className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{trialSystems.length}</p>
                <p className="text-sm text-muted-foreground">Systems Detected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{trialData.applicableArticles.length}</p>
                <p className="text-sm text-muted-foreground">Regulations Apply</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{trialData.complianceGaps.length}</p>
                <p className="text-sm text-muted-foreground">Compliance Gaps</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900">
                <Zap className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{trialData.evidenceSummary?.criticalGaps || 0}</p>
                <p className="text-sm text-muted-foreground">Critical Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Systems to Import */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Import Your Systems
                </CardTitle>
                <CardDescription>Select which systems to add to your account</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  All
                </Button>
                <Button variant="ghost" size="sm" onClick={selectNone}>
                  None
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] space-y-2 overflow-y-auto">
              {trialSystems.map((system, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                    selectedSystems.has(i) ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  )}
                  onClick={() => toggleSystem(i)}
                >
                  <Checkbox
                    checked={selectedSystems.has(i)}
                    onCheckedChange={() => toggleSystem(i)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{system.name}</p>
                    {system.description && (
                      <p className="line-clamp-1 text-sm text-muted-foreground">{system.description}</p>
                    )}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(system.category || system.type) && (
                        <Badge variant="secondary" className="text-xs">
                          {system.category || system.type}
                        </Badge>
                      )}
                      {system.dataTypes?.map((dt, j) => (
                        <Badge key={j} variant="outline" className="text-xs">
                          {dt}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t pt-4">
              <Button
                onClick={handleImportSystems}
                disabled={selectedSystems.size === 0 || isImporting}
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing {selectedSystems.size} systems...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Import {selectedSystems.size} System{selectedSystems.size !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Gaps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Compliance Gaps Found
            </CardTitle>
            <CardDescription>Issues that need attention based on your systems</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] space-y-3 overflow-y-auto">
              {trialData.complianceGaps.map((gap, i) => (
                <div
                  key={i}
                  className={cn(
                    'rounded-lg border p-3',
                    gap.priority === 'critical' && 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950',
                    gap.priority === 'high' && 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            gap.priority === 'critical'
                              ? 'destructive'
                              : gap.priority === 'high'
                                ? 'default'
                                : 'secondary'
                          }
                        >
                          {gap.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {gap.regulation} {gap.article}
                        </span>
                      </div>
                      <p className="mt-2 font-medium">{gap.requirement}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{gap.remediation}</p>
                      {gap.deadline && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Deadline: {gap.deadline}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {trialData.complianceGaps.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <p className="text-muted-foreground">No critical gaps detected!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Immediate Actions */}
      {trialData.evidenceSummary?.immediateActions?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Recommended Immediate Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {trialData.evidenceSummary.immediateActions.map((action, i) => (
                <li key={i} className="flex items-start gap-2">
                  <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Skip Import Option */}
      <div className="flex justify-center">
        <Button variant="ghost" asChild>
          <Link href="/dashboard">Skip import and go to dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
