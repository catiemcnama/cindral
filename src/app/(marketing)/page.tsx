import { Button } from '@/components/ui/button'
import {
  Container,
  FAQItem,
  FeatureCard,
  GradientText,
  LogoCloud,
  Section,
  SectionHeader,
  StatCard,
  TestimonialCard,
} from '@/components/marketing/sections'
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  FileCheck,
  GitBranch,
  Globe,
  Map,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cindral - Compliance That Maps to Your Reality',
  description:
    'Transform complex regulations like the EU AI Act and DORA into actionable insights. Automatically map requirements to your systems, teams, and processes.',
  openGraph: {
    title: 'Cindral - Compliance That Maps to Your Reality',
    description:
      'Transform complex regulations into actionable insights. Stay ahead of DORA, AI Act, GDPR, and more.',
    url: 'https://trycindral.com',
    siteName: 'Cindral',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Cindral - Modern GRC Platform',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cindral - Compliance That Maps to Your Reality',
    description: 'Transform complex regulations into actionable insights.',
    images: ['/og-image.png'],
  },
}

const features = [
  {
    icon: Shield,
    title: 'Live Regulatory Feed',
    description:
      'Stay ahead with real-time updates from DORA, AI Act, GDPR, Basel III, and 50+ regulatory sources. Never miss a change.',
    color: 'blue' as const,
  },
  {
    icon: Map,
    title: 'System Mapping',
    description:
      'Visualize how regulations connect to your APIs, databases, cloud infrastructure, and teams with intelligent dependency graphs.',
    color: 'amber' as const,
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description:
      'Get notified when regulatory changes impact your systems. Severity-based prioritization ensures you focus on what matters.',
    color: 'rose' as const,
  },
  {
    icon: FileCheck,
    title: 'Evidence Packs',
    description:
      'Generate audit-ready documentation and export to Confluence, Jira, or PDF in one click. Auditors love it.',
    color: 'emerald' as const,
  },
  {
    icon: GitBranch,
    title: 'Change Impact Analysis',
    description:
      'Instantly see which systems, teams, and processes are affected when regulations change. No manual mapping required.',
    color: 'purple' as const,
  },
  {
    icon: Globe,
    title: 'Multi-Jurisdiction',
    description:
      'Track regulations across EU, US, UK, APAC, and more. One platform for your global compliance needs.',
    color: 'indigo' as const,
  },
]

const testimonials = [
  {
    quote:
      'Cindral cut our compliance review time by 60%. We went from spending weeks mapping regulation changes to having instant visibility.',
    author: 'Sarah Chen',
    role: 'Head of Compliance',
    company: 'FinanceFlow',
  },
  {
    quote:
      "The system mapping feature is a game-changer. When DORA requirements changed, we knew exactly which APIs were affected within minutes.",
    author: 'Marcus Weber',
    role: 'CTO',
    company: 'TechBank AG',
  },
  {
    quote:
      'Our auditors were impressed with the evidence packs. What used to take our team days now takes minutes.',
    author: 'Emily Rodriguez',
    role: 'VP of Risk',
    company: 'Nexus Capital',
  },
]

const stats = [
  { value: '60', suffix: '%', label: 'Reduction in compliance review time' },
  { value: '50', suffix: '+', label: 'Regulatory sources tracked' },
  { value: '10k', suffix: '+', label: 'Requirements mapped daily' },
  { value: '99.9', suffix: '%', label: 'Platform uptime SLA' },
]

const trustedBy = [
  { name: 'FinanceFlow' },
  { name: 'TechBank' },
  { name: 'Nexus Capital' },
  { name: 'DataSecure' },
  { name: 'Cloudwise' },
]

const faqs = [
  {
    question: 'What regulations does Cindral cover?',
    answer:
      'Cindral tracks 50+ regulatory sources including DORA, EU AI Act, GDPR, MiFID II, Basel III, PCI DSS, SOC 2, HIPAA, and more. We continuously add new sources based on customer needs.',
  },
  {
    question: 'How does the system mapping work?',
    answer:
      'You can import your system inventory via CSV, connect to your CMDB, or use our API integrations. Cindral then automatically maps regulatory requirements to your systems based on their characteristics and data flows.',
  },
  {
    question: 'Can Cindral integrate with our existing tools?',
    answer:
      'Yes! Cindral integrates with Jira, Confluence, ServiceNow, Slack, Microsoft Teams, and more. We also provide a REST API and webhooks for custom integrations.',
  },
  {
    question: 'Is Cindral secure enough for financial services?',
    answer:
      "Absolutely. Cindral is SOC 2 Type II certified, GDPR compliant, and hosted on enterprise-grade infrastructure with end-to-end encryption. We're trusted by leading financial institutions.",
  },
  {
    question: 'How long does it take to get started?',
    answer:
      'Most teams are up and running within a day. Import your systems, configure your regulatory scope, and start tracking. Our onboarding team helps you every step of the way.',
  },
]

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
        {/* Gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl" />
          <div className="absolute top-1/4 right-0 h-[400px] w-[400px] rounded-full bg-gradient-to-l from-amber-500/20 to-orange-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-gradient-to-r from-emerald-500/10 to-blue-500/10 blur-3xl" />
        </div>

        <Container>
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-zinc-600 dark:text-zinc-400">
                Trusted by leading financial institutions
              </span>
            </div>

            {/* Headline */}
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-7xl dark:text-white">
              Compliance that maps to <GradientText>your reality</GradientText>
            </h1>

            {/* Subheadline */}
            <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-600 lg:text-xl dark:text-zinc-400">
              Transform complex regulations like the EU AI Act and DORA into actionable insights.
              Automatically map requirements to your systems, teams, and processes.
            </p>

            {/* CTAs */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="gap-2 text-base">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="text-base">
                  Book a Demo
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <p className="mt-8 text-sm text-zinc-500">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>

          {/* Hero Image */}
          <div className="relative mt-16 lg:mt-24">
            <div className="absolute inset-0 -z-10 translate-y-8 rounded-3xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-amber-500/10 blur-2xl" />
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-900 shadow-2xl ring-1 ring-zinc-900/5 dark:border-zinc-800">
              <Image
                src="/screenshots/dashboard.png"
                alt="Cindral Dashboard showing regulatory change feed and compliance status"
                width={1400}
                height={800}
                className="w-full"
                priority
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Trust Logos */}
      <Section variant="muted" className="py-12 lg:py-16">
        <Container>
          <p className="mb-8 text-center text-sm font-medium text-zinc-500">
            TRUSTED BY FORWARD-THINKING COMPLIANCE TEAMS
          </p>
          <LogoCloud logos={trustedBy} />
        </Container>
      </Section>

      {/* Problem/Solution */}
      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-sm text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                The Problem
              </div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Regulations change faster than you can track
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                When DORA updates Article 11 or GDPR requirements expand, compliance teams spend
                weeks manually reviewing documents, mapping impacts, and updating spreadsheets. By
                the time you&apos;re done, something else has changed.
              </p>
            </div>
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                The Solution
              </div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Instant visibility, automatic mapping
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Cindral monitors regulatory sources in real-time and automatically maps changes to
                your systems. Know exactly which APIs, databases, and teams are affected—before your
                auditor asks.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Stats */}
      <Section variant="muted">
        <Container>
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </Container>
      </Section>

      {/* Features Grid */}
      <Section>
        <Container>
          <SectionHeader
            badge="Capabilities"
            title="Everything you need for modern GRC"
            subtitle="From regulatory tracking to evidence generation, Cindral handles the complexity so you can focus on building."
          />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </Container>
      </Section>

      {/* Screenshot Feature 1 */}
      <Section variant="muted">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-sm text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <Map className="h-4 w-4" />
                System Mapping
              </div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                See how regulations connect to your infrastructure
              </h2>
              <p className="mb-6 text-lg text-zinc-600 dark:text-zinc-400">
                Visualize the relationship between regulations, your systems, and your teams.
                Interactive graphs show dependencies and impact paths at a glance.
              </p>
              <ul className="space-y-3">
                {[
                  'Map APIs, databases, and cloud services',
                  'Track data flows and dependencies',
                  'Identify gaps in coverage',
                  'Export to architecture tools',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-200 shadow-lg dark:border-zinc-800">
              <Image
                src="/screenshots/system-map.png"
                alt="System Map showing regulation to infrastructure mapping"
                width={700}
                height={500}
                className="w-full"
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* Screenshot Feature 2 */}
      <Section>
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 lg:order-1 overflow-hidden rounded-xl border border-zinc-200 shadow-lg dark:border-zinc-800">
              <Image
                src="/screenshots/alerts.png"
                alt="Smart Alerts dashboard"
                width={700}
                height={500}
                className="w-full"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-sm text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                <Bell className="h-4 w-4" />
                Smart Alerts
              </div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Never miss a regulatory change that matters
              </h2>
              <p className="mb-6 text-lg text-zinc-600 dark:text-zinc-400">
                Intelligent alerts prioritize by severity and impact. Get notified via Slack, email,
                or in-app—however your team works best.
              </p>
              <ul className="space-y-3">
                {[
                  'Severity-based prioritization',
                  'Custom notification rules',
                  'Slack, Teams, and email integration',
                  'Actionable recommendations',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* Testimonials */}
      <Section variant="muted">
        <Container>
          <SectionHeader
            title="Loved by compliance teams"
            subtitle="See why leading organizations trust Cindral for their regulatory compliance."
          />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.author} {...testimonial} />
            ))}
          </div>
        </Container>
      </Section>

      {/* How it Works */}
      <Section>
        <Container>
          <SectionHeader
            badge="How it works"
            title="Up and running in minutes"
            subtitle="Getting started with Cindral is simple. Most teams are fully operational within a day."
          />

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Connect your systems',
                description:
                  'Import your system inventory via CSV, connect to your CMDB, or use our API. We support ServiceNow, Jira, and more.',
              },
              {
                step: '02',
                title: 'Configure your scope',
                description:
                  'Select the regulations that apply to you. Cindral automatically maps requirements to your systems.',
              },
              {
                step: '03',
                title: 'Stay compliant',
                description:
                  'Get real-time alerts when regulations change. Generate evidence packs for audits. Sleep better at night.',
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="mb-4 text-5xl font-bold text-zinc-100 dark:text-zinc-800">
                  {item.step}
                </div>
                <h3 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">{item.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section variant="muted">
        <Container className="max-w-3xl">
          <SectionHeader
            title="Frequently asked questions"
            subtitle="Everything you need to know about Cindral."
          />

          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {faqs.map((faq) => (
              <FAQItem key={faq.question} {...faq} />
            ))}
          </div>

          <p className="mt-8 text-center text-zinc-600 dark:text-zinc-400">
            Have more questions?{' '}
            <Link href="/contact" className="text-blue-600 hover:underline dark:text-blue-400">
              Get in touch
            </Link>
          </p>
        </Container>
      </Section>

      {/* Final CTA */}
      <Section className="border-none">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 px-8 py-16 text-center lg:px-16 lg:py-24">
            {/* Background decoration */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-0 right-1/4 h-64 w-64 rounded-full bg-blue-500/30 blur-3xl" />
              <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-purple-500/30 blur-3xl" />
              <div className="absolute top-1/2 left-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/20 blur-3xl" />
            </div>

            <div className="relative">
              <Zap className="mx-auto mb-6 h-12 w-12 text-amber-400" />
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Ready to simplify compliance?
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-lg text-zinc-300">
                Join forward-thinking organizations using Cindral to turn regulatory complexity into
                a competitive advantage.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/signup">
                  <Button size="lg" className="gap-2 bg-white text-zinc-900 hover:bg-zinc-100">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-zinc-500 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    Talk to Sales
                  </Button>
                </Link>
              </div>
              <p className="mt-6 text-sm text-zinc-400">
                No credit card required • 14-day free trial
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
