import { Container, GradientText, Section, SectionHeader } from '@/components/marketing/sections'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowRight, Check, HelpCircle } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pricing - Cindral',
  description: 'Simple, transparent pricing for teams of all sizes. Start free, upgrade as you grow.',
}

const plans = [
  {
    name: 'Starter',
    description: 'For small teams getting started with compliance tracking.',
    price: 'Free',
    period: 'forever',
    cta: 'Get Started',
    ctaLink: '/signup',
    highlighted: false,
    features: [
      'Up to 3 team members',
      '10 systems tracked',
      '5 regulatory sources',
      'Basic alerts',
      'Community support',
    ],
  },
  {
    name: 'Professional',
    description: 'For growing teams that need comprehensive compliance coverage.',
    price: '$299',
    period: 'per month',
    cta: 'Start Free Trial',
    ctaLink: '/signup?plan=pro',
    highlighted: true,
    features: [
      'Up to 15 team members',
      'Unlimited systems',
      '25 regulatory sources',
      'Smart alerts with severity',
      'System mapping',
      'Evidence pack generation',
      'Jira & Confluence export',
      'Email support',
    ],
  },
  {
    name: 'Enterprise',
    description: 'For large organizations with complex compliance requirements.',
    price: 'Custom',
    period: 'contact us',
    cta: 'Contact Sales',
    ctaLink: '/contact?plan=enterprise',
    highlighted: false,
    features: [
      'Unlimited team members',
      'Unlimited systems',
      '50+ regulatory sources',
      'Custom regulatory sources',
      'Advanced analytics',
      'SSO & SCIM',
      'API access',
      'Custom integrations',
      'Dedicated success manager',
      'SLA guarantee',
      'On-premise option',
    ],
  },
]

const comparisonFeatures = [
  {
    category: 'Regulatory Coverage',
    features: [
      { name: 'Regulatory sources', starter: '5', pro: '25', enterprise: '50+' },
      { name: 'Custom sources', starter: false, pro: false, enterprise: true },
      { name: 'Real-time updates', starter: true, pro: true, enterprise: true },
      { name: 'Multi-jurisdiction', starter: false, pro: true, enterprise: true },
    ],
  },
  {
    category: 'System Mapping',
    features: [
      { name: 'Systems tracked', starter: '10', pro: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'Visual mapping', starter: false, pro: true, enterprise: true },
      { name: 'Dependency graphs', starter: false, pro: true, enterprise: true },
      { name: 'Gap analysis', starter: false, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Alerts & Notifications',
    features: [
      { name: 'Email alerts', starter: true, pro: true, enterprise: true },
      { name: 'Slack integration', starter: false, pro: true, enterprise: true },
      { name: 'Teams integration', starter: false, pro: true, enterprise: true },
      { name: 'Custom rules', starter: false, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Evidence & Reporting',
    features: [
      { name: 'Evidence packs', starter: false, pro: true, enterprise: true },
      { name: 'PDF export', starter: false, pro: true, enterprise: true },
      { name: 'Confluence export', starter: false, pro: true, enterprise: true },
      { name: 'Custom templates', starter: false, pro: false, enterprise: true },
    ],
  },
  {
    category: 'Team & Security',
    features: [
      { name: 'Team members', starter: '3', pro: '15', enterprise: 'Unlimited' },
      { name: 'Role-based access', starter: true, pro: true, enterprise: true },
      { name: 'SSO', starter: false, pro: false, enterprise: true },
      { name: 'Audit logs', starter: false, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Support',
    features: [
      { name: 'Community support', starter: true, pro: true, enterprise: true },
      { name: 'Email support', starter: false, pro: true, enterprise: true },
      { name: 'Priority support', starter: false, pro: false, enterprise: true },
      { name: 'Dedicated CSM', starter: false, pro: false, enterprise: true },
    ],
  },
]

const faqs = [
  {
    question: 'Can I try Cindral before committing?',
    answer:
      'Yes! Our Starter plan is free forever, and Professional comes with a 14-day free trial. No credit card required to get started.',
  },
  {
    question: 'What happens if I exceed my plan limits?',
    answer:
      "We'll notify you when you're approaching limits. You can upgrade anytime, and we won't cut off your access suddenly.",
  },
  {
    question: 'Can I switch plans later?',
    answer:
      "Absolutely. You can upgrade or downgrade at any time. When upgrading, you'll be prorated for the remainder of your billing period.",
  },
  {
    question: 'Do you offer annual billing?',
    answer:
      'Yes, annual billing comes with a 20% discount. Contact us for details or select annual billing during checkout.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, and Enterprise customers can pay via invoice with NET 30 terms.',
  },
  {
    question: 'Is there a discount for nonprofits or startups?',
    answer:
      'Yes! We offer special pricing for nonprofits, educational institutions, and early-stage startups. Contact us to learn more.',
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
          <div className="absolute top-0 right-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-r from-emerald-500/15 to-blue-500/15 blur-3xl" />
        </div>

        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-white">
              Simple, <GradientText>transparent</GradientText> pricing
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-600 lg:text-xl dark:text-zinc-400">
              Start free, upgrade as you grow. No hidden fees, no surprises. Cancel anytime.
            </p>
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
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-zinc-900 dark:text-white">{plan.price}</span>
                  {plan.period && <span className="text-zinc-600 dark:text-zinc-400"> / {plan.period}</span>}
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

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
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
          <SectionHeader title="Compare plans in detail" subtitle="Find the perfect plan for your compliance needs." />

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-4 text-left text-sm font-medium text-zinc-600 dark:text-zinc-400">Features</th>
                  <th className="py-4 text-center text-sm font-medium text-zinc-900 dark:text-white">Starter</th>
                  <th className="py-4 text-center text-sm font-medium text-zinc-900 dark:text-white">Professional</th>
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
                            <FeatureValue value={feature.starter} />
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex justify-center">
                            <FeatureValue value={feature.pro} />
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
                  <HelpCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
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
