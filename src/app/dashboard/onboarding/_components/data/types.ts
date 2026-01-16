/**
 * Onboarding Types
 * Shared type definitions for the onboarding wizard
 */

import type { LucideIcon } from 'lucide-react'

export type Industry = {
  id: string
  name: string
  description: string
  icon: LucideIcon
}

export type Regulation = {
  id: string
  name: string
  fullTitle: string
  jurisdiction: string
  articleCount: number
  obligationCount: number
  focus: string[]
}

export type SystemCriticality = 'core' | 'important' | 'support'

export type SystemTemplate = {
  id: string
  name: string
  description: string
  category: string
  criticality: SystemCriticality
  icon: LucideIcon
  tags: string[]
}

export type CustomSystem = {
  id: string
  name: string
  description: string
}

export type Invite = {
  email: string
  role: string
}

export type OnboardingStep = {
  id: number
  title: string
  description: string
}
