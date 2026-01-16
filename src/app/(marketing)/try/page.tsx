'use client'

import { Container, GradientText } from '@/components/marketing/sections'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  ArrowRight,
  BanknoteIcon,
  Building2Icon,
  CheckCircle2,
  CloudIcon,
  CpuIcon,
  HeartPulseIcon,
  Loader2,
  MapIcon,
  NetworkIcon,
  ShieldCheckIcon,
  Sparkles,
  ZapIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

type Industry = {
  id: string
  name: string
  icon: typeof Building2Icon
  regulations: string[]
  systems: string[]
  avgGaps: number
  avgHoursSaved: number
}

const industries: Industry[] = [
  {
    id: 'banking',
    name: 'Banking',
    icon: Building2Icon,
    regulations: ['DORA', 'GDPR', 'Basel III', 'MiFID II', 'PSD2'],
    systems: ['Core Banking', 'Trading Platform', 'Payment Gateway', 'Risk Engine', 'Customer Portal'],
    avgGaps: 47,
    avgHoursSaved: 240,
  },
  {
    id: 'payments',
    name: 'Payments & Fintech',
    icon: BanknoteIcon,
    regulations: ['DORA', 'PSD2', 'GDPR', 'PCI DSS', 'AML 6'],
    systems: ['Payment Processor', 'Card Issuing', 'Fraud Detection', 'KYC System', 'Merchant Portal'],
    avgGaps: 38,
    avgHoursSaved: 180,
  },
  {
    id: 'insurance',
    name: 'Insurance',
    icon: ShieldCheckIcon,
    regulations: ['Solvency II', 'DORA', 'GDPR', 'IDD', 'IFRS 17'],
    systems: ['Policy Admin', 'Claims System', 'Underwriting Engine', 'Actuarial Models', 'Agent Portal'],
    avgGaps: 52,
    avgHoursSaved: 200,
  },
  {
    id: 'saas',
    name: 'SaaS & Cloud',
    icon: CloudIcon,
    regulations: ['SOC 2', 'GDPR', 'ISO 27001', 'CCPA', 'NIS2'],
    systems: ['Production API', 'Data Pipeline', 'Auth Service', 'Analytics', 'Admin Console'],
    avgGaps: 31,
    avgHoursSaved: 160,
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: HeartPulseIcon,
    regulations: ['HIPAA', 'GDPR', 'FDA 21 CFR', 'HITECH', 'MDR'],
    systems: ['EHR System', 'Lab Interface', 'Patient Portal', 'Imaging', 'Billing'],
    avgGaps: 44,
    avgHoursSaved: 220,
  },
  {
    id: 'ai',
    name: 'AI & ML',
    icon: CpuIcon,
    regulations: ['EU AI Act', 'GDPR', 'SOC 2', 'NYC Local Law 144', 'CCPA'],
    systems: ['Model Training', 'Inference API', 'Data Lake', 'Feature Store', 'Model Registry'],
    avgGaps: 29,
    avgHoursSaved: 150,
  },
]

type DemoPhase = 'select' | 'scanning' | 'results'

interface ScanResult {
  regulationsAnalyzed: number
  systemsMapped: number
  gapsFound: number
  hoursSaved: number
  criticalFindings: string[]
  systemMap: Array<{
    system: string
    regulations: string[]
    status: 'compliant' | 'gaps' | 'critical'
  }>
}

export default function TryPage() {
  const [phase, setPhase] = useState<DemoPhase>('select')
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)

  const handleSelectIndustry = async (industry: Industry) => {
    setSelectedIndustry(industry)
    setPhase('scanning')

    // Simulate the AI scanning process
    const steps = [
      { progress: 15, delay: 400 },
      { progress: 35, delay: 600 },
      { progress: 55, delay: 500 },
      { progress: 75, delay: 700 },
      { progress: 90, delay: 400 },
      { progress: 100, delay: 300 },
    ]

    for (const step of steps) {
      await new Promise((r) => setTimeout(r, step.delay))
      setScanProgress(step.progress)
    }

    // Generate results
    const result: ScanResult = {
      regulationsAnalyzed: industry.regulations.length,
      systemsMapped: industry.systems.length,
      gapsFound: industry.avgGaps,
      hoursSaved: industry.avgHoursSaved,
      criticalFindings: [
        `${Math.floor(industry.avgGaps * 0.3)} high-priority gaps in ${industry.regulations[0]} compliance`,
        `${Math.floor(industry.avgGaps * 0.2)} systems need updated incident reporting`,
        `Evidence documentation missing for ${Math.floor(industry.avgGaps * 0.15)} controls`,
      ],
      systemMap: industry.systems.map((system, i) => ({
        system,
        regulations: industry.regulations.slice(0, 2 + (i % 3)),
        status: i === 0 ? 'critical' : i < 3 ? 'gaps' : 'compliant',
      })),
    }

    setScanResult(result)
    setPhase('results')
  }

  const resetDemo = () => {
    setPhase('select')
    setSelectedIndustry(null)
    setScanProgress(0)
    setScanResult(null)
  }

  return (
    <section className="relative min-h-screen overflow-hidden pt-24 pb-20 lg:pt-32">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 h-150 w-150 -translate-x-1/2 rounded-full bg-linear-to-r from-blue-500/20 to-purple-500/20 blur-3xl" />
      </div>

      <Container>
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm dark:border-emerald-800 dark:bg-emerald-900/30">
            <ZapIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-emerald-700 dark:text-emerald-300">
              No signup required • See results in 10 seconds
            </span>
          </div>

          <h1 className="mb-4 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
            See your <GradientText>compliance gaps</GradientText> instantly
          </h1>

          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Select your industry and watch Cindral&apos;s AI map regulations to systems in real-time.
          </p>
        </div>

        {/* Demo Content */}
        <div className="mx-auto mt-12 max-w-5xl">
          {phase === 'select' && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {industries.map((industry) => (
                <Card
                  key={industry.id}
                  className="group cursor-pointer transition-all hover:border-primary hover:shadow-lg"
                  onClick={() => handleSelectIndustry(industry)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <industry.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{industry.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-3 text-sm text-zinc-500">
                      {industry.regulations.slice(0, 3).join(' • ')}
                      {industry.regulations.length > 3 && ` +${industry.regulations.length - 3} more`}
                    </p>
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>{industry.systems.length} systems</span>
                      <span className="text-emerald-600">~{industry.avgHoursSaved}h saved/quarter</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {phase === 'scanning' && (
            <Card className="mx-auto max-w-lg">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <CardTitle>Analyzing {selectedIndustry?.name} Compliance</CardTitle>
                <CardDescription>
                  Cindral&apos;s AI is mapping regulations to your typical system architecture
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Progress value={scanProgress} className="h-2" />

                <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {scanProgress >= 15 && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Loading {selectedIndustry?.regulations.length} regulatory frameworks...
                    </div>
                  )}
                  {scanProgress >= 35 && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Mapping {selectedIndustry?.systems.length} typical systems...
                    </div>
                  )}
                  {scanProgress >= 55 && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Analyzing obligation requirements...
                    </div>
                  )}
                  {scanProgress >= 75 && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Identifying compliance gaps...
                    </div>
                  )}
                  {scanProgress >= 90 && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Generating system impact map...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {phase === 'results' && scanResult && (
            <div className="space-y-8">
              {/* Stats Row */}
              <div className="grid gap-4 sm:grid-cols-4">
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-primary">{scanResult.regulationsAnalyzed}</div>
                    <div className="text-sm text-zinc-500">Regulations Analyzed</div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-primary">{scanResult.systemsMapped}</div>
                    <div className="text-sm text-zinc-500">Systems Mapped</div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-amber-600">{scanResult.gapsFound}</div>
                    <div className="text-sm text-zinc-500">Gaps Found</div>
                  </CardContent>
                </Card>
                <Card className="bg-emerald-50 text-center dark:bg-emerald-900/20">
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-emerald-600">{scanResult.hoursSaved}h</div>
                    <div className="text-sm text-emerald-700 dark:text-emerald-400">Saved Per Quarter</div>
                  </CardContent>
                </Card>
              </div>

              {/* System Map Visualization - THE WEDGE */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapIcon className="h-5 w-5 text-primary" />
                      <CardTitle>System Impact Map</CardTitle>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-rose-500" />
                        <span>Critical</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        <span>Has Gaps</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>Compliant</span>
                      </div>
                    </div>
                  </div>
                  <CardDescription>
                    This is your competitive advantage—see exactly which systems are affected by which regulations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {scanResult.systemMap.map((item) => (
                      <div
                        key={item.system}
                        className={cn(
                          'flex items-center justify-between rounded-lg border p-4 transition-colors',
                          item.status === 'critical' &&
                            'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-900/20',
                          item.status === 'gaps' &&
                            'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20',
                          item.status === 'compliant' &&
                            'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-900/20'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded',
                              item.status === 'critical' && 'bg-rose-200 dark:bg-rose-800',
                              item.status === 'gaps' && 'bg-amber-200 dark:bg-amber-800',
                              item.status === 'compliant' && 'bg-emerald-200 dark:bg-emerald-800'
                            )}
                          >
                            <NetworkIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{item.system}</div>
                            <div className="text-xs text-zinc-500">{item.regulations.join(' • ')}</div>
                          </div>
                        </div>
                        <div
                          className={cn(
                            'rounded-full px-3 py-1 text-xs font-medium',
                            item.status === 'critical' &&
                              'bg-rose-200 text-rose-700 dark:bg-rose-800 dark:text-rose-200',
                            item.status === 'gaps' &&
                              'bg-amber-200 text-amber-700 dark:bg-amber-800 dark:text-amber-200',
                            item.status === 'compliant' &&
                              'bg-emerald-200 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200'
                          )}
                        >
                          {item.status === 'critical' && 'Critical Gaps'}
                          {item.status === 'gaps' && 'Has Gaps'}
                          {item.status === 'compliant' && 'Compliant'}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Critical Findings */}
              <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-900/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <Sparkles className="h-5 w-5" />
                    AI-Identified Priority Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {scanResult.criticalFindings.map((finding, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        {finding}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="border-2 border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
                <CardContent className="flex flex-col items-center gap-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
                  <div>
                    <h3 className="text-xl font-bold">Ready to see your actual compliance posture?</h3>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      Connect your real systems and get a full compliance scan in under 60 seconds.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link href="/signup">
                      <Button size="lg" className="gap-2">
                        Start Full Scan
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="outline" size="lg" onClick={resetDemo}>
                      Try Another Industry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
