'use client'

/**
 * Magic Demo - One-Click Compliance Scan
 *
 * This is the "magic moment" - user clicks one button and watches
 * AI automatically map their systems to regulations in real-time.
 *
 * Philosophy: Show, don't tell. Make the value obvious in 30 seconds.
 */

import { useTRPC } from '@/trpc/client'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle2Icon, Loader2Icon, PlayIcon, ShieldCheckIcon, SparklesIcon, ZapIcon } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface ScanResult {
  mappings: Array<{
    systemId: string
    systemName: string
    articleId: string
    impactLevel: string
    confidence: number
    reasoning: string
  }>
  gaps: {
    complianceScore: number
    criticalGaps: Array<{
      systemName: string
      riskLevel: string
    }>
  }
  actions: string[]
  metrics: {
    mappingsCreated: number
    gapsIdentified: number
    hoursSaved: number
  }
}

// =============================================================================
// Component
// =============================================================================

export function MagicDemo() {
  const trpc = useTRPC()
  const [isScanning, setIsScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<string>('')
  const [result, setResult] = useState<ScanResult | null>(null)

  // Get quick metrics
  const metricsQuery = useQuery({
    ...trpc.ai.quickScan.queryOptions(),
    refetchInterval: result ? 5000 : false,
  })

  // Full scan mutation
  const scanMutation = useMutation({
    ...trpc.ai.runFullScan.mutationOptions(),
    onSuccess: (data) => {
      setResult(data as ScanResult)
      setIsScanning(false)
      setProgress(100)
      setPhase('Complete!')
      toast.success('Compliance scan complete!', {
        description: `Found ${data.mappings.length} regulation-system mappings`,
      })
    },
    onError: (error) => {
      setIsScanning(false)
      setProgress(0)
      setPhase('')
      toast.error('Scan failed', {
        description: error.message,
      })
    },
  })

  // Simulate progress phases
  const runScan = useCallback(async () => {
    setIsScanning(true)
    setResult(null)
    setProgress(0)

    // Simulate phases for visual feedback
    const phases = [
      { p: 10, text: 'Loading systems...' },
      { p: 25, text: 'Fetching regulations...' },
      { p: 40, text: 'AI analyzing articles...' },
      { p: 60, text: 'Mapping systems to regulations...' },
      { p: 80, text: 'Identifying gaps...' },
      { p: 90, text: 'Generating recommendations...' },
    ]

    for (const { p, text } of phases) {
      setProgress(p)
      setPhase(text)
      await new Promise((r) => setTimeout(r, 800))
    }

    // Actually run the scan
    scanMutation.mutate()
  }, [scanMutation])

  const metrics = metricsQuery.data

  return (
    <Card className="overflow-hidden border-2 border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-primary" />
          <CardTitle>AI Compliance Agent</CardTitle>
        </div>
        <CardDescription>One click to automatically map all your systems to applicable regulations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        {metrics && !isScanning && !result && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="Compliance Score"
              value={`${metrics.complianceScore}%`}
              trend={metrics.complianceScore >= 80 ? 'good' : 'warning'}
            />
            <StatCard
              label="Critical Gaps"
              value={metrics.criticalGaps.toString()}
              trend={metrics.criticalGaps === 0 ? 'good' : 'bad'}
            />
            <StatCard
              label="Pending Actions"
              value={metrics.pendingActions.toString()}
              trend={metrics.pendingActions === 0 ? 'good' : 'warning'}
            />
            <StatCard label="Hours Saved" value={metrics.hoursSaved.toString()} trend="good" />
          </div>
        )}

        {/* Scan Progress */}
        {isScanning && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Loader2Icon className="h-5 w-5 animate-spin text-primary" />
              <span className="font-medium">{phase}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              AI is analyzing your systems and regulations. This usually takes 30-60 seconds.
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className="rounded-lg bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="h-5 w-5 text-emerald-500" />
                <span className="font-semibold text-emerald-500">Scan Complete!</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{result.metrics.mappingsCreated}</div>
                  <div className="text-xs text-muted-foreground">Mappings Created</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{result.metrics.gapsIdentified}</div>
                  <div className="text-xs text-muted-foreground">Gaps Found</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-500">{result.metrics.hoursSaved}h</div>
                  <div className="text-xs text-muted-foreground">Time Saved</div>
                </div>
              </div>
            </div>

            {/* Top Mappings */}
            {result.mappings.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium">New Mappings Found</h4>
                <div className="space-y-2">
                  {result.mappings.slice(0, 5).map((m, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{m.systemName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'rounded px-2 py-0.5 text-xs font-medium',
                            m.impactLevel === 'critical' && 'bg-red-500/20 text-red-500',
                            m.impactLevel === 'high' && 'bg-orange-500/20 text-orange-500',
                            m.impactLevel === 'medium' && 'bg-yellow-500/20 text-yellow-500',
                            m.impactLevel === 'low' && 'bg-green-500/20 text-green-500'
                          )}
                        >
                          {m.impactLevel}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(m.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                  ))}
                  {result.mappings.length > 5 && (
                    <p className="text-xs text-muted-foreground">+{result.mappings.length - 5} more mappings</p>
                  )}
                </div>
              </div>
            )}

            {/* Recommended Actions */}
            {result.actions.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-medium">Recommended Actions</h4>
                <ul className="space-y-1">
                  {result.actions.slice(0, 4).map((action, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <Button onClick={runScan} disabled={isScanning} size="lg" className="w-full gap-2">
          {isScanning ? (
            <>
              <Loader2Icon className="h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : result ? (
            <>
              <ZapIcon className="h-4 w-4" />
              Run Another Scan
            </>
          ) : (
            <>
              <PlayIcon className="h-4 w-4" />
              Start AI Compliance Scan
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          The AI agent will automatically analyze your systems and map them to applicable regulations. No manual work
          required.
        </p>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Helpers
// =============================================================================

function StatCard({ label, value, trend }: { label: string; value: string; trend: 'good' | 'warning' | 'bad' }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-center">
      <div
        className={cn(
          'text-xl font-bold',
          trend === 'good' && 'text-emerald-500',
          trend === 'warning' && 'text-yellow-500',
          trend === 'bad' && 'text-red-500'
        )}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}
