import { Metadata } from 'next'

import { ComplianceStatus } from './_components/compliance-status'
import { RegulatoryFeed } from './_components/regulatory-feed'
import { SystemImpactOverview } from './_components/system-impact-overview'

export const metadata: Metadata = {
  title: 'Overview - Cindral',
  description: 'Regulatory compliance dashboard overview',
}

export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column - Regulatory Change Feed */}
        <div className="lg:col-span-2">
          <RegulatoryFeed />
        </div>

        {/* Right column - Stats and Charts */}
        <div className="space-y-6">
          <SystemImpactOverview />
          <ComplianceStatus />
        </div>
      </div>
    </div>
  )
}
