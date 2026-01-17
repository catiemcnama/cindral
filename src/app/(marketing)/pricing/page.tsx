import { Container, GradientText, Section, SectionHeader } from '@/components/marketing/sections'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowRight, Calculator, Check, HelpCircle, TrendingUp } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pricing - Cindral',
  description:
    'DORA and AI Act compliance pricing for fintechs, AI companies, and regulated tech. Start at $499/month.',
}

const plans = [
  {
    name: 'Startup',
    description: 'For early-stage teams getting compliant for the first time.',
    price: '$499',
    period: 'per month',
    annualPrice: '$5,388/year (save 10%)',
    cta: 'Start Free Trial',
    ctaLink: '/try?plan=startup',
    highlighted: false,
    outcome: 'Get DORA/AI Act ready in weeks',
    roi: 'Avoid 6-figure fines',
    features: [
      'Up to 5 team members',
      '50 systems',
      'DORA + AI Act + GDPR',
      'AI-powered gap detection',
      'System impact mapping',
      'Evidence pack generation',
      'Email support',
      'Self-serve onboarding',
    ],
  },
  {
    name: 'Growth',
    description: 'For scaling teams with expanding compliance needs.',
    price: '$1,499',
    period: 'per month',
    annualPrice: '$16,188/year (save 10%)',
    cta: 'Start Free Trial',
    ctaLink: '/try?plan=growth',
    highlighted: true,
    outcome: 'Avg. 80 hours saved per quarter',
    roi: '4x ROI in Year 1',
    features: [
      'Up to 20 team members',
      'Unlimited systems',
      'All regulatory sources',
      'AI-powered gap detection',
      'System impact mapping',
      'Evidence pack generation',
      'Slack & Teams alerts',
      'Jira & Confluence sync',
      'Priority support',
    ],
  },
  {
    name: 'Enterprise',
    description: 'For organizations with complex, multi-jurisdiction requirements.',
    price: 'Custom',
    period: 'tailored to your needs',
    annualPrice: 'Starting at $50,000/year',
    cta: 'Talk to Sales',
    ctaLink: '/contact?plan=enterprise',
    highlighted: false,
    outcome: 'Dedicated compliance partner',
    roi: 'Guaranteed outcomes',
    features: [
      'Unlimited team members',
      'Unlimited systems',
      'All regulatory sources',
      'Custom regulatory sources',
      'Advanced AI compliance agent',
      'Full API access',
      'SSO & SCIM provisioning',
      'Dedicated success manager',
      'Custom integrations',
      'SLA guarantee',
    ],
  },
]

const comparisonFeatures = [
  {
    category: 'Regulatory Coverage',
    features: [
      { name: 'Regulatory sources', startup: '3 (DORA, AI Act, GDPR)', growth: 'All 50+', enterprise: 'Custom' },
      { name: 'Custom sources', startup: false, growth: false, enterprise: true },
      { name: 'Real-time updates', startup: true, growth: true, enterprise: true },
      { name: 'Multi-jurisdiction', startup: false, growth: true, enterprise: true },
    ],
  },
  {
    category: 'AI & Automation',
    features: [
      { name: 'Gap detection', startup: true, growth: true, enterprise: true },
      { name: 'Auto-mapping', startup: true, growth: true, enterprise: true },
      { name: 'Evidence generation', startup: 'Basic', growth: 'Advanced', enterprise: 'Custom' },
    ],
  },
  {
    category: 'System Mapping',
    features: [
      { name: 'Systems tracked', startup: '50', growth: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'Visual impact map', startup: true, growth: true, enterprise: true },
      { name: 'API integrations', startup: '2', growth: 'All', enterprise: 'Custom' },
    ],
  },
  {
    category: 'Support',
    features: [
      { name: 'Onboarding', startup: 'Self-serve', growth: 'Guided', enterprise: 'White-glove' },
      { name: 'Support channel', startup: 'Email', growth: 'Priority', enterprise: 'Dedicated' },
      { name: 'Success manager', startup: false, growth: false, enterprise: true },
    ],
  },
]

const faqs = [
  {
    question: 'Who is Cindral built for?',
    answer:
      "Cindral is built for fintechs, AI companies, and any tech company facing EU regulations like DORA, the AI Act, GDPR, or NIS2. If you're a Series A+ company with compliance obligations, we're built for you.",
  },
  {
    question: 'Can I start with a free trial?',
    answer:
      'Yes! All plans include a 14-day free trial. No credit card required. Import your systems, configure your regulatory scope, and see your compliance gaps immediately.',
  },
  {
    question: 'How long does it take to get started?',
    answer:
      'Most teams are up and running within a day. Startup plan customers self-onboard in under an hour. Growth and Enterprise customers get guided onboarding within the first week.',
  },
  {
    question: 'Do I need to talk to sales to start?',
    answer:
      'Not for Startup or Growth plans—you can start your free trial immediately. Enterprise customers typically start with a demo call to scope requirements.',
  },
  {
    question: 'What if I need more than 50 systems on the Startup plan?',
    answer:
      'Upgrade to Growth anytime—it takes one click and your data carries over. We pro-rate upgrades so you only pay the difference.',
  },
  {
    question: 'Is there a discount for annual billing?',
    answer:
      'Yes, annual billing saves 10% on Startup and Growth plans. Enterprise pricing is always custom and typically structured annually.',
  },
]

function FeatureValue({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-5 w-5 text-emerald-500" />
    ) : (
      <span className="text-zinc-300 dark:text-zinc-700">—</span>
    )
  }
  return <span className="font-medium text-zinc-900 dark:text-white">{value}</span>
}

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-1/4 h-125 w-125 rounded-full bg-linear-to-r from-emerald-500/15 to-blue-500/15 blur-3xl" />
        </div>

        <Container>
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-zinc-600 dark:text-zinc-400">Start free, upgrade when you&apos;re ready</span>
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-white">
              Simple pricing for <GradientText>growing teams</GradientText>
            </h1>
            <p className="mx-auto mb-6 max-w-2xl text-lg text-zinc-600 lg:text-xl dark:text-zinc-400">
              Start with the Startup plan at $499/month. Scale to Growth as your compliance needs expand. No enterprise
              sales call required.
            </p>

            {/* ROI Stats */}
            <div className="mx-auto mb-10 flex max-w-xl flex-wrap justify-center gap-8 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">400+</div>
                <div className="text-zinc-500">Hours saved/quarter</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">3x</div>
                <div className="text-zinc-500">More gaps found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">$500K+</div>
                <div className="text-zinc-500">Fine risk avoided</div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/try">
                <Button size="lg" variant="outline" className="gap-2">
                  <Calculator className="h-4 w-4" />
                  See Your Industry&apos;s Gaps (No signup)
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Pricing Cards */}
      <Section className="pt-0">
        <Container>
          <div className="grid gap-8 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  'relative rounded-2xl border p-8',
                  plan.highlighted
                    ? 'border-blue-500 bg-white shadow-xl ring-1 ring-blue-500 dark:bg-zinc-900'
                    : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-blue-500 px-4 py-1 text-sm font-medium text-white">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{plan.name}</h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{plan.description}</p>
                  {'roi' in plan && plan.roi && (
                    <div className="mt-3 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      {plan.roi}
                    </div>
                  )}
                </div>

                <div className="mb-2">
                  <span className="text-4xl font-bold text-zinc-900 dark:text-white">{plan.price}</span>
                </div>
                <div className="mb-6 text-sm text-zinc-500">
                  {plan.period}
                  {'annualPrice' in plan && <span className="block text-xs">{plan.annualPrice}</span>}
                </div>

                <Link href={plan.ctaLink} className="block">
                  <Button
                    className={cn(
                      'w-full gap-2',
                      plan.highlighted
                        ? ''
                        : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100'
                    )}
                    size="lg"
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>

                {'outcome' in plan && plan.outcome && (
                  <p className="mt-4 text-center text-xs text-zinc-500">{plan.outcome}</p>
                )}

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Feature Comparison */}
      <Section variant="muted">
        <Container>
          <SectionHeader
            title="Compare plans in detail"
            subtitle="Choose the right level for your compliance maturity."
          />

          <div className="overflow-x-auto">
            <table className="w-full min-w-150">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Features</th>
                  <th className="py-4 text-center text-sm font-medium text-zinc-900 dark:text-white">Startup</th>
                  <th className="py-4 text-center text-sm font-medium text-zinc-900 dark:text-white">Growth</th>
                  <th className="py-4 text-center text-sm font-medium text-zinc-900 dark:text-white">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((category) => (
                  <>
                    <tr key={category.category}>
                      <td colSpan={4} className="pt-8 pb-2 text-sm font-semibold text-zinc-900 dark:text-white">
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature) => (
                      <tr key={feature.name} className="border-b border-zinc-100 dark:border-zinc-800/50">
                        <td className="py-3 text-sm text-zinc-600 dark:text-zinc-400">{feature.name}</td>
                        <td className="py-3 text-center">
                          <div className="flex justify-center">
                            <FeatureValue value={feature.startup} />
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex justify-center">
                            <FeatureValue value={feature.growth} />
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex justify-center">
                            <FeatureValue value={feature.enterprise} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section>
        <Container className="max-w-3xl">
          <SectionHeader title="Pricing FAQ" subtitle="Everything you need to know about our pricing." />

          <div className="space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start gap-3">
                  <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                  <div>
                    <h3 className="font-medium text-zinc-900 dark:text-white">{faq.question}</h3>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section variant="muted">
        <Container>
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 lg:text-3xl dark:text-white">
              Not sure which plan is right for you?
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-zinc-600 dark:text-zinc-400">
              Our team is happy to walk you through your options and help you find the perfect fit.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/contact">
                <Button size="lg" className="gap-2">
                  Talk to Sales
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg">
                  Book a Demo
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
