'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import dynamic from 'next/dynamic'

// Mock data matching the Figma mockup - 67% overall compliance
const complianceData = [
  { name: 'Compliant', value: 67, fill: 'hsl(var(--chart-1))' },
  { name: 'In Progress', value: 18, fill: 'hsl(var(--chart-2))' },
  { name: 'Non-Compliant', value: 15, fill: 'hsl(var(--chart-3))' },
]

const chartConfig: ChartConfig = {
  compliant: {
    label: 'Compliant',
    color: 'hsl(var(--chart-1))',
  },
  inProgress: {
    label: 'In Progress',
    color: 'hsl(var(--chart-2))',
  },
  nonCompliant: {
    label: 'Non-Compliant',
    color: 'hsl(var(--chart-3))',
  },
}

const LazyCompliancePie = dynamic(() => import('./compliance-pie').then((m) => m.CompliancePie), {
  ssr: false,
  loading: () => (
    <div className="flex h-50 w-full items-center justify-center">
      <Skeleton className="h-24 w-24" />
    </div>
  ),
})

export function ComplianceStatus() {
  const totalValue = complianceData.reduce((acc, curr) => acc + curr.value, 0)
  const compliantPercentage = Math.round((complianceData[0].value / totalValue) * 100)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Compliance Status</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="h-50 w-full">
          <LazyCompliancePie complianceData={complianceData} />
        </div>

        {/* Accessible summary for screen readers */}
        <div className="sr-only" aria-live="polite">
          Overall compliance {compliantPercentage}%. {complianceData.map((d) => `${d.name} ${d.value}%`).join(', ')}
        </div>

        {/* Legend */}
        <div className="mt-2 flex flex-wrap justify-center gap-4">
          {complianceData.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div className="size-3 rounded-full" style={{ backgroundColor: entry.fill }} />
              <span className="text-xs text-muted-foreground">
                {entry.name} ({entry.value}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
