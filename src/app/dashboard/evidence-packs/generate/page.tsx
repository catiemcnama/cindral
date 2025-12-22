'use client'

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  FileJsonIcon,
  FileTextIcon,
  Loader2Icon,
  SparklesIcon,
  UsersIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'
import { useMutation, useQuery } from '@tanstack/react-query'

// =============================================================================
// Types
// =============================================================================

type PackFormat = 'pdf' | 'json' | 'confluence' | 'jira'
type PackAudience = 'internal' | 'auditor' | 'regulator'

interface WizardState {
  title: string
  description: string
  regulationId: string | null
  articleIds: string[]
  systemIds: string[]
  format: PackFormat
  audience: PackAudience
}

const STEPS = [
  { id: 1, title: 'Regulation', description: 'Select regulation' },
  { id: 2, title: 'Scope', description: 'Choose articles' },
  { id: 3, title: 'Systems', description: 'Include systems' },
  { id: 4, title: 'Format', description: 'Output options' },
  { id: 5, title: 'Review', description: 'Generate pack' },
]

const FORMAT_OPTIONS: { id: PackFormat; label: string; description: string; icon: typeof FileTextIcon }[] = [
  { id: 'pdf', label: 'PDF Document', description: 'Formatted PDF ready for sharing', icon: FileTextIcon },
  { id: 'json', label: 'JSON Export', description: 'Structured data for integrations', icon: FileJsonIcon },
  { id: 'confluence', label: 'Confluence', description: 'Push to Confluence workspace', icon: FileTextIcon },
  { id: 'jira', label: 'Jira Issues', description: 'Create linked Jira issues', icon: FileTextIcon },
]

const AUDIENCE_OPTIONS: { id: PackAudience; label: string; description: string }[] = [
  { id: 'internal', label: 'Internal', description: 'For internal compliance teams' },
  { id: 'auditor', label: 'Auditor', description: 'For external audit review' },
  { id: 'regulator', label: 'Regulator', description: 'For regulatory submission' },
]

// =============================================================================
// Component
// =============================================================================

export default function GenerateEvidencePackPage() {
  const router = useRouter()
  const trpc = useTRPC()

  const [step, setStep] = useState(1)
  const [state, setState] = useState<WizardState>({
    title: '',
    description: '',
    regulationId: null,
    articleIds: [],
    systemIds: [],
    format: 'pdf',
    audience: 'internal',
  })

  // Query regulations
  const regulationsQuery = useQuery({
    ...trpc.regulations.list.queryOptions({ limit: 50 }),
    staleTime: 60000,
  })

  // Query articles for selected regulation
  const articlesQuery = useQuery({
    ...trpc.articles.list.queryOptions({ regulationId: state.regulationId!, limit: 100 }),
    enabled: !!state.regulationId,
    staleTime: 60000,
  })

  // Query systems
  const systemsQuery = useQuery({
    ...trpc.systems.list.queryOptions({ limit: 100 }),
    staleTime: 60000,
  })

  // Generate mutation
  const generateMutation = useMutation({
    ...trpc.evidencePacks.generate.mutationOptions(),
    onSuccess: (data) => {
      router.push(`/dashboard/evidence-packs/${data.id}`)
    },
  })

  // Extract data for stable dependencies
  const regulationItems = regulationsQuery.data?.items
  const articleItems = articlesQuery.data?.items
  const systemItems = systemsQuery.data?.items

  // Derived data
  const selectedRegulation = useMemo(() => {
    if (!state.regulationId || !regulationItems) return null
    return regulationItems.find((r) => r.id === state.regulationId) ?? null
  }, [state.regulationId, regulationItems])

  // Handlers
  const handleSelectRegulation = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      regulationId: id,
      articleIds: [], // Reset articles when regulation changes
      title: '', // Reset title
    }))
  }, [])

  const handleToggleArticle = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      articleIds: prev.articleIds.includes(id) ? prev.articleIds.filter((a) => a !== id) : [...prev.articleIds, id],
    }))
  }, [])

  const handleSelectAllArticles = useCallback(() => {
    if (!articleItems) return
    setState((prev) => ({
      ...prev,
      articleIds: prev.articleIds.length === articleItems.length ? [] : articleItems.map((a) => a.id),
    }))
  }, [articleItems])

  const handleToggleSystem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      systemIds: prev.systemIds.includes(id) ? prev.systemIds.filter((s) => s !== id) : [...prev.systemIds, id],
    }))
  }, [])

  const handleGenerate = useCallback(() => {
    if (!state.regulationId) return

    const title = state.title || `${selectedRegulation?.name} Evidence Pack`

    generateMutation.mutate({
      title,
      description: state.description || undefined,
      regulationId: state.regulationId,
      exportFormat: state.format,
      intendedAudience: state.audience,
    })
  }, [state, selectedRegulation, generateMutation])

  const canProceed = useMemo(() => {
    switch (step) {
      case 1:
        return !!state.regulationId
      case 2:
        return true // Can proceed with all articles
      case 3:
        return true // Systems are optional
      case 4:
        return true // Format always selected
      case 5:
        return true
      default:
        return false
    }
  }, [step, state.regulationId])

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/evidence-packs">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Generate Evidence Pack</h1>
          <p className="text-sm text-muted-foreground">Create compliance documentation for audits</p>
        </div>
      </div>

      {/* Progress */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">
              Step {step} of {STEPS.length}
            </p>
            <Progress value={(step / STEPS.length) * 100} className="h-2 w-48" />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {STEPS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => s.id < step && setStep(s.id)}
                disabled={s.id > step}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg p-2 text-center transition',
                  s.id === step && 'bg-primary/10 text-primary',
                  s.id < step && 'cursor-pointer text-emerald-500 hover:bg-muted',
                  s.id > step && 'cursor-not-allowed text-muted-foreground'
                )}
              >
                <div
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full text-sm font-semibold',
                    s.id === step && 'bg-primary text-primary-foreground',
                    s.id < step && 'bg-emerald-500 text-white',
                    s.id > step && 'bg-muted text-muted-foreground'
                  )}
                >
                  {s.id < step ? <CheckCircle2Icon className="size-4" /> : s.id}
                </div>
                <span className="text-xs font-medium">{s.title}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Step 1: Select Regulation */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Regulation</CardTitle>
                <CardDescription>Choose the regulation to generate evidence for</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {regulationsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : regulationsQuery.data?.items.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No regulations found. Add regulations in the Regulations section.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {regulationsQuery.data?.items.map((reg) => (
                      <button
                        key={reg.id}
                        type="button"
                        onClick={() => handleSelectRegulation(reg.id)}
                        className={cn(
                          'flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition hover:border-primary/40',
                          state.regulationId === reg.id && 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{reg.framework ?? reg.name}</Badge>
                          {reg.jurisdiction && (
                            <span className="text-xs text-muted-foreground">{reg.jurisdiction}</span>
                          )}
                        </div>
                        <p className="text-sm font-medium">{reg.name}</p>
                        {reg.fullTitle && <p className="line-clamp-2 text-xs text-muted-foreground">{reg.fullTitle}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Select Scope */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Select Articles</CardTitle>
                    <CardDescription>Choose specific articles or include all</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSelectAllArticles}>
                    {state.articleIds.length === articlesQuery.data?.items.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {articlesQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : articlesQuery.data?.items.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">No articles found for this regulation</div>
                ) : (
                  <div className="max-h-96 space-y-2 overflow-y-auto">
                    {articlesQuery.data?.items.map((article) => {
                      const isSelected = state.articleIds.length === 0 || state.articleIds.includes(article.id)

                      return (
                        <label
                          key={article.id}
                          className={cn(
                            'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition',
                            isSelected ? 'border-primary/40 bg-primary/5' : 'hover:bg-muted/50'
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleArticle(article.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Article {article.articleNumber}</p>
                            {article.title && <p className="text-xs text-muted-foreground">{article.title}</p>}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}
                <p className="mt-4 text-xs text-muted-foreground">
                  {state.articleIds.length === 0
                    ? 'All articles will be included'
                    : `${state.articleIds.length} articles selected`}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Select Systems */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Include Systems</CardTitle>
                <CardDescription>Select systems to include in the evidence pack (optional)</CardDescription>
              </CardHeader>
              <CardContent>
                {systemsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : systemsQuery.data?.items.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No systems configured. You can add systems later.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {systemsQuery.data?.items.map((system) => {
                      const isSelected = state.systemIds.includes(system.id)

                      return (
                        <label
                          key={system.id}
                          className={cn(
                            'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition',
                            isSelected ? 'border-primary/40 bg-primary/5' : 'hover:bg-muted/50'
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleSystem(system.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{system.name}</p>
                            {system.category && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {system.category}
                              </Badge>
                            )}
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}
                <p className="mt-4 text-xs text-muted-foreground">{state.systemIds.length} systems selected</p>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Format & Audience */}
          {step === 4 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Export Format</CardTitle>
                  <CardDescription>Choose how to export the evidence pack</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={state.format}
                    onValueChange={(v) => setState((prev) => ({ ...prev, format: v as PackFormat }))}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    {FORMAT_OPTIONS.map((option) => (
                      <label
                        key={option.id}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition',
                          state.format === option.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        )}
                      >
                        <RadioGroupItem value={option.id} className="mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <option.icon className="size-4 text-muted-foreground" />
                            <p className="text-sm font-medium">{option.label}</p>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Intended Audience</CardTitle>
                  <CardDescription>Who will receive this evidence pack?</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={state.audience}
                    onValueChange={(v) => setState((prev) => ({ ...prev, audience: v as PackAudience }))}
                    className="grid gap-3 sm:grid-cols-3"
                  >
                    {AUDIENCE_OPTIONS.map((option) => (
                      <label
                        key={option.id}
                        className={cn(
                          'flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 text-center transition',
                          state.audience === option.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        )}
                      >
                        <RadioGroupItem value={option.id} />
                        <UsersIcon className="size-5 text-muted-foreground" />
                        <p className="text-sm font-medium">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </label>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Generate</CardTitle>
                <CardDescription>Confirm the details and generate your evidence pack</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pack Details */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Pack Title</Label>
                    <Input
                      id="title"
                      placeholder={`${selectedRegulation?.name ?? 'Evidence'} Pack`}
                      value={state.title}
                      onChange={(e) => setState((prev) => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Add notes about this evidence pack..."
                      value={state.description}
                      onChange={(e) => setState((prev) => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </div>

                <Separator />

                {/* Summary */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Regulation</p>
                    <p className="mt-1 font-medium">{selectedRegulation?.name ?? '-'}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Articles</p>
                    <p className="mt-1 font-medium">
                      {state.articleIds.length === 0
                        ? `All (${articlesQuery.data?.items.length ?? 0})`
                        : state.articleIds.length}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Systems</p>
                    <p className="mt-1 font-medium">{state.systemIds.length || 'None'}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs text-muted-foreground">Format</p>
                    <p className="mt-1 font-medium">{FORMAT_OPTIONS.find((f) => f.id === state.format)?.label}</p>
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending || !state.regulationId}
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2Icon className="mr-2 size-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="mr-2 size-4" />
                      Generate Evidence Pack
                    </>
                  )}
                </Button>

                {generateMutation.error && (
                  <p className="text-sm text-destructive">Failed to generate: {generateMutation.error.message}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Summary */}
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pack Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Regulation</p>
                <p className="font-medium">{selectedRegulation?.name ?? 'Not selected'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Articles</p>
                <p className="font-medium">
                  {state.articleIds.length === 0
                    ? `All (${articlesQuery.data?.items.length ?? '-'})`
                    : `${state.articleIds.length} selected`}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Systems</p>
                <p className="font-medium">{state.systemIds.length || 'None'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Format</p>
                <p className="font-medium">{FORMAT_OPTIONS.find((f) => f.id === state.format)?.label}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Audience</p>
                <p className="font-medium">{AUDIENCE_OPTIONS.find((a) => a.id === state.audience)?.label}</p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
          <ArrowLeftIcon className="mr-2 size-4" />
          Previous
        </Button>
        {step < STEPS.length ? (
          <Button onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))} disabled={!canProceed}>
            Next
            <ArrowRightIcon className="ml-2 size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
