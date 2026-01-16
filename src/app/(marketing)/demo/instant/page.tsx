'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useTRPC } from '@/trpc/client'
import { useMutation } from '@tanstack/react-query'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cloud,
  Database,
  FileText,
  Loader2,
  Server,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useState } from 'react'

const EXAMPLE_DESCRIPTIONS = [
  'We use AWS, run Python APIs with FastAPI, store customer data in PostgreSQL, and process payments through Stripe.',
  'Our stack includes Azure Kubernetes, Node.js microservices, MongoDB for user profiles, and Redis for caching. We operate in the EU.',
  'Java Spring Boot APIs on GCP, MySQL database with financial transaction data, Docker containers orchestrated by K8s.',
]

// Types for the analysis result
interface DetectedSystem {
  name: string
  category: 'cloud' | 'database' | 'api' | 'storage' | 'compute' | 'network' | 'other'
  dataTypes: string[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

interface ApplicableArticle {
  regulation: string
  articleNumber: string
  title: string
  summary: string
  relevance: string
  impactLevel: 'low' | 'medium' | 'high' | 'critical'
  affectedSystems: string[]
}

interface ComplianceGap {
  id: string
  article: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
  estimatedEffort: 'hours' | 'days' | 'weeks' | 'months'
}

interface AnalysisResult {
  analysisTimeMs: number
  timestamp: string
  detectedSystems: DetectedSystem[]
  applicableArticles: ApplicableArticle[]
  complianceGaps: ComplianceGap[]
  evidenceSummary: {
    executiveSummary: string
    riskHighlights: Array<{ area: string; level: string; description: string }>
    immediateActions: string[]
  }
  metrics: {
    systemsAnalyzed: number
    articlesMatched: number
    gapsIdentified: number
    evidenceItemsGenerated: number
  }
  aiMetadata: {
    tokensUsed: number
    model: string
    confidence: number
  }
  pricing: {
    gapsIdentified: { count: number; unitPrice: number; total: number }
    evidencePacks: { count: number; unitPrice: number; total: number }
    articlesAnalyzed: { count: number; unitPrice: number; total: number }
    totalValue: number
    suggestedPlan: string
  }
}

export default function InstantDemoPage() {
  const [description, setDescription] = useState('')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  const trpc = useTRPC()
  const analyzeMutation = useMutation({
    ...trpc.magicDemo.analyze.mutationOptions(),
  })

  const handleAnalyze = async () => {
    if (description.length < 20) return

    try {
      const result = await analyzeMutation.mutateAsync({
        description,
        region: description.toLowerCase().includes('eu') ? 'EU' : undefined,
      })
      setAnalysisResult(result as AnalysisResult)
    } catch (error) {
      console.error('Analysis failed:', error)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cloud':
        return <Cloud className="h-4 w-4" />
      case 'database':
        return <Database className="h-4 w-4" />
      case 'api':
        return <Server className="h-4 w-4" />
      default:
        return <Server className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'high':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      default:
        return 'bg-green-500/10 text-green-500 border-green-500/20'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            60-Second Compliance Analysis
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            See Your Compliance Gaps
            <span className="text-primary"> Instantly</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            Describe your tech stack → Get every applicable regulation, affected systems, and compliance gaps in under
            60 seconds.
          </p>
        </div>

        {/* Input Section */}
        <div className="mx-auto mb-8 max-w-3xl">
          <Card className="border-2 border-dashed border-primary/30 bg-card/50 backdrop-blur">
            <CardContent className="pt-6">
              <Textarea
                placeholder="Describe your tech stack...&#10;&#10;Example: We use AWS, run Python APIs, store customer data in Postgres..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px] resize-none border-0 bg-transparent text-lg focus-visible:ring-0"
                disabled={analyzeMutation.isPending}
              />
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <div className="flex gap-2">
                  {EXAMPLE_DESCRIPTIONS.map((example, i) => (
                    <Button
                      key={i}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setDescription(example)}
                      disabled={analyzeMutation.isPending}
                    >
                      Example {i + 1}
                    </Button>
                  ))}
                </div>
                <Button
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={description.length < 20 || analyzeMutation.isPending}
                  className="gap-2"
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Analyze Now
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {analyzeMutation.isPending && (
          <div className="mx-auto mb-8 max-w-3xl">
            <Card>
              <CardContent className="py-12 text-center">
                <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
                <h3 className="mb-2 text-lg font-semibold">Analyzing your tech stack...</h3>
                <p className="text-muted-foreground">Detecting systems, matching regulations, identifying gaps...</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results */}
        {analysisResult && !analyzeMutation.isPending && (
          <div className="mx-auto max-w-5xl space-y-6">
            {/* Analysis Time Banner */}
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Analysis Complete</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{(analysisResult.analysisTimeMs / 1000).toFixed(1)}s</span>
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-primary">{analysisResult.metrics.systemsAnalyzed}</div>
                  <div className="mt-1 text-sm text-muted-foreground">Systems Detected</div>
                </CardContent>
              </Card>
              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-blue-500">{analysisResult.metrics.articlesMatched}</div>
                  <div className="mt-1 text-sm text-muted-foreground">Articles Applicable</div>
                </CardContent>
              </Card>
              <Card className="border-orange-500/20 bg-orange-500/5">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-orange-500">{analysisResult.metrics.gapsIdentified}</div>
                  <div className="mt-1 text-sm text-muted-foreground">Compliance Gaps</div>
                </CardContent>
              </Card>
              <Card className="border-green-500/20 bg-green-500/5">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-green-500">
                    {analysisResult.metrics.evidenceItemsGenerated}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">Evidence Items</div>
                </CardContent>
              </Card>
            </div>

            {/* Detected Systems */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Detected Systems
                </CardTitle>
                <CardDescription>Systems identified from your tech stack description</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {analysisResult.detectedSystems.map((system, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${getSeverityColor(system.riskLevel)}`}
                    >
                      {getCategoryIcon(system.category)}
                      <span className="font-medium">{system.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {system.riskLevel}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Compliance Gaps - THE MONEY SHOT */}
            <Card className="border-orange-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-500">
                  <AlertTriangle className="h-5 w-5" />
                  Compliance Gaps Identified
                </CardTitle>
                <CardDescription>Issues requiring immediate attention for regulatory compliance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysisResult.complianceGaps.map((gap) => (
                  <div key={gap.id} className={`rounded-lg border p-4 ${getSeverityColor(gap.severity)}`}>
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(gap.severity)}>{gap.severity}</Badge>
                        <span className="font-mono text-sm">{gap.article}</span>
                      </div>
                      <Badge variant="outline">{gap.estimatedEffort}</Badge>
                    </div>
                    <p className="mb-2 font-medium">{gap.description}</p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Recommendation:</span> {gap.recommendation}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Applicable Regulations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Applicable Regulations
                </CardTitle>
                <CardDescription>Regulatory articles that apply to your systems</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.applicableArticles.slice(0, 8).map((article, i) => (
                    <div key={i} className="flex items-start gap-4 rounded-lg bg-muted/50 p-3">
                      <div className="flex-shrink-0">
                        <Badge variant="outline" className="font-mono">
                          {article.regulation} Art. {article.articleNumber}
                        </Badge>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{article.title}</div>
                        <p className="line-clamp-2 text-sm text-muted-foreground">{article.summary}</p>
                        <p className="mt-1 text-xs text-primary">{article.relevance}</p>
                      </div>
                      <Badge className={getSeverityColor(article.impactLevel)}>{article.impactLevel}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Executive Summary */}
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-muted-foreground">
                  {analysisResult.evidenceSummary.executiveSummary}
                </p>

                {analysisResult.evidenceSummary.immediateActions.length > 0 && (
                  <div className="mt-6">
                    <h4 className="mb-3 font-semibold">Immediate Actions Required</h4>
                    <ul className="space-y-2">
                      {analysisResult.evidenceSummary.immediateActions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-primary" />
                          <span className="text-sm">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Outcome-Based Pricing */}
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle>Value Delivered</CardTitle>
                <CardDescription>Pay for outcomes, not seats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b py-2">
                    <span>{analysisResult.pricing.gapsIdentified.count} compliance gaps identified</span>
                    <span className="font-mono">${analysisResult.pricing.gapsIdentified.total}</span>
                  </div>
                  <div className="flex items-center justify-between border-b py-2">
                    <span>{analysisResult.pricing.evidencePacks.count} evidence pack generated</span>
                    <span className="font-mono">${analysisResult.pricing.evidencePacks.total}</span>
                  </div>
                  <div className="flex items-center justify-between border-b py-2">
                    <span>{analysisResult.pricing.articlesAnalyzed.count} regulation articles analyzed</span>
                    <span className="font-mono">${analysisResult.pricing.articlesAnalyzed.total}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 text-lg font-bold">
                    <span>Total Value</span>
                    <span className="text-primary">${analysisResult.pricing.totalValue}</span>
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <Button size="lg" className="flex-1">
                    Start Free Trial
                  </Button>
                  <Button size="lg" variant="outline" className="flex-1">
                    Talk to Sales
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trust Indicators */}
        {!analysisResult && !analyzeMutation.isPending && (
          <div className="mx-auto mt-12 max-w-3xl text-center">
            <div className="flex items-center justify-center gap-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span>SOC 2 Type II</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>&lt;60s Analysis</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
