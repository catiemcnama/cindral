'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatErrorForUser } from '@/lib/format-error'
import { useTRPC } from '@/trpc/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2Icon, RefreshCwIcon, SettingsIcon, SparklesIcon } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { toast } from 'sonner'

/**
 * Demo Banner Component
 *
 * Shown when IS_DEMO=true in environment.
 * Provides:
 * - Visual indicator that this is a demo environment
 * - Button to reset demo data to initial state
 * - Button to customize demo (org name, logo)
 */

interface DemoConfig {
  isDemo: boolean
  displayName: string | null
  displayLogo: string | null
  displayDomain: string | null
}

export function DemoBanner() {
  const [isOpen, setIsOpen] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const trpc = useTRPC()
  const queryClient = useQueryClient()

  // Fetch demo config
  const { data: demoConfig, isLoading } = useQuery(
    trpc.demo.getConfig.queryOptions(undefined, {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: false,
    })
  )

  // Reset demo data mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/demo/reset', {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to reset demo data')
      }
      return response.json()
    },
    onSuccess: () => {
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries()
      setIsResetting(false)
      toast.success('Demo data reset successfully', {
        description: 'All data has been restored to the initial demo state.',
      })
    },
    onError: (error) => {
      setIsResetting(false)
      toast.error('Failed to reset demo data', {
        description: formatErrorForUser(error),
      })
    },
  })

  // Update demo config mutation
  const updateMutation = useMutation(
    trpc.demo.updateConfig.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.demo.getConfig.queryKey() })
        setIsSaving(false)
        setIsOpen(false)
        toast.success('Demo customization saved')
      },
      onError: (error) => {
        setIsSaving(false)
        toast.error('Failed to save customization', {
          description: formatErrorForUser(error),
        })
      },
    })
  )

  // Don't render if not in demo mode
  if (isLoading || !demoConfig?.isDemo) {
    return null
  }

  const handleReset = () => {
    setIsResetting(true)
    resetMutation.mutate()
  }

  const handleSaveCustomization = () => {
    setIsSaving(true)
    updateMutation.mutate({
      displayName: customName || null,
      displayDomain: customDomain || null,
    })
  }

  // Generate logo URL from domain using Clearbit Logo API
  const logoUrl = customDomain ? `https://logo.clearbit.com/${customDomain}` : demoConfig.displayLogo

  return (
    <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-amber-500/90 to-orange-500/90 px-4 py-2 text-white">
      <div className="flex items-center gap-2">
        <SparklesIcon className="size-4" />
        <span className="text-sm font-medium">Demo Mode {demoConfig.displayName && `— ${demoConfig.displayName}`}</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Customize Button */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-white hover:bg-white/20 hover:text-white">
              <SettingsIcon className="size-3.5" />
              Customize
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Customize Demo</DialogTitle>
              <DialogDescription>
                Personalize this demo for your presentation. Changes are temporary and will reset when demo data is
                reset.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  placeholder="e.g., Velocity Bank"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Company Domain (for logo)</Label>
                <Input
                  id="domain"
                  placeholder="e.g., velocitybank.com"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  We&apos;ll automatically fetch the company logo from this domain
                </p>
              </div>

              {/* Logo Preview */}
              {customDomain && (
                <div className="space-y-2">
                  <Label>Logo Preview</Label>
                  <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                    <Image
                      src={`https://logo.clearbit.com/${customDomain}`}
                      alt="Company logo"
                      width={48}
                      height={48}
                      className="rounded"
                      onError={(e) => {
                        // Hide on error
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <span className="text-sm">{customName || customDomain}</span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCustomization} disabled={isSaving}>
                {isSaving && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Button with Confirmation */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-white hover:bg-white/20 hover:text-white"
              disabled={isResetting}
            >
              {isResetting ? <Loader2Icon className="size-3.5 animate-spin" /> : <RefreshCwIcon className="size-3.5" />}
              Reset Demo Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Demo Data?</AlertDialogTitle>
              <AlertDialogDescription>
                This will reset all data to the initial demo state. Regulations, obligations, alerts, and evidence packs
                will be restored. Your user account and organization will be preserved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset}>Reset Data</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
