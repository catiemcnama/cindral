'use client'

import { useCallback, useMemo, useState } from 'react'
import { LinkIcon, SearchIcon } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useTRPCClient } from '@/trpc/client'

import { IMPACT_COLORS } from '../constants'

interface ConnectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fromNodeId: string | null
  fromType: 'article' | 'system' | null
  articles: Array<{
    id: string
    articleNumber: string
    title: string | null
    regulationName: string
  }>
  systems: Array<{
    id: string
    name: string
    category: string | null
  }>
  onSuccess: () => void
}

export function ConnectDialog({
  open,
  onOpenChange,
  fromNodeId,
  fromType,
  articles,
  systems,
  onSuccess,
}: ConnectDialogProps) {
  const trpcClient = useTRPCClient()
  const [targetId, setTargetId] = useState<string>('')
  const [impactLevel, setImpactLevel] = useState<'critical' | 'high' | 'medium' | 'low'>('medium')
  const [search, setSearch] = useState('')

  const createImpact = useMutation({
    mutationFn: (input: { articleId: string; systemId: string; impactLevel: 'critical' | 'high' | 'medium' | 'low' }) =>
      trpcClient.systemMap.createImpact.mutate(input),
    onSuccess: () => {
      onSuccess()
      onOpenChange(false)
      resetForm()
    },
  })

  const resetForm = useCallback(() => {
    setTargetId('')
    setImpactLevel('medium')
    setSearch('')
  }, [])

  // Determine what we're connecting to
  const isConnectingToSystem = fromType === 'article'
  const targetLabel = isConnectingToSystem ? 'System' : 'Article'
  const targetOptions = isConnectingToSystem ? systems : articles

  // Filter options by search
  const filteredOptions = useMemo(() => {
    if (!search) return targetOptions
    const searchLower = search.toLowerCase()
    return targetOptions.filter((opt) => {
      if ('name' in opt) {
        return (
          opt.name.toLowerCase().includes(searchLower) ||
          opt.category?.toLowerCase().includes(searchLower)
        )
      }
      return (
        opt.articleNumber.toLowerCase().includes(searchLower) ||
        opt.title?.toLowerCase().includes(searchLower) ||
        opt.regulationName.toLowerCase().includes(searchLower)
      )
    })
  }, [targetOptions, search])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!fromNodeId || !targetId) return

      const articleId = isConnectingToSystem ? fromNodeId : targetId
      const systemId = isConnectingToSystem ? targetId : fromNodeId

      createImpact.mutate({
        articleId,
        systemId,
        impactLevel,
      })
    },
    [fromNodeId, targetId, impactLevel, isConnectingToSystem, createImpact]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LinkIcon className="size-5" />
              Create Connection
            </DialogTitle>
            <DialogDescription>
              Connect this {fromType} to a {targetLabel.toLowerCase()} with an impact level.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${targetLabel.toLowerCase()}s...`}
                className="pl-9"
              />
            </div>

            {/* Target selection */}
            <div className="grid gap-2">
              <Label>Select {targetLabel}</Label>
              <div className="h-48 overflow-y-auto rounded-md border">
                <div className="p-2">
                  {filteredOptions.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      No {targetLabel.toLowerCase()}s found
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredOptions.map((opt) => {
                        const id = opt.id
                        const isSelected = targetId === id

                        if ('name' in opt) {
                          // System
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setTargetId(id)}
                              className={cn(
                                'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors',
                                isSelected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-muted'
                              )}
                            >
                              <span className="font-medium">{opt.name}</span>
                              {opt.category && (
                                <span
                                  className={cn(
                                    'text-xs',
                                    isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                  )}
                                >
                                  {opt.category}
                                </span>
                              )}
                            </button>
                          )
                        } else {
                          // Article
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setTargetId(id)}
                              className={cn(
                                'flex w-full flex-col items-start rounded-md px-3 py-2 text-left text-sm transition-colors',
                                isSelected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-muted'
                              )}
                            >
                              <span className="font-medium">Art. {opt.articleNumber}</span>
                              {opt.title && (
                                <span
                                  className={cn(
                                    'line-clamp-1 text-xs',
                                    isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                  )}
                                >
                                  {opt.title}
                                </span>
                              )}
                              <span
                                className={cn(
                                  'text-xs',
                                  isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                )}
                              >
                                {opt.regulationName}
                              </span>
                            </button>
                          )
                        }
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Impact Level */}
            <div className="grid gap-2">
              <Label>Impact Level</Label>
              <div className="flex gap-2">
                {(['critical', 'high', 'medium', 'low'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setImpactLevel(level)}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-md border py-2 text-sm font-medium transition-colors',
                      impactLevel === level
                        ? cn(IMPACT_COLORS[level].bg, 'border-transparent text-white')
                        : 'hover:bg-muted'
                    )}
                  >
                    <span
                      className={cn(
                        'size-2 rounded-full',
                        impactLevel === level ? 'bg-white' : IMPACT_COLORS[level].bg
                      )}
                    />
                    <span className="capitalize">{level}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!targetId || createImpact.isPending}>
              {createImpact.isPending ? 'Creating...' : 'Create Connection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
