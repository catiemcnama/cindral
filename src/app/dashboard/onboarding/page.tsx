import { Metadata } from 'next'

import { OnboardingWizard } from './_components/onboarding-wizard'

export const metadata: Metadata = {
  title: 'Onboarding - Cindral',
  description: 'Select your industry and confirm applicable regulations.',
}

export default function OnboardingPage() {
  return <OnboardingWizard />
}
