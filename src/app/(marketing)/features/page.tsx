import { Container, FeatureCard, GradientText, Section, SectionHeader } from '@/components/marketing/sections'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  GitBranch,
  Globe,
  History,
  Lock,
  Map,
  MessageSquare,
  Search,
  Settings,
  Shield,
  Users,
  Workflow,
  Zap,
} from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Features - Cindral',
  description:
    'Discover how Cindral helps you track regulations, map system impacts, and generate audit-ready evidence packs.',
}

const coreFeatures = [
  {
    icon: Shield,
    title: 'Live Regulatory Feed',
    description:
      'Real-time monitoring of 50+ regulatory sources including DORA, AI Act, GDPR, Basel III, MiFID II, and more.',
    color: 'blue' as const,
  },
  {
    icon: Map,
    title: 'System Mapping',
    description: 'Visual graphs connecting regulations to your APIs, databases, cloud infrastructure, and teams.',
    color: 'amber' as const,
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'Intelligent notifications prioritized by severity and impact, delivered how your team works best.',
    color: 'rose' as const,
  },
  {
    icon: FileCheck,
    title: 'Evidence Packs',
    description: 'Generate audit-ready documentation with one click. Export to Confluence, Jira, or PDF.',
    color: 'emerald' as const,
  },
  {
    icon: GitBranch,
    title: 'Change Impact Analysis',
    description: 'Instantly understand which systems, teams, and processes are affected by regulatory changes.',
    color: 'purple' as const,
  },
  {
    icon: Globe,
    title: 'Multi-Jurisdiction',
    description: 'Track regulations across EU, US, UK, APAC, and more from a single unified dashboard.',
    color: 'indigo' as const,
  },
]

const additionalFeatures = [
  {
    icon: Search,
    title: 'Semantic Search',
    description: 'Find any regulation, requirement, or mapping instantly with AI-powered search.',
  },
  {
    icon: History,
    title: 'Version History',
    description: 'Track how regulations have evolved over time with full change history.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Assign owners, add comments, and track progress across your compliance team.',
  },
  {
    icon: Workflow,
    title: 'Workflow Automation',
    description: 'Trigger actions when regulations change—create tickets, notify teams, update docs.',
  },
  {
    icon: BarChart3,
    title: 'Compliance Dashboard',
    description: 'Real-time visibility into your compliance posture with executive-ready reports.',
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description: 'SOC 2 Type II, GDPR compliant, SSO, and end-to-end encryption.',
  },
  {
    icon: MessageSquare,
    title: 'Slack & Teams',
    description: 'Get alerts where you work. Native integrations with Slack and Microsoft Teams.',
  },
  {
    icon: Clock,
    title: 'Deadline Tracking',
    description: 'Never miss a compliance deadline with automated reminders and calendaring.',
  },
  {
    icon: FileText,
    title: 'Policy Library',
    description: 'Central repository for all your compliance policies with version control.',
  },
  {
    icon: Settings,
    title: 'Custom Frameworks',
    description: 'Build custom compliance frameworks or import industry standards.',
  },
  {
    icon: Zap,
    title: 'API Access',
    description: 'RESTful API and webhooks for custom integrations with your existing tools.',
  },
  {
    icon: CheckCircle2,
    title: 'Control Testing',
    description: 'Schedule and track control testing with evidence collection and sign-off.',
  },
]

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-r from-blue-500/15 to-purple-500/15 blur-3xl" />
        </div>

        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-white">
              Built for <GradientText>modern compliance</GradientText>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-600 lg:text-xl dark:text-zinc-400">
              Everything you need to track regulations, understand impact, and prove compliance—all in one platform
              designed for how GRC teams actually work.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg">
                  See it in Action
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Core Features */}
      <Section variant="muted">
        <Container>
          <SectionHeader
            badge="Core Capabilities"
            title="The foundation of modern GRC"
            subtitle="Six powerful features that transform how you handle regulatory compliance."
          />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coreFeatures.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                color={feature.color}
              />
            ))}
          </div>
        </Container>
      </Section>

      {/* Deep Dive: Regulatory Feed */}
      <Section>
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-sm text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <Shield className="h-4 w-4" />
                Regulatory Intelligence
              </div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                50+ sources. One unified feed.
              </h2>
              <p className="mb-6 text-lg text-zinc-600 dark:text-zinc-400">
                Stop checking multiple regulatory websites. Cindral aggregates updates from every source that matters to
                your business and presents them in a single, actionable feed.
              </p>
              <ul className="space-y-3">
                {[
                  'DORA, AI Act, GDPR, MiFID II, Basel III',
                  'PCI DSS, SOC 2, ISO 27001, NIST',
                  'US SEC, FCA, APRA, MAS, HKMA',
                  'Custom sources via API',
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
                src="/screenshots/dashboard.png"
                alt="Live Regulatory Feed"
                width={700}
                height={500}
                className="w-full"
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* Deep Dive: System Mapping */}
      <Section variant="muted">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 overflow-hidden rounded-xl border border-zinc-200 shadow-lg lg:order-1 dark:border-zinc-800">
              <Image
                src="/screenshots/system-map.png"
                alt="System Mapping"
                width={700}
                height={500}
                className="w-full"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-sm text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <Map className="h-4 w-4" />
                System Mapping
              </div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Visualize your entire tech estate
              </h2>
              <p className="mb-6 text-lg text-zinc-600 dark:text-zinc-400">
                Import your systems, define data flows, and let Cindral automatically map regulations to the
                infrastructure they affect. Interactive graphs make complex dependencies easy to understand.
              </p>
              <ul className="space-y-3">
                {[
                  'Import from CSV, CMDB, or API',
                  'Interactive dependency visualization',
                  'Team and owner assignments',
                  'Gap analysis and coverage reports',
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

      {/* Deep Dive: Evidence Packs */}
      <Section>
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <FileCheck className="h-4 w-4" />
                Evidence Generation
              </div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Audit-ready in one click
              </h2>
              <p className="mb-6 text-lg text-zinc-600 dark:text-zinc-400">
                Generate comprehensive evidence packs that auditors love. Include system mappings, control evidence,
                policy documents, and change history—all formatted and ready to submit.
              </p>
              <ul className="space-y-3">
                {[
                  'PDF, Confluence, Jira export',
                  'Customizable templates',
                  'Automated evidence collection',
                  'Version-controlled documents',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-800">
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-900">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-white">DORA Compliance Pack</div>
                    <div className="text-sm text-zinc-500">Generated Dec 15, 2024</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-900">
                  <FileText className="h-8 w-8 text-purple-500" />
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-white">AI Act Risk Assessment</div>
                    <div className="text-sm text-zinc-500">Generated Dec 12, 2024</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-900">
                  <FileText className="h-8 w-8 text-emerald-500" />
                  <div>
                    <div className="font-medium text-zinc-900 dark:text-white">GDPR Data Mapping</div>
                    <div className="text-sm text-zinc-500">Generated Dec 10, 2024</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* All Features Grid */}
      <Section variant="muted">
        <Container>
          <SectionHeader
            title="And so much more"
            subtitle="Cindral is packed with features to streamline every aspect of your compliance workflow."
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {additionalFeatures.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <feature.icon className="mb-3 h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h3 className="mb-1 font-semibold text-zinc-900 dark:text-white">{feature.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section className="border-none">
        <Container>
          <div className="rounded-2xl bg-zinc-900 px-8 py-12 text-center lg:px-16 lg:py-16 dark:bg-zinc-800">
            <h2 className="mb-4 text-2xl font-bold text-white lg:text-3xl">See all features in action</h2>
            <p className="mx-auto mb-8 max-w-lg text-zinc-400">
              The best way to understand Cindral is to see it work with your data. Start a free trial or book a
              personalized demo.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="gap-2 bg-white text-zinc-900 hover:bg-zinc-100">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="border-zinc-600 text-white hover:bg-white/10">
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
