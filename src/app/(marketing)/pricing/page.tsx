import { Container, GradientText, Section, SectionHeader } from '@/components/marketing/sections'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowRight, Calculator, Check, HelpCircle, TrendingUp } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pricing - Cindral',
  description:
    'Enterprise GRC platform pricing. ROI-focused plans for financial institutions and regulated enterprises.',
}

const plans = [
  {
    name: 'Growth',
    description: 'For compliance teams ready to automate gap detection.',
    price: '$2,500',
    period: 'per month, billed annually',
    annualPrice: '$30,000/year',
    cta: 'Talk to Sales',
    ctaLink: '/contact?plan=growth',
    highlighted: false,
    outcome: 'Avg. 120 hours saved per quarter',
    roi: '4.2x ROI in Year 1',
    features: [
      'Up to 15 team members',
      'Unlimited systems',
      '25 regulatory sources',
      'AI-powered gap detection',
      'System impact mapping',
      'Evidence pack generation',
      'Slack & Teams alerts',
      'Implementation support',
    ],
  },
  {
    name: 'Enterprise',
    description: 'For institutions with complex, multi-jurisdiction requirements.',
    price: '$6,500',
    period: 'per month, billed annually',
    annualPrice: '$78,000/year',
    cta: 'Talk to Sales',
    ctaLink: '/contact?plan=enterprise',
    highlighted: true,
    outcome: 'Avg. 400 hours saved per quarter',
    roi: '6.8x ROI in Year 1',
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
      '99.9% SLA guarantee',
    ],
  },
  {
    name: 'Strategic',
    description: 'For global institutions requiring on-premise or custom deployment.',
    price: 'Custom',
    period: 'tailored engagement',
    annualPrice: 'Starting at $150,000/year',
    cta: 'Contact Sales',
    ctaLink: '/contact?plan=strategic',
    highlighted: false,
    outcome: 'Dedicated compliance transformation',
    roi: 'Guaranteed ROI commitment',
    features: [
      'Everything in Enterprise',
      'On-premise deployment option',
      'Custom AI model training',
      'White-label capability',
      'Regulatory advisory access',
      'Executive business reviews',
      'Multi-year pricing',
      'Co-development roadmap',
    ],
  },
]

const comparisonFeatures = [
  {
    category: 'Regulatory Coverage',
    features: [
      { name: 'Regulatory sources', growth: '25', enterprise: 'All 50+', strategic: 'Custom' },
      { name: 'Custom sources', growth: false, enterprise: true, strategic: true },
      { name: 'Real-time updates', growth: true, enterprise: true, strategic: true },
      { name: 'Multi-jurisdiction', growth: true, enterprise: true, strategic: true },
    ],
  },
  {
    category: 'AI & Automation',
    features: [
      { name: 'Gap detection', growth: true, enterprise: true, strategic: true },
      { name: 'Auto-mapping', growth: true, enterprise: true, strategic: true },
      { name: 'Autonomous agent', growth: false, enterprise: true, strategic: true },
      { name: 'Custom AI training', growth: false, enterprise: false, strategic: true },
    ],
  },
  {
    category: 'System Mapping',
    features: [
      { name: 'Systems tracked', growth: 'Unlimited', enterprise: 'Unlimited', strategic: 'Unlimited' },
      { name: 'Visual impact map', growth: true, enterprise: true, strategic: true },
      { name: 'API integrations', growth: '5', enterprise: 'Unlimited', strategic: 'Custom' },
    ],
  },
  {
    category: 'Security & Compliance',
    features: [
      { name: 'SOC 2 Type II', growth: true, enterprise: true, strategic: true },
      { name: 'SSO & SCIM', growth: false, enterprise: true, strategic: true },
      { name: 'On-premise option', growth: false, enterprise: false, strategic: true },
      { name: 'Custom SLA', growth: false, enterprise: true, strategic: true },
    ],
  },
  {
    category: 'Support & Success',
    features: [
      { name: 'Implementation', growth: 'Self-serve', enterprise: 'White-glove', strategic: 'Dedicated team' },
      { name: 'Success manager', growth: false, enterprise: true, strategic: true },
      { name: 'Training hours', growth: '4', enterprise: '16', strategic: 'Unlimited' },
      { name: 'Executive reviews', growth: false, enterprise: 'Quarterly', strategic: 'Monthly' },
    ],
  },
]

const faqs = [
  {
    question: 'Who is Cindral built for?',
    answer:
      'Cindral is purpose-built for regulated enterprises—banks, fintechs, insurance companies, and any organization with significant compliance obligations. We focus on financial services regulations like DORA, GDPR, Basel III, and the EU AI Act.',
  },
  {
    question: 'How long does implementation take?',
    answer:
      'Most Enterprise customers are fully operational within 2-4 weeks. Our team handles system integration, regulatory scope configuration, and initial mapping. You see value in the first week.',
  },
  {
    question: 'What ROI can I expect?',
    answer:
      'Customers typically see 4-7x ROI in Year 1. This comes from: reduced manual mapping time (120-400 hours/quarter saved), earlier gap detection (avoiding $50K-$500K fine risk), and faster audit preparation.',
  },
  {
    question: 'Do you offer a pilot program?',
    answer:
      'Yes. We offer a 30-day paid pilot for qualified enterprises. You get full platform access with a single regulation scope, letting you validate ROI before committing to an annual contract.',
  },
  {
    question: 'How does pricing work for multi-year deals?',
    answer:
      'Multi-year commitments (2-3 years) receive significant discounts and can include custom roadmap commitments. Contact our enterprise sales team for tailored pricing.',
  },
  {
    question: 'What makes Cindral different from legacy GRC tools?',
    answer:
      'Unlike legacy GRC tools that are document repositories, Cindral is an active compliance system. Our AI agent automatically maps regulations to your systems, generates evidence packs, and alerts you to gaps—before auditors find them.',
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
            {/* Enterprise badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-zinc-600 dark:text-zinc-400">4-7x ROI in Year 1 for enterprise customers</span>
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-white">
              Enterprise <GradientText>compliance automation</GradientText>
            </h1>
            <p className="mx-auto mb-6 max-w-2xl text-lg text-zinc-600 lg:text-xl dark:text-zinc-400">
              Purpose-built for regulated financial institutions. Annual contracts with white-glove implementation and
              guaranteed ROI.
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
                  <th className="py-4 text-center text-sm font-medium text-zinc-900 dark:text-white">Growth</th>
                  <th className="py-4 text-center text-sm font-medium text-zinc-900 dark:text-white">Enterprise</th>
                  <th className="py-4 text-center text-sm font-medium text-zinc-900 dark:text-white">Strategic</th>
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
                            <FeatureValue value={feature.growth} />
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex justify-center">
                            <FeatureValue value={feature.enterprise} />
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex justify-center">
                            <FeatureValue value={feature.strategic} />
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
