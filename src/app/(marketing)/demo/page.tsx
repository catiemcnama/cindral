'use client'

import { Container, GradientText } from '@/components/marketing/sections'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Clock, Users, Video } from 'lucide-react'
import { useState } from 'react'

const benefits = [
  'See Cindral in action with your specific use case',
  'Get answers to all your questions from our experts',
  'Understand pricing and implementation timeline',
  'No commitment, no pressure—just a conversation',
]

const demoIncludes = [
  {
    icon: Video,
    title: 'Live Product Walkthrough',
    description: '30-minute personalized demo of the platform',
  },
  {
    icon: Users,
    title: 'Q&A Session',
    description: 'Ask anything about features, pricing, or implementation',
  },
  {
    icon: Clock,
    title: 'Implementation Planning',
    description: 'Get a roadmap for rolling out Cindral to your team',
  },
]

const companySizes = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
]

export default function DemoPage() {
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    companySize: '',
    jobTitle: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-r from-violet-500/15 to-blue-500/15 blur-3xl" />
        </div>

        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left side - content */}
            <div>
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
                See Cindral <GradientText>in action</GradientText>
              </h1>
              <p className="mb-8 text-lg text-zinc-600 dark:text-zinc-400">
                Book a personalized demo with our team. We&apos;ll show you how Cindral can transform
                your compliance operations and answer any questions you have.
              </p>

              <ul className="mb-10 space-y-3">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 text-zinc-600 dark:text-zinc-400">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                    {benefit}
                  </li>
                ))}
              </ul>

              <div className="space-y-6">
                <h3 className="font-semibold text-zinc-900 dark:text-white">
                  Your demo will include:
                </h3>
                <div className="space-y-4">
                  {demoIncludes.map((item) => (
                    <div key={item.title} className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                        <item.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-zinc-900 dark:text-white">{item.title}</h4>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side - form */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
              {isSubmitted ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <svg
                      className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-white">
                    You&apos;re all set!
                  </h2>
                  <p className="mb-6 text-zinc-600 dark:text-zinc-400">
                    We&apos;ll send you a calendar invite shortly. Looking forward to meeting you!
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-6 text-center">
                    <h2 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">
                      Request a Demo
                    </h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Fill out the form and we&apos;ll be in touch within 24 hours.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="Jane"
                          value={formState.firstName}
                          onChange={(e) =>
                            setFormState({ ...formState, firstName: e.target.value })
                          }
                          required
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Smith"
                          value={formState.lastName}
                          onChange={(e) => setFormState({ ...formState, lastName: e.target.value })}
                          required
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Work Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="jane@company.com"
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        required
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        type="text"
                        placeholder="Acme Corp"
                        value={formState.company}
                        onChange={(e) => setFormState({ ...formState, company: e.target.value })}
                        required
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input
                        id="jobTitle"
                        type="text"
                        placeholder="Head of Compliance"
                        value={formState.jobTitle}
                        onChange={(e) => setFormState({ ...formState, jobTitle: e.target.value })}
                        required
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="companySize">Company Size</Label>
                      <select
                        id="companySize"
                        value={formState.companySize}
                        onChange={(e) =>
                          setFormState({ ...formState, companySize: e.target.value })
                        }
                        required
                        className="mt-1.5 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                      >
                        <option value="">Select...</option>
                        {companySizes.map((size) => (
                          <option key={size.value} value={size.value}>
                            {size.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : 'Request Demo'}
                    </Button>

                    <p className="text-center text-xs text-zinc-500">
                      We&apos;ll never share your info. Read our{' '}
                      <a href="/privacy" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </a>
                      .
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
