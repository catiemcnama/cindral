import { Container, GradientText, Section, SectionHeader } from '@/components/marketing/sections'
import { Button } from '@/components/ui/button'
import { ArrowRight, Heart, Lightbulb, Shield, Target, Users, Zap } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About - Cindral',
  description: 'Learn about our mission to make regulatory compliance simple, automated, and stress-free.',
}

const values = [
  {
    icon: Shield,
    title: 'Trust First',
    description: "We handle sensitive compliance data. Security and reliability aren't features—they're foundations.",
  },
  {
    icon: Lightbulb,
    title: 'Simplify Complexity',
    description: 'Regulations are complex enough. Our job is to make understanding and acting on them simple.',
  },
  {
    icon: Zap,
    title: 'Move Fast, Stay Compliant',
    description:
      "Compliance shouldn't slow you down. We help teams move faster while staying on the right side of regulations.",
  },
  {
    icon: Users,
    title: 'Customer Obsessed',
    description: 'Every feature we build starts with a real problem from a real compliance team. We listen first.',
  },
  {
    icon: Heart,
    title: 'Empathy Driven',
    description: "We've felt the pain of manual compliance work. We build the tool we wished we had.",
  },
  {
    icon: Target,
    title: 'Impact Focused',
    description: 'We measure success by time saved, risks mitigated, and audits passed—not just features shipped.',
  },
]

const timeline = [
  {
    year: '2023',
    title: 'The Problem',
    description:
      'Our founders, working in fintech compliance, spent countless hours manually tracking regulatory changes across dozens of sources.',
  },
  {
    year: '2024',
    title: 'The Solution',
    description:
      'Cindral was born—an intelligent platform to automatically track regulations and map them to real systems.',
  },
  {
    year: '2024',
    title: 'First Customers',
    description: 'Leading financial institutions adopted Cindral, cutting compliance review time by 60% or more.',
  },
  {
    year: '2025',
    title: 'The Future',
    description: 'Expanding coverage to 100+ regulatory sources and adding AI-powered compliance recommendations.',
  },
]

const team = [
  {
    name: 'Alex Chen',
    role: 'Co-Founder & CEO',
    bio: 'Former Head of Compliance at a Series C fintech. 10+ years in financial services.',
  },
  {
    name: 'Sarah Park',
    role: 'Co-Founder & CTO',
    bio: 'Ex-Google engineer. Built data infrastructure at scale for compliance-heavy industries.',
  },
  {
    name: 'Marcus Weber',
    role: 'VP of Product',
    bio: 'Product leader from Stripe and Plaid. Obsessed with making complex things simple.',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Head of Customer Success',
    bio: 'Former Big 4 consultant. Helped 50+ organizations transform their GRC programs.',
  },
]

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/3 h-[500px] w-[500px] rounded-full bg-gradient-to-r from-purple-500/15 to-pink-500/15 blur-3xl" />
        </div>

        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-white">
              Making compliance <GradientText>actually work</GradientText>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 lg:text-xl dark:text-zinc-400">
              We&apos;re building the tools that compliance teams deserve—intelligent, automated, and designed for how
              modern organizations actually operate.
            </p>
          </div>
        </Container>
      </section>

      {/* Mission */}
      <Section variant="muted">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Our Mission</h2>
            <p className="text-xl leading-relaxed text-zinc-600 dark:text-zinc-400">
              Regulatory compliance is essential, but it shouldn&apos;t consume your team&apos;s time and energy.
              We&apos;re on a mission to{' '}
              <span className="font-medium text-zinc-900 dark:text-white">
                automate the tedious, surface the important, and give compliance teams their time back
              </span>
              —so they can focus on what matters: building trust and enabling their organizations to grow.
            </p>
          </div>
        </Container>
      </Section>

      {/* Story Timeline */}
      <Section>
        <Container>
          <SectionHeader
            title="Our Story"
            subtitle="From frustrated compliance professionals to building the solution."
          />

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute top-0 bottom-0 left-8 w-px bg-zinc-200 lg:left-1/2 dark:bg-zinc-800" />

            <div className="space-y-12">
              {timeline.map((item, index) => (
                <div key={item.year + item.title} className="relative">
                  <div
                    className={`flex flex-col lg:flex-row lg:items-center ${
                      index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                    }`}
                  >
                    {/* Content */}
                    <div
                      className={`pl-20 lg:w-1/2 lg:pl-0 ${index % 2 === 0 ? 'lg:pr-16 lg:text-right' : 'lg:pl-16'}`}
                    >
                      <div className="mb-2 text-sm font-semibold text-blue-600">{item.year}</div>
                      <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">{item.title}</h3>
                      <p className="text-zinc-600 dark:text-zinc-400">{item.description}</p>
                    </div>

                    {/* Dot */}
                    <div className="absolute top-0 left-6 flex h-5 w-5 items-center justify-center rounded-full border-4 border-white bg-blue-500 lg:left-1/2 lg:-translate-x-1/2 dark:border-zinc-950" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Values */}
      <Section variant="muted">
        <Container>
          <SectionHeader title="What We Believe" subtitle="The principles that guide everything we do." />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <value.icon className="mb-4 h-8 w-8 text-blue-600 dark:text-blue-400" />
                <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">{value.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{value.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Team */}
      <Section>
        <Container>
          <SectionHeader
            title="Meet the Team"
            subtitle="We're a small team with big ambitions, united by a shared frustration with manual compliance work."
          />

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <div key={member.name} className="text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-2xl font-bold text-white">
                  {member.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">{member.name}</h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">{member.role}</p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{member.bio}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Join Us */}
      <Section variant="muted">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 lg:text-3xl dark:text-white">We&apos;re Hiring</h2>
            <p className="mb-8 text-zinc-600 dark:text-zinc-400">
              Join us in building the future of regulatory compliance. We&apos;re looking for passionate people who want
              to make a real impact.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/careers">
                <Button size="lg" className="gap-2">
                  View Open Positions
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      {/* Contact CTA */}
      <Section>
        <Container>
          <div className="rounded-2xl bg-zinc-900 px-8 py-12 text-center lg:px-16 lg:py-16 dark:bg-zinc-800">
            <h2 className="mb-4 text-2xl font-bold text-white lg:text-3xl">Want to learn more?</h2>
            <p className="mx-auto mb-8 max-w-lg text-zinc-400">
              We&apos;d love to hear from you. Whether you&apos;re interested in Cindral for your organization or just
              want to chat about compliance, reach out.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/contact">
                <Button size="lg" className="gap-2 bg-white text-zinc-900 hover:bg-zinc-100">
                  Get in Touch
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
