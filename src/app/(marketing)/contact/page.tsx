'use client'

import { Container, GradientText, Section } from '@/components/marketing/sections'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Mail, MapPin, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const contactMethods = [
  {
    icon: Mail,
    title: 'Email',
    description: 'Drop us a line anytime',
    value: 'hello@trycindral.com',
    href: 'mailto:hello@trycindral.com',
  },
  {
    icon: Calendar,
    title: 'Book a Demo',
    description: 'See Cindral in action',
    value: 'Schedule a call',
    href: '/demo',
  },
  {
    icon: MessageSquare,
    title: 'Live Chat',
    description: 'Available 9am-6pm GMT',
    value: 'Start a conversation',
    href: '#',
  },
  {
    icon: MapPin,
    title: 'Office',
    description: 'Come say hello',
    value: 'London, UK',
    href: '#',
  },
]

const departments = [
  { value: 'sales', label: 'Sales - I want to learn more about Cindral' },
  { value: 'support', label: 'Support - I need help with my account' },
  { value: 'partnerships', label: 'Partnerships - I want to explore working together' },
  { value: 'press', label: 'Press - Media inquiry' },
  { value: 'other', label: 'Other' },
]

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    company: '',
    department: '',
    message: '',
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
          <div className="absolute top-0 right-1/3 h-[500px] w-[500px] rounded-full bg-gradient-to-r from-blue-500/15 to-cyan-500/15 blur-3xl" />
        </div>

        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-white">
              Let&apos;s <GradientText>talk</GradientText>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 lg:text-xl dark:text-zinc-400">
              Have a question about Cindral? Want to see a demo? We&apos;d love to hear from you.
            </p>
          </div>
        </Container>
      </section>

      {/* Contact Methods */}
      <Section className="pt-0">
        <Container>
          <div className="mb-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {contactMethods.map((method) => (
              <Link
                key={method.title}
                href={method.href}
                className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <method.icon className="mb-4 h-8 w-8 text-blue-600 dark:text-blue-400" />
                <h3 className="mb-1 font-semibold text-zinc-900 dark:text-white">{method.title}</h3>
                <p className="mb-2 text-sm text-zinc-500">{method.description}</p>
                <p className="text-sm font-medium text-blue-600 group-hover:underline dark:text-blue-400">
                  {method.value}
                </p>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* Contact Form */}
      <Section variant="muted">
        <Container className="max-w-2xl">
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm lg:p-12 dark:border-zinc-800 dark:bg-zinc-900">
            {isSubmitted ? (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <svg
                    className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-white">Message sent!</h2>
                <p className="mb-6 text-zinc-600 dark:text-zinc-400">
                  Thanks for reaching out. We&apos;ll get back to you within 24 hours.
                </p>
                <Button onClick={() => setIsSubmitted(false)} variant="outline">
                  Send another message
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-8 text-center">
                  <h2 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-white">Send us a message</h2>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Fill out the form below and we&apos;ll get back to you shortly.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your name"
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        required
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        required
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      type="text"
                      placeholder="Your company"
                      value={formState.company}
                      onChange={(e) => setFormState({ ...formState, company: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="department">What can we help with?</Label>
                    <select
                      id="department"
                      value={formState.department}
                      onChange={(e) => setFormState({ ...formState, department: e.target.value })}
                      required
                      className="mt-1.5 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                    >
                      <option value="">Select an option...</option>
                      {departments.map((dept) => (
                        <option key={dept.value} value={dept.value}>
                          {dept.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us how we can help..."
                      value={formState.message}
                      onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                      required
                      rows={5}
                      className="mt-1.5"
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>

                  <p className="text-center text-sm text-zinc-500">
                    By submitting this form, you agree to our{' '}
                    <Link href="/privacy" className="text-blue-600 hover:underline dark:text-blue-400">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </form>
              </>
            )}
          </div>
        </Container>
      </Section>

      {/* FAQ CTA */}
      <Section>
        <Container>
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-white">Looking for quick answers?</h2>
            <p className="mb-6 text-zinc-600 dark:text-zinc-400">
              Check out our FAQ section or book a demo to learn more.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/#faq">
                <Button variant="outline">View FAQ</Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline">Book a Demo</Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
