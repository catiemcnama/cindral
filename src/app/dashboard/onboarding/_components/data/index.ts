/**
 * Onboarding Data - Central Export
 */

export * from './industries'
export * from './regulations'
export * from './steps'
export * from './systems'
export * from './types'

// Team invite roles
export const INVITE_ROLES = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
]

// Validation
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
