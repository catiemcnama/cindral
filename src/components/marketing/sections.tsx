import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

// Container wrapper for consistent max-width and padding
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto max-w-7xl px-6', className)}>{children}</div>
}

// Section wrapper with optional background variants
export function Section({
  children,
  className,
  variant = 'default',
}: {
  children: ReactNode
  className?: string
  variant?: 'default' | 'muted' | 'dark'
}) {
  return (
    <section
      className={cn(
        'py-20 lg:py-28',
        variant === 'muted' && 'border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50',
        variant === 'dark' && 'bg-zinc-900 dark:bg-zinc-950',
        variant === 'default' && 'border-t border-zinc-200 dark:border-zinc-800',
        className
      )}
    >
      {children}
    </section>
  )
}

// Section header with title and subtitle
export function SectionHeader({
  badge,
  title,
  subtitle,
  className,
  centered = true,
}: {
  badge?: string
  title: string
  subtitle?: string
  className?: string
  centered?: boolean
}) {
  return (
    <div className={cn('mb-12 lg:mb-16', centered && 'text-center', className)}>
      {badge && (
        <div className={cn('mb-4', centered && 'flex justify-center')}>
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-zinc-600 dark:text-zinc-400">{badge}</span>
          </span>
        </div>
      )}
      <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl dark:text-white">
        {title}
      </h2>
      {subtitle && (
        <p className={cn('text-lg text-zinc-600 dark:text-zinc-400', centered && 'mx-auto max-w-2xl')}>{subtitle}</p>
      )}
    </div>
  )
}

// Feature card component
export function FeatureCard({
  icon: Icon,
  title,
  description,
  color = 'blue',
}: {
  icon: LucideIcon
  title: string
  description: string
  color?: 'blue' | 'amber' | 'rose' | 'emerald' | 'purple' | 'indigo'
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
    rose: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
  }

  return (
    <div className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
      <div className={cn('mb-4 flex h-12 w-12 items-center justify-center rounded-xl', colorClasses[color])}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  )
}

// Testimonial card
export function TestimonialCard({
  quote,
  author,
  role,
  company,
  avatarUrl,
}: {
  quote: string
  author: string
  role: string
  company: string
  avatarUrl?: string
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <blockquote className="flex-1 text-zinc-600 dark:text-zinc-400">&ldquo;{quote}&rdquo;</blockquote>
      <div className="mt-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-semibold text-white">
          {avatarUrl ? (
            <img src={avatarUrl} alt={author} className="h-full w-full rounded-full object-cover" />
          ) : (
            author
              .split(' ')
              .map((n) => n[0])
              .join('')
          )}
        </div>
        <div>
          <div className="font-medium text-zinc-900 dark:text-white">{author}</div>
          <div className="text-sm text-zinc-500">
            {role} at {company}
          </div>
        </div>
      </div>
    </div>
  )
}

// Stat card for metrics
export function StatCard({ value, label, suffix }: { value: string; label: string; suffix?: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold text-zinc-900 lg:text-5xl dark:text-white">
        {value}
        {suffix && <span className="text-blue-600">{suffix}</span>}
      </div>
      <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{label}</div>
    </div>
  )
}

// Logo cloud for trust badges
export function LogoCloud({ logos }: { logos: { name: string; logo?: ReactNode }[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
      {logos.map((logo) => (
        <div
          key={logo.name}
          className="flex h-8 items-center text-zinc-400 grayscale transition-all hover:grayscale-0 dark:text-zinc-600"
        >
          {logo.logo || <span className="text-lg font-semibold">{logo.name}</span>}
        </div>
      ))}
    </div>
  )
}

// FAQ Item
export function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b border-zinc-200 py-6 dark:border-zinc-800">
      <h3 className="text-lg font-medium text-zinc-900 dark:text-white">{question}</h3>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">{answer}</p>
    </div>
  )
}

// Gradient text for emphasis
export function GradientText({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent', className)}>
      {children}
    </span>
  )
}
