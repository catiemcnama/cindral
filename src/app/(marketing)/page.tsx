import { Button } from '@/components/ui/button'
import { ArrowRight, Bell, FileCheck, Map, Shield } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
            </svg>
            <span className="text-xl font-semibold">Cindral</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/signin">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
        {/* Gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl" />
          <div className="absolute top-1/4 right-0 h-[400px] w-[400px] rounded-full bg-gradient-to-l from-amber-500/20 to-orange-500/20 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-zinc-600 dark:text-zinc-400">Trusted by leading financial institutions</span>
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-white">
              Compliance that maps to{' '}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                your reality
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              Cindral transforms complex regulations like the EU AI Act and DORA into actionable insights, automatically
              mapping requirements to your systems, teams, and processes.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg">
                Book a Demo
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative mt-16 lg:mt-20">
            <div className="absolute inset-0 -z-10 translate-y-8 rounded-3xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-amber-500/10 blur-2xl" />
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-900 shadow-2xl dark:border-zinc-800">
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
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="border-t border-zinc-200 bg-zinc-50 py-20 lg:py-28 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
              Regulations change. Your systems don&apos;t wait.
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              When DORA updates Article 11 or GDPR requirements expand, Cindral instantly shows which of your systems
              are affected—no manual mapping, no guesswork.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
              Everything you need for modern GRC
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              From regulatory tracking to evidence generation, Cindral handles the complexity so you can focus on
              building.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">Live Regulatory Feed</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Stay ahead with real-time updates from DORA, AI Act, GDPR, Basel III, and more.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <Map className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">System Mapping</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Visualize how regulations connect to your APIs, databases, cloud infrastructure, and teams.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">Smart Alerts</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Get notified when regulatory changes impact your systems, with severity-based prioritization.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <FileCheck className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">Evidence Packs</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Generate audit-ready documentation and export to Confluence, Jira, or PDF in one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshot Grid */}
      <section className="border-t border-zinc-200 bg-zinc-50 py-20 lg:py-28 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
              See it in action
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              A unified platform for tracking regulatory changes, mapping system impact, and generating compliance
              evidence.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <Image
                src="/screenshots/system-map.png"
                alt="System Map showing regulation to infrastructure mapping"
                width={700}
                height={400}
                className="w-full"
              />
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <Image
                src="/screenshots/alerts.png"
                alt="Alerts Center for compliance monitoring"
                width={700}
                height={400}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 to-zinc-800 px-8 py-16 text-center lg:px-16 lg:py-24 dark:from-zinc-800 dark:to-zinc-900">
            {/* Background decoration */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-0 right-1/4 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
              <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
            </div>

            <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to simplify compliance?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-lg text-zinc-300">
              Join forward-thinking organizations using Cindral to turn regulatory complexity into a competitive
              advantage.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="gap-2 bg-white text-zinc-900 hover:bg-zinc-100">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="border-zinc-500 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-12 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-zinc-400"
              >
                <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
              </svg>
              <span className="text-sm text-zinc-500">© 2024 Cindral. All rights reserved.</span>
            </div>
            <div className="flex gap-6 text-sm text-zinc-500">
              <a href="#" className="hover:text-zinc-900 dark:hover:text-white">
                Privacy
              </a>
              <a href="#" className="hover:text-zinc-900 dark:hover:text-white">
                Terms
              </a>
              <a href="#" className="hover:text-zinc-900 dark:hover:text-white">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
