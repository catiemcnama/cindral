/**
 * Billing types and plan definitions
 */

export type PlanId = 'free' | 'starter' | 'professional' | 'enterprise'

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'unpaid'
  | 'canceled'
  | 'incomplete'
  | 'trialing'

export interface Plan {
  id: PlanId
  name: string
  description: string
  price: number // Monthly price in cents
  priceAnnual: number // Annual price in cents (with discount)
  features: string[]
  limits: PlanLimits
  stripePriceId?: string
  stripeAnnualPriceId?: string
}

export interface PlanLimits {
  users: number
  systems: number
  regulations: number
  alertsPerMonth: number
  evidencePacksPerMonth: number
  apiRequestsPerMonth: number
  retentionDays: number
  integrations: boolean
  sso: boolean
  auditLog: boolean
  prioritySupport: boolean
}

export interface Subscription {
  id: string
  organizationId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  planId: PlanId
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  canceledAt?: Date
}

export interface CheckoutSession {
  sessionId: string
  url: string
}

export interface BillingPortalSession {
  url: string
}

/**
 * Plan definitions
 */
export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'For small teams getting started',
    price: 0,
    priceAnnual: 0,
    features: [
      'Up to 3 users',
      'Up to 5 systems',
      '1 regulation',
      'Basic dashboard',
      'Email support',
    ],
    limits: {
      users: 3,
      systems: 5,
      regulations: 1,
      alertsPerMonth: 50,
      evidencePacksPerMonth: 5,
      apiRequestsPerMonth: 1000,
      retentionDays: 30,
      integrations: false,
      sso: false,
      auditLog: false,
      prioritySupport: false,
    },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'For growing compliance teams',
    price: 9900, // $99/month
    priceAnnual: 95000, // $950/year (~20% discount)
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
    stripeAnnualPriceId: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
    features: [
      'Up to 10 users',
      'Up to 25 systems',
      'Up to 5 regulations',
      'Full dashboard',
      'Email & chat support',
      'Audit log',
    ],
    limits: {
      users: 10,
      systems: 25,
      regulations: 5,
      alertsPerMonth: 500,
      evidencePacksPerMonth: 25,
      apiRequestsPerMonth: 10000,
      retentionDays: 90,
      integrations: false,
      sso: false,
      auditLog: true,
      prioritySupport: false,
    },
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'For compliance-focused organizations',
    price: 29900, // $299/month
    priceAnnual: 287000, // $2,870/year (~20% discount)
    stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    stripeAnnualPriceId: process.env.STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID,
    features: [
      'Up to 50 users',
      'Unlimited systems',
      'Unlimited regulations',
      'Advanced analytics',
      'Integrations (Jira, Confluence)',
      'Priority support',
      'SSO',
    ],
    limits: {
      users: 50,
      systems: -1, // Unlimited
      regulations: -1,
      alertsPerMonth: -1,
      evidencePacksPerMonth: -1,
      apiRequestsPerMonth: 100000,
      retentionDays: 365,
      integrations: true,
      sso: true,
      auditLog: true,
      prioritySupport: true,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with custom needs',
    price: 0, // Custom pricing
    priceAnnual: 0,
    features: [
      'Unlimited users',
      'Unlimited everything',
      'Custom integrations',
      'Dedicated support',
      'On-premise option',
      'Custom SLA',
    ],
    limits: {
      users: -1,
      systems: -1,
      regulations: -1,
      alertsPerMonth: -1,
      evidencePacksPerMonth: -1,
      apiRequestsPerMonth: -1,
      retentionDays: -1,
      integrations: true,
      sso: true,
      auditLog: true,
      prioritySupport: true,
    },
  },
}

/**
 * Check if usage is within plan limits
 */
export function isWithinLimit(current: number, limit: number): boolean {
  if (limit === -1) return true // Unlimited
  return current < limit
}

/**
 * Get plan by ID
 */
export function getPlan(planId: PlanId): Plan {
  return PLANS[planId]
}

