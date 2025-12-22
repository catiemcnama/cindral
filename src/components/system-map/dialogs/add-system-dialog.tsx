'use client'

import { useCallback, useState } from 'react'
import { ServerIcon } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useTRPCClient } from '@/trpc/client'

interface AddSystemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddSystemDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddSystemDialogProps) {
  const trpcClient = useTRPCClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [criticality, setCriticality] = useState<string>('')

  const createSystem = useMutation({
    mutationFn: (input: Parameters<typeof trpcClient.systems.create.mutate>[0]) =>
      trpcClient.systems.create.mutate(input),
    onSuccess: () => {
      onSuccess()
      onOpenChange(false)
      resetForm()
    },
  })

  const resetForm = useCallback(() => {
    setName('')
    setDescription('')
    setCategory('')
    setCriticality('')
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!name.trim()) return

      createSystem.mutate({
        name: name.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        criticality: criticality as
          | 'critical'
          | 'high'
          | 'medium'
          | 'low'
          | 'info'
          | undefined,
      })
    },
    [name, description, category, criticality, createSystem]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ServerIcon className="size-5" />
              Add New System
            </DialogTitle>
            <DialogDescription>
              Add a new system to track regulatory impacts.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">System Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Customer Portal"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the system..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Core Banking"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="criticality">Criticality</Label>
                <Select value={criticality} onValueChange={setCriticality}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
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
            <Button type="submit" disabled={!name.trim() || createSystem.isPending}>
              {createSystem.isPending ? 'Adding...' : 'Add System'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
