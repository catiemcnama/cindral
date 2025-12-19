import { Metadata } from 'next'
import { NetworkIcon } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'System Map - Cindral',
  description: 'Visualize system dependencies and compliance impacts',
}

export default function SystemMapPage() {
  return (
    <div className="p-6 h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">System Map</h1>
        <p className="text-muted-foreground">
          Visualize dependencies between systems and regulatory requirements
        </p>
      </div>

      <Card className="h-[calc(100vh-220px)]">
        <CardContent className="flex flex-col items-center justify-center h-full">
          <NetworkIcon className="size-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">System Map Coming Soon</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Interactive visualization of your IT systems and their regulatory impact will be available here.
            This will include node graphs showing dependencies, risk levels, and compliance status.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
