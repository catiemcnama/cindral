'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import type { MagicDemoResult, PlanRecommendation } from '@/lib/magic-demo'
import { cn } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'
import { useMutation } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Cloud,
  CreditCard,
  Database,
  FileSpreadsheet,
  FileText,
  Loader2,
  Server,
  Shield,
  Sparkles,
  Upload,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

// =============================================================================
// Types
// =============================================================================

type AnalysisResult = MagicDemoResult & { pricing: PlanRecommendation }

interface ParsedSystem {
  name: string
  description: string
  category: string
  dataTypes: string[]
}

// =============================================================================
// CSV Parser
// =============================================================================

function parseCSV(content: string): ParsedSystem[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0]
    .toLowerCase()
    .split(',')
    .map((h) => h.trim())
  const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('system'))
  const descIdx = headers.findIndex((h) => h.includes('desc'))
  const catIdx = headers.findIndex((h) => h.includes('category') || h.includes('type'))
  const dataIdx = headers.findIndex((h) => h.includes('data'))

  if (nameIdx === -1) return []

  return lines
    .slice(1)
    .map((line) => {
      const values = line.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''))
      return {
        name: values[nameIdx] || 'Unknown System',
        description: descIdx >= 0 ? values[descIdx] || '' : '',
        category: catIdx >= 0 ? values[catIdx] || 'other' : 'other',
        dataTypes: dataIdx >= 0 && values[dataIdx] ? values[dataIdx].split(';').map((d) => d.trim()) : [],
      }
    })
    .filter((s) => s.name && s.name !== 'Unknown System')
}

// =============================================================================
// Component
// =============================================================================

export default function TryPage() {
  const router = useRouter()
  const trpc = useTRPC()

  // Analysis state
  const [inputMethod, setInputMethod] = useState<'describe' | 'csv'>('describe')
  const [description, setDescription] = useState('')
  const [csvSystems, setCsvSystems] = useState<ParsedSystem[]>([])
  const [csvFileName, setCsvFileName] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Signup state
  const [showSignup, setShowSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [signupError, setSignupError] = useState<string | null>(null)
  const [isSigningUp, setIsSigningUp] = useState(false)

  // Mutations
  const analyzeMutation = useMutation({
    ...trpc.magicDemo.analyze.mutationOptions(),
  })

  // =============================================================================
  // Handlers
  // =============================================================================

  const handleAnalyze = async () => {
    if (inputMethod === 'describe' && description.length < 20) return
    if (inputMethod === 'csv' && csvSystems.length === 0) return
    setError(null)

    try {
      let result: AnalysisResult

      if (inputMethod === 'csv' && csvSystems.length > 0) {
        // Build description from CSV systems
        const systemsDescription = csvSystems
          .map(
            (s) =>
              `${s.name} (${s.category}): ${s.description}${s.dataTypes.length > 0 ? `. Data: ${s.dataTypes.join(', ')}` : ''}`
          )
          .join('\n')

        result = (await analyzeMutation.mutateAsync({
          description: `Our systems include:\n${systemsDescription}`,
          region: 'EU', // Default to EU for DORA/AI Act
        })) as AnalysisResult
      } else {
        result = (await analyzeMutation.mutateAsync({
          description,
          region: description.toLowerCase().includes('eu') ? 'EU' : undefined,
        })) as AnalysisResult
      }

      setAnalysisResult(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed. Please try again.'
      setError(message)
    }
  }

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const systems = parseCSV(content)
      setCsvSystems(systems)
    }
    reader.readAsText(file)
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupError(null)
    setIsSigningUp(true)

    try {
      // Store analysis in sessionStorage for post-signup retrieval
      if (analysisResult) {
        sessionStorage.setItem('trial_analysis', JSON.stringify(analysisResult))
        sessionStorage.setItem(
          'trial_systems',
          JSON.stringify(csvSystems.length > 0 ? csvSystems : analysisResult.detectedSystems)
        )
      }

      // Redirect to signup with prefilled data
      const params = new URLSearchParams({
        email,
        company: companyName,
        from: 'trial',
      })
      router.push(`/signup?${params.toString()}`)
    } catch (err) {
      setSignupError(err instanceof Error ? err.message : 'Signup failed')
      setIsSigningUp(false)
    }
  }

  // =============================================================================
  // Helpers
  // =============================================================================

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cloud':
        return <Cloud className="h-4 w-4" />
      case 'database':
        return <Database className="h-4 w-4" />
      case 'api':
        return <Server className="h-4 w-4" />
      case 'payment':
        return <CreditCard className="h-4 w-4" />
      default:
        return <Server className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-600 border-red-500/20'
      case 'high':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20'
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
      default:
        return 'bg-green-500/10 text-green-600 border-green-500/20'
    }
  }

  const isAnalyzing = analyzeMutation.isPending
  const canAnalyze = inputMethod === 'describe' ? description.length >= 20 : csvSystems.length > 0

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Free Compliance Analysis
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            See your compliance gaps
            <span className="text-primary"> in 60 seconds</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            Describe your tech stack or upload a CSV. Get instant analysis of DORA, AI Act, and GDPR gaps. No signup
            required to see results.
          </p>
        </div>

        {/* Input Section */}
        {!analysisResult && (
          <div className="mx-auto mb-8 max-w-3xl">
            <Card className="border-2 border-primary/20">
              <CardContent className="pt-6">
                <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as 'describe' | 'csv')}>
                  <TabsList className="mb-6 grid w-full grid-cols-2">
                    <TabsTrigger value="describe" className="gap-2">
                      <FileText className="h-4 w-4" />
                      Describe Your Stack
                    </TabsTrigger>
                    <TabsTrigger value="csv" className="gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Upload CSV
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="describe" className="space-y-4">
                    <Textarea
                      placeholder="Describe your tech stack...&#10;&#10;Example: We're a fintech using AWS, Python APIs with FastAPI, PostgreSQL for customer data, and Stripe for payments. We operate in the EU."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-32 resize-none text-base"
                      disabled={isAnalyzing}
                    />
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-muted-foreground">Try:</span>
                      {[
                        'AWS + PostgreSQL + Stripe fintech',
                        'Azure + Node.js + MongoDB AI startup',
                        'GCP + Python + ML models in EU',
                      ].map((example) => (
                        <Button
                          key={example}
                          variant="ghost"
                          size="sm"
                          className="h-auto px-2 py-1 text-xs"
                          onClick={() => setDescription(`We're a company using ${example}`)}
                          disabled={isAnalyzing}
                        >
                          {example}
                        </Button>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="csv" className="space-y-4">
                    <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="csv-upload"
                        disabled={isAnalyzing}
                      />
                      <label htmlFor="csv-upload" className="flex cursor-pointer flex-col items-center gap-2">
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <span className="font-medium">
                          {csvFileName ? csvFileName : 'Drop your CSV here or click to upload'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Columns: name, description, category, data_types
                        </span>
                      </label>
                    </div>

                    {csvSystems.length > 0 && (
                      <div className="rounded-lg bg-muted/50 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-medium">{csvSystems.length} systems detected</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCsvSystems([])
                              setCsvFileName(null)
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {csvSystems.slice(0, 10).map((system, i) => (
                            <Badge key={i} variant="secondary">
                              {system.name}
                            </Badge>
                          ))}
                          {csvSystems.length > 10 && <Badge variant="outline">+{csvSystems.length - 10} more</Badge>}
                        </div>
                      </div>
                    )}

                    <div className="text-sm text-muted-foreground">
                      <p className="mb-1 font-medium">CSV Format Example:</p>
                      <pre className="overflow-x-auto rounded bg-muted/50 p-2 text-xs">
                        {`name,description,category,data_types
Core Banking,Main transaction system,database,customer data;financial data
Payment Gateway,Stripe integration,payment,payment data
AWS Infrastructure,Cloud hosting,cloud,logs;backups`}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 flex justify-end">
                  <Button size="lg" onClick={handleAnalyze} disabled={!canAnalyze || isAnalyzing} className="gap-2">
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Analyze My Stack
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mx-auto mb-8 max-w-3xl">
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="py-6">
                <div className="flex items-center gap-3 text-red-500">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="font-medium">{error}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div className="mx-auto mb-8 max-w-3xl">
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
                <h3 className="mb-2 text-lg font-semibold">Analyzing your tech stack...</h3>
                <p className="text-muted-foreground">
                  Detecting systems, matching DORA + AI Act + GDPR requirements, identifying gaps...
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results */}
        {analysisResult && !isAnalyzing && (
          <div className="mx-auto max-w-5xl space-y-6">
            {/* Analysis Complete Banner */}
            <div className="flex items-center justify-between rounded-lg bg-green-500/10 px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Analysis Complete</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{(analysisResult.analysisTimeMs / 1000).toFixed(1)}s</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setAnalysisResult(null)}>
                Start Over
              </Button>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-primary">{analysisResult.metrics.systemsAnalyzed}</div>
                  <div className="mt-1 text-sm text-muted-foreground">Systems Detected</div>
                </CardContent>
              </Card>
              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-blue-600">{analysisResult.metrics.articlesMatched}</div>
                  <div className="mt-1 text-sm text-muted-foreground">Regulations Apply</div>
                </CardContent>
              </Card>
              <Card className="border-orange-500/20 bg-orange-500/5">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-orange-600">{analysisResult.metrics.gapsIdentified}</div>
                  <div className="mt-1 text-sm text-muted-foreground">Compliance Gaps</div>
                </CardContent>
              </Card>
            </div>

            {/* THE MONEY SHOT: Compliance Gaps */}
            <Card className="border-2 border-orange-500/30">
              <CardHeader className="bg-orange-500/5">
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-5 w-5" />
                  {analysisResult.metrics.gapsIdentified} Compliance Gaps Found
                </CardTitle>
                <CardDescription>
                  These gaps could result in regulatory fines, audit failures, or operational risk.
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y">
                {analysisResult.complianceGaps.slice(0, 5).map((gap) => (
                  <div key={gap.id} className="py-4 first:pt-6">
                    <div className="mb-2 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(gap.severity)}>{gap.severity}</Badge>
                        <span className="font-mono text-sm font-medium">{gap.article}</span>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {gap.estimatedEffort} to fix
                      </Badge>
                    </div>
                    <p className="mb-2 font-medium">{gap.description}</p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Fix:</span> {gap.recommendation}
                    </p>
                  </div>
                ))}
                {analysisResult.complianceGaps.length > 5 && (
                  <div className="py-4 text-center text-muted-foreground">
                    +{analysisResult.complianceGaps.length - 5} more gaps (sign up to see all)
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detected Systems */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Detected Systems
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {analysisResult.detectedSystems.map((system, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-3 py-2',
                        getSeverityColor(system.riskLevel)
                      )}
                    >
                      {getCategoryIcon(system.category)}
                      <span className="font-medium">{system.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Executive Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-6 leading-relaxed text-muted-foreground">
                  {analysisResult.evidenceSummary.executiveSummary}
                </p>
                <div>
                  <h4 className="mb-3 font-semibold">Immediate Actions</h4>
                  <ul className="space-y-2">
                    {analysisResult.evidenceSummary.immediateActions.slice(0, 3).map((action, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-sm">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* CTA: Save & Get Full Report */}
            {!showSignup ? (
              <Card className="border-2 border-primary bg-gradient-to-r from-primary/5 to-primary/10">
                <CardContent className="py-8">
                  <div className="text-center">
                    <h3 className="mb-2 text-2xl font-bold">Save This Analysis & Track Your Compliance</h3>
                    <p className="mb-6 text-muted-foreground">
                      Create a free account to save your results, get the full gap report, and start fixing issues.
                    </p>
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                      <Button size="lg" className="gap-2" onClick={() => setShowSignup(true)}>
                        Save & Continue Free
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Link href="/contact">
                        <Button size="lg" variant="outline">
                          Talk to Sales
                        </Button>
                      </Link>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">14-day free trial • No credit card required</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-primary">
                <CardHeader>
                  <CardTitle>Create Your Account</CardTitle>
                  <CardDescription>Save your analysis and start tracking compliance</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email">Work Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Company Name</Label>
                        <Input
                          id="company"
                          placeholder="Acme Inc"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Min 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                    </div>

                    {signupError && (
                      <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600">{signupError}</div>
                    )}

                    <Button type="submit" className="w-full gap-2" size="lg" disabled={isSigningUp}>
                      {isSigningUp ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          Create Account & Save Analysis
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <p className="text-center text-sm text-muted-foreground">
                      Already have an account?{' '}
                      <Link href="/signin" className="text-primary hover:underline">
                        Sign in
                      </Link>
                    </p>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Trust Indicators (when no results) */}
        {!analysisResult && !isAnalyzing && (
          <div className="mx-auto mt-12 max-w-3xl">
            <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                <span>60-second analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span>DORA + AI Act + GDPR</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>No signup required</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
