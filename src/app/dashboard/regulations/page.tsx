import { Metadata } from 'next'
import RegulationsLoader from '../_components/regulations-loader'

export const metadata: Metadata = {
  title: 'Regulations - Cindral',
  description: 'Browse regulatory frameworks and compliance requirements',
}

export default function RegulationsPage() {
  return <RegulationsLoader />
}
