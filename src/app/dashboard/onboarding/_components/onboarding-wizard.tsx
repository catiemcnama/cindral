'use client'

import {
  ArrowRightIcon,
  BanknoteIcon,
  Building2Icon,
  CloudIcon,
  CpuIcon,
  DatabaseIcon,
  FactoryIcon,
  HardDriveIcon,
  HeartPulseIcon,
  MailIcon,
  NetworkIcon,
  ServerIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { readOnboardingState, writeOnboardingState } from '@/lib/onboarding-storage'
import { cn } from '@/lib/utils'

const steps = [
  { id: 1, title: 'Industry', description: 'Define your sector' },
  { id: 2, title: 'Regulations', description: 'Confirm scope' },
  { id: 3, title: 'Systems', description: 'Map your stack' },
  { id: 4, title: 'Team', description: 'Invite collaborators' },
]

type Industry = {
  id: string
  name: string
  description: string
  icon: typeof Building2Icon
}

type Regulation = {
  id: string
  name: string
  fullTitle: string
  jurisdiction: string
  articleCount: number
  obligationCount: number
  focus: string[]
}

type SystemCriticality = 'core' | 'important' | 'support'

type SystemTemplate = {
  id: string
  name: string
  description: string
  category: string
  criticality: SystemCriticality
  icon: typeof Building2Icon
  tags: string[]
}

type CustomSystem = {
  id: string
  name: string
  description: string
}

type Invite = {
  email: string
  role: string
}

const industries: Industry[] = [
  {
    id: 'banking',
    name: 'Banking & Capital Markets',
    description: 'Retail, investment, and commercial banking',
    icon: Building2Icon,
  },
  {
    id: 'payments',
    name: 'Payments & Fintech',
    description: 'Issuers, processors, wallets, and PSPs',
    icon: BanknoteIcon,
  },
  {
    id: 'insurance',
    name: 'Insurance',
    description: 'Life, P&C, specialty, and reinsurance',
    icon: ShieldCheckIcon,
  },
  {
    id: 'technology',
    name: 'SaaS & Cloud',
    description: 'Cloud platforms, SaaS, data processors',
    icon: CloudIcon,
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Life Sciences',
    description: 'Providers, payers, medtech, biotech',
    icon: HeartPulseIcon,
  },
  {
    id: 'critical',
    name: 'Critical Infrastructure',
    description: 'Energy, telecom, transport, utilities',
    icon: FactoryIcon,
  },
  {
    id: 'ai',
    name: 'AI & Data Products',
    description: 'Model providers, AI features, analytics',
    icon: CpuIcon,
  },
]

const regulations: Regulation[] = [
  {
    id: 'dora',
    name: 'DORA',
    fullTitle: 'Digital Operational Resilience Act (EU) 2022/2554',
    jurisdiction: 'European Union',
    articleCount: 64,
    obligationCount: 198,
    focus: ['ICT risk', 'Incident reporting', 'Third-party risk'],
  },
  {
    id: 'gdpr',
    name: 'GDPR',
    fullTitle: 'General Data Protection Regulation (EU) 2016/679',
    jurisdiction: 'European Union',
    articleCount: 99,
    obligationCount: 173,
    focus: ['Data protection', 'Privacy rights', 'Lawful processing'],
  },
  {
    id: 'ai-act',
    name: 'AI Act',
    fullTitle: 'Artificial Intelligence Act (EU) 2024/1689',
    jurisdiction: 'European Union',
    articleCount: 113,
    obligationCount: 142,
    focus: ['Risk management', 'Transparency', 'Model governance'],
  },
  {
    id: 'basel-iii',
    name: 'Basel III',
    fullTitle: 'Basel III: International Regulatory Framework for Banks',
    jurisdiction: 'International',
    articleCount: 42,
    obligationCount: 88,
    focus: ['Capital adequacy', 'Liquidity', 'Stress testing'],
  },
  {
    id: 'nis2',
    name: 'NIS2',
    fullTitle: 'Network and Information Security Directive 2 (EU) 2022/2555',
    jurisdiction: 'European Union',
    articleCount: 46,
    obligationCount: 96,
    focus: ['Cybersecurity', 'Supply chain', 'Reporting timelines'],
  },
]

const industryRecommendations: Record<string, string[]> = {
  banking: ['dora', 'basel-iii', 'gdpr', 'nis2'],
  payments: ['dora', 'gdpr', 'nis2'],
  insurance: ['dora', 'gdpr', 'nis2'],
  technology: ['gdpr', 'nis2', 'ai-act'],
  healthcare: ['gdpr', 'nis2', 'ai-act'],
  critical: ['nis2', 'gdpr'],
  ai: ['ai-act', 'gdpr', 'nis2'],
}

const systemTemplates: SystemTemplate[] = [
  {
    id: 'core-platform',
    name: 'Core Platform',
    description: 'Core transaction processing, policy admin, or account ledgers.',
    category: 'Core',
    criticality: 'core',
    icon: ServerIcon,
    tags: ['Ledger', 'Accounts', 'Transactions'],
  },
  {
    id: 'payments-gateway',
    name: 'Payments Gateway',
    description: 'Card issuing, payment routing, and settlement workflows.',
    category: 'Payments',
    criticality: 'core',
    icon: NetworkIcon,
    tags: ['Processing', 'Settlement', 'ISO 20022'],
  },
  {
    id: 'identity-access',
    name: 'Identity & Access',
    description: 'SSO, MFA, privileged access, and access review workflows.',
    category: 'Security',
    criticality: 'core',
    icon: ShieldCheckIcon,
    tags: ['IAM', 'MFA', 'Access reviews'],
  },
  {
    id: 'cloud-infrastructure',
    name: 'Cloud Infrastructure',
    description: 'Hosting, runtime environments, and infrastructure tooling.',
    category: 'Infrastructure',
    criticality: 'core',
    icon: CloudIcon,
    tags: ['AWS', 'Azure', 'GCP'],
  },
  {
    id: 'data-warehouse',
    name: 'Data Warehouse',
    description: 'Analytics, reporting, audit exports, and data governance.',
    category: 'Data',
    criticality: 'important',
    icon: DatabaseIcon,
    tags: ['BI', 'Reporting', 'Audit'],
  },
  {
    id: 'backup-recovery',
    name: 'Backup & Recovery',
    description: 'Disaster recovery, backups, and resilience tooling.',
    category: 'Resilience',
    criticality: 'important',
    icon: HardDriveIcon,
    tags: ['DR', 'RPO/RTO', 'Archival'],
  },
  {
    id: 'ai-platform',
    name: 'AI/ML Platform',
    description: 'Model training, inference services, and governance controls.',
    category: 'AI',
    criticality: 'support',
    icon: CpuIcon,
    tags: ['Model risk', 'Explainability'],
  },
]

const systemRecommendations: Record<string, string[]> = {
  banking: ['core-platform', 'payments-gateway', 'identity-access', 'data-warehouse', 'backup-recovery'],
  payments: ['payments-gateway', 'identity-access', 'cloud-infrastructure', 'data-warehouse', 'backup-recovery'],
  insurance: ['core-platform', 'identity-access', 'data-warehouse', 'backup-recovery'],
  technology: ['cloud-infrastructure', 'identity-access', 'data-warehouse', 'backup-recovery'],
  healthcare: ['identity-access', 'data-warehouse', 'backup-recovery'],
  critical: ['cloud-infrastructure', 'identity-access', 'backup-recovery'],
  ai: ['ai-platform', 'identity-access', 'cloud-infrastructure', 'data-warehouse'],
}

const criticalityLabels: Record<SystemCriticality, string> = {
  core: 'Core',
  important: 'Important',
  support: 'Support',
}

const criticalityStyles: Record<SystemCriticality, string> = {
  core: 'border-emerald-400/40 text-emerald-600 dark:text-emerald-400',
  important: 'border-amber-400/40 text-amber-600 dark:text-amber-400',
  support: 'border-muted-foreground/40 text-muted-foreground',
}

const inviteRoles = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
]

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const regulationIndex = regulations.reduce<Record<string, Regulation>>((acc, regulation) => {
  acc[regulation.id] = regulation
  return acc
}, {})

export function OnboardingWizard() {
  const [step, setStep] = useState(1)
  const [industryId, setIndustryId] = useState<string | null>(null)
  const [selectedRegulations, setSelectedRegulations] = useState<string[]>([])
  const [regulationsCustomized, setRegulationsCustomized] = useState(false)
  const [systemsCustomized, setSystemsCustomized] = useState(false)
  const [selectedSystems, setSelectedSystems] = useState<string[]>([])
  const [customSystems, setCustomSystems] = useState<CustomSystem[]>([])
  const [customSystemName, setCustomSystemName] = useState('')
  const [customSystemDescription, setCustomSystemDescription] = useState('')
  const [invites, setInvites] = useState<Invite[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState(inviteRoles[2]?.value ?? 'member')
  const [hasLoadedState, setHasLoadedState] = useState(false)

  const recommendedRegulations = useMemo(() => {
    if (!industryId) return []
    return industryRecommendations[industryId] ?? []
  }, [industryId])

  const recommendedSystems = useMemo(() => {
    if (!industryId) return []
    return systemRecommendations[industryId] ?? []
  }, [industryId])

  const selectedIndustry = useMemo(
    () => industries.find((industry) => industry.id === industryId) ?? null,
    [industryId]
  )

  const selectedRegulationData = useMemo(
    () => regulations.filter((regulation) => selectedRegulations.includes(regulation.id)),
    [selectedRegulations]
  )

  const selectedSystemTemplates = useMemo(
    () => systemTemplates.filter((system) => selectedSystems.includes(system.id)),
    [selectedSystems]
  )

  const selectedSystemNames = useMemo(() => {
    return [...selectedSystemTemplates.map((system) => system.name), ...customSystems.map((system) => system.name)]
  }, [selectedSystemTemplates, customSystems])

  const totalArticles = useMemo(
    () => selectedRegulationData.reduce((sum, regulation) => sum + regulation.articleCount, 0),
    [selectedRegulationData]
  )

  const totalObligations = useMemo(
    () => selectedRegulationData.reduce((sum, regulation) => sum + regulation.obligationCount, 0),
    [selectedRegulationData]
  )

  const jurisdictions = useMemo(() => {
    return Array.from(new Set(selectedRegulationData.map((regulation) => regulation.jurisdiction)))
  }, [selectedRegulationData])

  const totalSystems = selectedSystemTemplates.length + customSystems.length
  const systemNamePreview = selectedSystemNames.slice(0, 4)
  const systemNameOverflow = Math.max(selectedSystemNames.length - systemNamePreview.length, 0)

  const invitePreview = invites.slice(0, 3)
  const inviteOverflow = Math.max(invites.length - invitePreview.length, 0)

  const isInviteValid = EMAIL_REGEX.test(inviteEmail.trim())

  useEffect(() => {
    const stored = readOnboardingState()
    if (stored) {
      setIndustryId(stored.industryId)
      setSelectedRegulations(stored.regulations)
      setRegulationsCustomized(stored.regulationsCustomized)
      setSelectedSystems(stored.systems.templates)
      setCustomSystems(stored.systems.custom)
      setSystemsCustomized(stored.systemsCustomized)
      setInvites(stored.invites)
    }
    setHasLoadedState(true)
  }, [])

  useEffect(() => {
    if (!hasLoadedState) return
    writeOnboardingState({
      industryId,
      regulations: selectedRegulations,
      regulationsCustomized,
      systems: {
        templates: selectedSystems,
        custom: customSystems,
      },
      systemsCustomized,
      invites,
      updatedAt: new Date().toISOString(),
    })
  }, [
    industryId,
    selectedRegulations,
    regulationsCustomized,
    selectedSystems,
    customSystems,
    systemsCustomized,
    invites,
    hasLoadedState,
  ])

  // `recommendedRegulations` is derived from `industryId` via useMemo.
  // Use `industryId` in the dependency array to avoid unnecessary re-runs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!industryId || regulationsCustomized || !hasLoadedState) return
    setSelectedRegulations(recommendedRegulations)
  }, [industryId, regulationsCustomized, hasLoadedState])

  // `recommendedSystems` is derived from `industryId` via useMemo.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!industryId || systemsCustomized || !hasLoadedState) return
    setSelectedSystems(recommendedSystems)
  }, [industryId, systemsCustomized, hasLoadedState])

  const handleToggleRegulation = (id: string) => {
    setSelectedRegulations((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      }
      return [...prev, id]
    })
    setRegulationsCustomized(true)
  }

  const handleSelectIndustry = (id: string) => {
    setIndustryId(id)
    setRegulationsCustomized(false)
    setSystemsCustomized(false)
  }

  const handleResetRecommendations = () => {
    setSelectedRegulations(recommendedRegulations)
    setRegulationsCustomized(false)
  }

  const handleToggleSystem = (id: string) => {
    setSelectedSystems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      }
      return [...prev, id]
    })
    setSystemsCustomized(true)
  }

  const handleAddCustomSystem = () => {
    const name = customSystemName.trim()
    if (!name) return

    const description = customSystemDescription.trim()
    const slugBase = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    const id = slugBase ? `custom-${slugBase}` : `custom-${Date.now()}`

    setCustomSystems((prev) => [...prev, { id, name, description }])
    setCustomSystemName('')
    setCustomSystemDescription('')
    setSystemsCustomized(true)
  }

  const handleRemoveCustomSystem = (id: string) => {
    setCustomSystems((prev) => prev.filter((system) => system.id !== id))
  }

  const handleResetSystems = () => {
    setSelectedSystems(recommendedSystems)
    setSystemsCustomized(customSystems.length > 0)
  }

  const handleAddInvite = () => {
    const email = inviteEmail.trim().toLowerCase()
    if (!EMAIL_REGEX.test(email)) return

    setInvites((prev) => {
      if (prev.some((invite) => invite.email === email)) return prev
      return [...prev, { email, role: inviteRole }]
    })
    setInviteEmail('')
    setInviteRole(inviteRoles[2]?.value ?? 'member')
  }

  const handleRemoveInvite = (email: string) => {
    setInvites((prev) => prev.filter((invite) => invite.email !== email))
  }

  return (
    <div className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Badge variant="outline" className="w-fit">
            Onboarding
          </Badge>
          <div>
            <h1 className="text-2xl font-semibold">Set your regulatory scope</h1>
            <p className="text-sm text-muted-foreground">
              Pick your industry and confirm the regulations that apply to your organization.
            </p>
          </div>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/dashboard">Exit setup</Link>
        </Button>
      </div>

      <div className="mt-6 rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Step {step} of 4</p>
            <p className="text-xs text-muted-foreground">Industry + regulations takes about 2 minutes.</p>
          </div>
          <div className="w-full sm:w-64">
            <Progress value={(step / steps.length) * 100} />
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm',
                item.id === step
                  ? 'border-primary/40 bg-primary/5 text-foreground'
                  : 'border-border text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'flex size-7 items-center justify-center rounded-full text-xs font-semibold',
                  item.id <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                {item.id}
              </div>
              <div>
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {step === 1 && (
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle>Step 1: Choose your industry</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      We use this to preselect the regulations most likely to apply.
                    </p>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <SparklesIcon className="size-3" />
                    Auto-scope
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {industries.map((industry) => {
                    const isSelected = industry.id === industryId
                    const recommendations = industryRecommendations[industry.id] ?? []

                    return (
                      <button
                        key={industry.id}
                        type="button"
                        onClick={() => handleSelectIndustry(industry.id)}
                        className={cn(
                          'group flex h-full flex-col gap-4 rounded-xl border bg-card p-4 text-left transition hover:border-primary/40',
                          isSelected && 'border-primary/60 ring-1 ring-primary/20'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'flex size-10 items-center justify-center rounded-lg border bg-muted text-foreground',
                              isSelected && 'border-primary/40 bg-primary/10 text-primary'
                            )}
                          >
                            <industry.icon className="size-5" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">{industry.name}</div>
                            <div className="text-xs text-muted-foreground">{industry.description}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recommendations.map((regulationId) => (
                            <Badge key={regulationId} variant="outline">
                              {regulationIndex[regulationId]?.name ?? regulationId}
                            </Badge>
                          ))}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <Separator />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground">
                    {selectedIndustry ? `${selectedIndustry.name} selected.` : 'Select an industry to continue.'}
                  </div>
                  <Button onClick={() => setStep(2)} disabled={!selectedIndustry}>
                    Continue to regulations
                    <ArrowRightIcon className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle>Step 2: Confirm applicable regulations</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedIndustry
                        ? `Based on ${selectedIndustry.name}, we've preselected the most relevant frameworks.`
                        : 'Select an industry to see recommended regulations.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {regulationsCustomized && (
                      <Badge variant="secondary" className="gap-1">
                        <SparklesIcon className="size-3" />
                        Customized
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetRecommendations}
                      disabled={!selectedIndustry}
                    >
                      Reset to recommended
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedIndustry && (
                  <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                    Select an industry to view the regulation list.
                  </div>
                )}

                {selectedIndustry && (
                  <div className="space-y-3">
                    {regulations.map((regulation) => {
                      const isSelected = selectedRegulations.includes(regulation.id)
                      const isRecommended = recommendedRegulations.includes(regulation.id)

                      return (
                        <div
                          key={regulation.id}
                          className={cn(
                            'flex flex-col gap-3 rounded-xl border p-4 transition md:flex-row md:items-start',
                            isSelected
                              ? 'border-primary/60 bg-primary/5'
                              : 'border-border hover:border-muted-foreground/40'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={`reg-${regulation.id}`}
                              checked={isSelected}
                              onCheckedChange={() => handleToggleRegulation(regulation.id)}
                            />
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <label htmlFor={`reg-${regulation.id}`} className="text-sm font-medium">
                                  {regulation.name}
                                </label>
                                <Badge variant="outline">{regulation.jurisdiction}</Badge>
                                {isRecommended && (
                                  <Badge variant="secondary" className="gap-1">
                                    <SparklesIcon className="size-3" />
                                    Recommended
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{regulation.fullTitle}</p>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span>{regulation.articleCount} articles</span>
                                <span>-</span>
                                <span>{regulation.obligationCount} obligations</span>
                                <span>-</span>
                                <span>{regulation.focus.join(', ')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <Separator />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back to industry
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={!selectedRegulations.length}>
                    Continue to systems
                    <ArrowRightIcon className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle>Step 3: Add your systems</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Add the systems you want to map against regulatory obligations.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {systemsCustomized && (
                      <Badge variant="secondary" className="gap-1">
                        <SparklesIcon className="size-3" />
                        Customized
                      </Badge>
                    )}
                    <Button variant="outline" size="sm" onClick={handleResetSystems} disabled={!industryId}>
                      Reset to recommended
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {systemTemplates.map((system) => {
                    const isSelected = selectedSystems.includes(system.id)
                    const isRecommended = recommendedSystems.includes(system.id)
                    const Icon = system.icon

                    return (
                      <div
                        key={system.id}
                        className={cn(
                          'flex gap-3 rounded-xl border p-4 transition',
                          isSelected
                            ? 'border-primary/60 bg-primary/5'
                            : 'border-border hover:border-muted-foreground/40'
                        )}
                      >
                        <Checkbox
                          id={`system-${system.id}`}
                          checked={isSelected}
                          onCheckedChange={() => handleToggleSystem(system.id)}
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <label
                              htmlFor={`system-${system.id}`}
                              className="flex items-center gap-2 text-sm font-medium"
                            >
                              <Icon className="size-4 text-muted-foreground" />
                              {system.name}
                            </label>
                            <Badge variant="outline">{system.category}</Badge>
                            <Badge variant="outline" className={criticalityStyles[system.criticality]}>
                              {criticalityLabels[system.criticality]}
                            </Badge>
                            {isRecommended && (
                              <Badge variant="secondary" className="gap-1">
                                <SparklesIcon className="size-3" />
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{system.description}</p>
                          <p className="text-xs text-muted-foreground">{system.tags.join(' / ')}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">Add a custom system</p>
                      <p className="text-xs text-muted-foreground">
                        Capture internal tools, vendors, or bespoke platforms.
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="customSystemName">System name</Label>
                        <Input
                          id="customSystemName"
                          value={customSystemName}
                          onChange={(event) => setCustomSystemName(event.target.value)}
                          placeholder="Risk data lake"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customSystemDescription">Description</Label>
                        <Textarea
                          id="customSystemDescription"
                          value={customSystemDescription}
                          onChange={(event) => setCustomSystemDescription(event.target.value)}
                          placeholder="Describe what the system does and who owns it."
                          className="min-h-[88px]"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-muted-foreground">You can add owners and evidence later.</p>
                      <Button size="sm" onClick={handleAddCustomSystem} disabled={!customSystemName.trim()}>
                        Add system
                      </Button>
                    </div>
                  </div>
                </div>

                {customSystems.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">Custom systems</p>
                    <div className="space-y-2">
                      {customSystems.map((system) => (
                        <div
                          key={system.id}
                          className="flex flex-col justify-between gap-3 rounded-lg border bg-muted/40 p-3 sm:flex-row sm:items-center"
                        >
                          <div>
                            <p className="text-sm font-medium">{system.name}</p>
                            {system.description && (
                              <p className="text-xs text-muted-foreground">{system.description}</p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveCustomSystem(system.id)}>
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back to regulations
                  </Button>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <Button variant="ghost" onClick={() => setStep(4)}>
                      Skip for now
                    </Button>
                    <Button onClick={() => setStep(4)} disabled={totalSystems === 0}>
                      Continue to team
                      <ArrowRightIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle>Step 4: Invite your team</CardTitle>
                    <p className="text-sm text-muted-foreground">Add compliance, security, and engineering partners.</p>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <UsersIcon className="size-3" />
                    Team setup
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px_auto]">
                  <div className="space-y-2">
                    <Label htmlFor="inviteEmail">Email address</Label>
                    <div className="relative">
                      <MailIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="inviteEmail"
                        value={inviteEmail}
                        onChange={(event) => setInviteEmail(event.target.value)}
                        placeholder="teammate@company.com"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inviteRole">Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger id="inviteRole" className="w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {inviteRoles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddInvite} disabled={!isInviteValid}>
                      <UserPlusIcon className="size-4" />
                      Add invite
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Invites will be sent after you finish onboarding.</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Pending invites</p>
                    <Badge variant="outline">{invites.length} total</Badge>
                  </div>
                  {invites.length === 0 ? (
                    <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                      No invites added yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {invites.map((invite) => {
                        const roleLabel = inviteRoles.find((role) => role.value === invite.role)?.label ?? invite.role

                        return (
                          <div
                            key={invite.email}
                            className="flex flex-col justify-between gap-3 rounded-lg border bg-muted/40 p-3 sm:flex-row sm:items-center"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                <UsersIcon className="size-4" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{invite.email}</p>
                                <p className="text-xs text-muted-foreground">{roleLabel}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveInvite(invite.email)}>
                              Remove
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    Back to systems
                  </Button>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <Button variant="ghost" asChild>
                      <Link href="/dashboard">Finish later</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/dashboard/regulations">
                        Finish onboarding
                        <ArrowRightIcon className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scope summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Industry</p>
                <p className="text-sm font-medium">{selectedIndustry ? selectedIndustry.name : 'Select an industry'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Regulations</p>
                  <p className="text-xl font-semibold">{selectedRegulationData.length}</p>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Articles</p>
                  <p className="text-xl font-semibold">{totalArticles}</p>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Obligations</p>
                  <p className="text-xl font-semibold">{totalObligations}</p>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Jurisdictions</p>
                  <p className="text-xl font-semibold">{jurisdictions.length}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Selected regulations</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedRegulationData.length === 0 && (
                    <span className="text-xs text-muted-foreground">No regulations selected yet.</span>
                  )}
                  {selectedRegulationData.map((regulation) => (
                    <Badge key={regulation.id} variant="secondary">
                      {regulation.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {jurisdictions.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Coverage</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {jurisdictions.map((jurisdiction) => (
                      <Badge key={jurisdiction} variant="outline">
                        {jurisdiction}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground">Systems</p>
                <p className="text-sm font-medium">
                  {totalSystems > 0 ? `${totalSystems} systems selected` : 'No systems added yet'}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {totalSystems === 0 && (
                    <span className="text-xs text-muted-foreground">Add systems to map obligations.</span>
                  )}
                  {systemNamePreview.map((name) => (
                    <Badge key={name} variant="secondary">
                      {name}
                    </Badge>
                  ))}
                  {systemNameOverflow > 0 && <Badge variant="outline">+{systemNameOverflow} more</Badge>}
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Team invites</p>
                <p className="text-sm font-medium">
                  {invites.length > 0 ? `${invites.length} pending` : 'No invites yet'}
                </p>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {invites.length === 0 && <span>Add collaborators for shared ownership.</span>}
                  {invitePreview.map((invite) => {
                    const roleLabel = inviteRoles.find((role) => role.value === invite.role)?.label ?? invite.role

                    return (
                      <div key={invite.email} className="flex items-center justify-between gap-2">
                        <span className="truncate">{invite.email}</span>
                        <span>{roleLabel}</span>
                      </div>
                    )
                  })}
                  {inviteOverflow > 0 && <span>+{inviteOverflow} more</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next up</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium text-foreground">Add your first systems</p>
                  <p>Connect apps and infrastructure to map regulation impact.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  4
                </div>
                <div>
                  <p className="font-medium text-foreground">Invite your team</p>
                  <p>Assign owners and set responsibilities quickly.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
