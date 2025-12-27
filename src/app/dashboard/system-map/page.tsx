'use client'

import { ReactFlowProvider } from '@xyflow/react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { SystemMap } from '@/components/system-map'
import { useActiveOrganization } from '@/lib/auth-client'

export default function SystemMapPage() {
  const { data: activeOrg, isPending } = useActiveOrganization()

  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!activeOrg) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Complete setup to view your system map</p>
        <Button asChild>
          <Link href="/dashboard/onboarding">Complete setup</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      <div className="border-b bg-background px-6 py-4">
        <h1 className="text-2xl font-semibold">System Map</h1>
        <p className="text-muted-foreground">Visualize dependencies between systems and regulatory requirements</p>
      </div>

      <div className="flex-1">
        <ReactFlowProvider>
          <SystemMap organizationId={activeOrg.id} />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
