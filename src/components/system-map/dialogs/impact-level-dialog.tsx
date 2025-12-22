'use client'

import { useCallback, useState } from 'react'
import { AlertTriangleIcon, TrashIcon } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useTRPCClient } from '@/trpc/client'

import { IMPACT_COLORS } from '../constants'

interface ImpactLevelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  articleId: string | null
  systemId: string | null
  currentLevel: 'critical' | 'high' | 'medium' | 'low' | null
  onSuccess: () => void
  onDelete: () => void
}

export function ImpactLevelDialog({
  open,
  onOpenChange,
  articleId,
  systemId,
  currentLevel,
  onSuccess,
  onDelete,
}: ImpactLevelDialogProps) {
  const trpcClient = useTRPCClient()
  const [selectedLevel, setSelectedLevel] = useState<'critical' | 'high' | 'medium' | 'low'>('medium')
  const [notes, setNotes] = useState('')

  // Use currentLevel when dialog opens, otherwise use selectedLevel
  const displayLevel = open && currentLevel ? currentLevel : selectedLevel
  const submitLevel = selectedLevel !== 'medium' ? selectedLevel : (currentLevel ?? 'medium')

  const updateImpact = useMutation({
    mutationFn: (input: { articleId: string; systemId: string; impactLevel: 'critical' | 'high' | 'medium' | 'low'; notes?: string }) =>
      trpcClient.systemMap.updateImpact.mutate(input),
    onSuccess: () => {
      onSuccess()
      onOpenChange(false)
    },
  })

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!articleId || !systemId) return

      updateImpact.mutate({
        articleId,
        systemId,
        impactLevel: submitLevel,
        notes: notes.trim() || undefined,
      })
    },
    [articleId, systemId, submitLevel, notes, updateImpact]
  )

  const handleDelete = useCallback(() => {
    onDelete()
    onOpenChange(false)
  }, [onDelete, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="size-5" />
              Edit Impact Level
            </DialogTitle>
            <DialogDescription>
              Adjust the impact level for this connection.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Impact Level */}
            <div className="grid gap-2">
              <Label>Impact Level</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['critical', 'high', 'medium', 'low'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setSelectedLevel(l)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 rounded-md border py-2.5 text-sm font-medium transition-colors',
                      displayLevel === l
                        ? cn(IMPACT_COLORS[l].bg, 'border-transparent text-white')
                        : 'hover:bg-muted'
                    )}
                  >
                    <span
                      className={cn(
                        'size-2 rounded-full',
                        displayLevel === l ? 'bg-white' : IMPACT_COLORS[l].bg
                      )}
                    />
                    <span className="capitalize">{l}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this impact..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              <TrashIcon className="mr-2 size-4" />
              Remove
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateImpact.isPending}>
                {updateImpact.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
