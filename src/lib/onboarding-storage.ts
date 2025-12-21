export type OnboardingSystem = {
  id: string
  name: string
  description: string
}

export type OnboardingInvite = {
  email: string
  role: string
}

export type OnboardingState = {
  industryId: string | null
  regulations: string[]
  regulationsCustomized: boolean
  systems: {
    templates: string[]
    custom: OnboardingSystem[]
  }
  systemsCustomized: boolean
  invites: OnboardingInvite[]
  updatedAt: string
}

const STORAGE_KEY = 'cindral:onboarding'
const ONBOARDING_EVENT = 'cindral:onboarding:changed'

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isSystem(value: unknown): value is OnboardingSystem {
  if (!value || typeof value !== 'object') return false
  const system = value as OnboardingSystem
  return typeof system.id === 'string' && typeof system.name === 'string' && typeof system.description === 'string'
}

function isInvite(value: unknown): value is OnboardingInvite {
  if (!value || typeof value !== 'object') return false
  const invite = value as OnboardingInvite
  return typeof invite.email === 'string' && typeof invite.role === 'string'
}

export function readOnboardingState(): OnboardingState | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingState>
    const systems = parsed.systems ?? { templates: [], custom: [] }
    const templates = isStringArray(systems.templates) ? systems.templates : []
    const custom = Array.isArray(systems.custom) ? systems.custom.filter(isSystem) : []
    const invites = Array.isArray(parsed.invites) ? parsed.invites.filter(isInvite) : []

    return {
      industryId: typeof parsed.industryId === 'string' ? parsed.industryId : null,
      regulations: isStringArray(parsed.regulations) ? parsed.regulations : [],
      regulationsCustomized: Boolean(parsed.regulationsCustomized),
      systems: {
        templates,
        custom,
      },
      systemsCustomized: Boolean(parsed.systemsCustomized),
      invites,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date(0).toISOString(),
    }
  } catch {
    return null
  }
}

export function writeOnboardingState(state: OnboardingState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new Event(ONBOARDING_EVENT))
}

export function clearOnboardingState() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event(ONBOARDING_EVENT))
}

export function subscribeToOnboarding(callback: () => void) {
  if (typeof window === 'undefined') return () => {}

  const handler = () => callback()
  window.addEventListener('storage', handler)
  window.addEventListener(ONBOARDING_EVENT, handler)

  return () => {
    window.removeEventListener('storage', handler)
    window.removeEventListener(ONBOARDING_EVENT, handler)
  }
}
