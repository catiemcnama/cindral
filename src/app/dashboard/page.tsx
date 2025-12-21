import { Metadata } from 'next'

import { ComplianceStatus } from './_components/compliance-status'
import { OnboardingCta } from './_components/onboarding-cta'
import { RecentAlerts } from './_components/recent-alerts'
import { RegulatoryFeed } from './_components/regulatory-feed'
import { SystemImpactOverview } from './_components/system-impact-overview'

export const metadata: Metadata = {
  title: 'Overview - Cindral',
  description: 'Regulatory compliance dashboard overview',
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <OnboardingCta />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column - Regulatory Change Feed */}
        <div className="lg:col-span-2">
          <RegulatoryFeed />
          <div className="mt-6">
            <RecentAlerts />
          </div>
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
