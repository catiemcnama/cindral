import { NetworkIcon } from 'lucide-react'
import { Metadata } from 'next'

import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'System Map - Cindral',
  description: 'Visualize system dependencies and compliance impacts',
}

export default function SystemMapPage() {
  return (
    <div className="h-full p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">System Map</h1>
        <p className="text-muted-foreground">Visualize dependencies between systems and regulatory requirements</p>
      </div>

      <Card className="h-[calc(100vh-220px)]">
        <CardContent className="flex h-full flex-col items-center justify-center">
          <NetworkIcon className="mb-4 size-16 text-muted-foreground/50" />
          <h2 className="mb-2 text-xl font-semibold">System Map Coming Soon</h2>
          <p className="max-w-md text-center text-muted-foreground">
            Interactive visualization of your IT systems and their regulatory impact will be available here. This will
            include node graphs showing dependencies, risk levels, and compliance status.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
