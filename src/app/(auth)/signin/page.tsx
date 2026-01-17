'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn, signInWithGitHub, signInWithGoogle, signInWithMicrosoft, useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { AlertCircle, Check, Eye, EyeOff, Loader2, Shield, Sparkles, Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'

// Check if OAuth providers are configured
const OAUTH_PROVIDERS = {
  google: !!process.env.NEXT_PUBLIC_GOOGLE_ENABLED,
  microsoft: !!process.env.NEXT_PUBLIC_MICROSOFT_ENABLED,
  github: !!process.env.NEXT_PUBLIC_GITHUB_ENABLED,
}

// Constants - OWASP minimum password length is 8 characters
const MIN_PASSWORD_LENGTH = 8
const FORM_MAX_WIDTH = 360
const EMAIL_VALIDATION_DELAY_MS = 500

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  'Invalid credentials': 'The email or password you entered is incorrect.',
  'Invalid email or password': 'The email or password you entered is incorrect.',
  'User not found': 'No account found with this email address.',
  'Too many requests': 'Too many login attempts. Please wait a moment and try again.',
}

function mapErrorMessage(error: string): string {
  for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
    if (error.toLowerCase().includes(key.toLowerCase())) {
      return message
    }
  }
  return error
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

function SignInContent() {
  const { data: session, isPending: sessionPending } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)

  // Check if user just registered
  const justRegistered = searchParams.get('registered') === 'true'
  const fromTrial = searchParams.get('from') === 'trial'

  const debouncedEmail = useDebounce(email, EMAIL_VALIDATION_DELAY_MS)

  // Email validation
  const emailError = useMemo(() => {
    if (!emailTouched || !debouncedEmail) return null
    if (!EMAIL_REGEX.test(debouncedEmail)) return 'Please enter a valid email address'
    return null
  }, [debouncedEmail, emailTouched])

  // Redirect if already logged in
  useEffect(() => {
    if (session?.user && !sessionPending) {
      router.push('/dashboard')
    }
  }, [session, sessionPending, router])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError('')

      try {
        const result = await signIn.email({
          email: email.trim(),
          password,
        })

        if (result.error) {
          setError(mapErrorMessage(result.error.message || 'Invalid credentials'))
        } else {
          // If coming from trial, redirect to the trial results page
          if (fromTrial) {
            router.push('/dashboard/trial-results')
          } else {
            router.push('/dashboard')
          }
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Sign in failed'
        setError(mapErrorMessage(errorMessage))
      } finally {
        setLoading(false)
      }
    },
    [email, password, router, fromTrial]
  )

  const isFormValid = useMemo(() => {
    return EMAIL_REGEX.test(email) && password.length >= MIN_PASSWORD_LENGTH && !loading
  }, [email, password, loading])

  if (sessionPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left Panel - Branding */}
      <div className="relative hidden overflow-hidden bg-zinc-900 lg:block">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative flex h-full flex-col justify-between p-12">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 text-xl font-semibold text-white transition-opacity hover:opacity-80"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
              <Shield className="h-5 w-5" />
            </div>
            Cindral
          </Link>

          {/* Features */}
          <div className="space-y-8">
            <div>
              <h2 className="mb-6 text-3xl font-bold tracking-tight text-white">
                Welcome back to
                <br />
                your command center.
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Real-time Compliance Dashboard</p>
                    <p className="text-sm text-zinc-400">See your compliance status at a glance</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Smart Alerts</p>
                    <p className="text-sm text-zinc-400">Never miss a regulatory deadline again</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Team Collaboration</p>
                    <p className="text-sm text-zinc-400">Work together on compliance tasks seamlessly</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Sparkles key={i} className="h-4 w-4 text-amber-400" />
                ))}
              </div>
              <blockquote className="mb-4 text-lg text-white">
                &ldquo;The best compliance tool we&apos;ve ever used. Period.&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-cyan-600 text-sm font-medium text-white">
                  MR
                </div>
                <div>
                  <p className="font-medium text-white">Marcus Rodriguez</p>
                  <p className="text-sm text-zinc-400">CTO, NovaPay Solutions</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Zap className="h-3.5 w-3.5" />
              <span>Trusted by 200+ financial institutions worldwide</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-col bg-white dark:bg-zinc-950">
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 lg:justify-end lg:p-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold lg:hidden">
            <Shield className="h-5 w-5" />
            Cindral
          </Link>
          <Link href="/signup">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Create account
            </Button>
          </Link>
        </div>

        {/* Mobile social proof */}
        <div className="flex items-center justify-center gap-2 px-4 pb-4 text-xs text-muted-foreground lg:hidden">
          <Shield className="h-3.5 w-3.5" />
          <span>Enterprise-grade security</span>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-8 sm:px-8">
          <div className="mx-auto w-full space-y-6" style={{ maxWidth: FORM_MAX_WIDTH }}>
            {/* Header */}
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Welcome back</h1>
              <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="jane@company.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  required
                  disabled={loading}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'email-error' : undefined}
                  className={cn(
                    'h-11 transition-shadow focus-visible:ring-2 focus-visible:ring-primary/20',
                    emailError && 'border-red-500 focus-visible:ring-red-500/20'
                  )}
                />
                {emailError && (
                  <p id="email-error" className="text-xs text-red-600 dark:text-red-400">
                    {emailError}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground transition-colors hover:text-primary"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={MIN_PASSWORD_LENGTH}
                    className="h-11 pr-10 transition-shadow focus-visible:ring-2 focus-visible:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Success message - shown after registration */}
              {justRegistered && !error && (
                <div
                  className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                  role="status"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Account created successfully! Please sign in with your credentials.</span>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div
                  className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit button */}
              <Button type="submit" className="h-11 w-full text-base font-medium" disabled={!isFormValid}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            {/* OAuth Providers */}
            {(OAUTH_PROVIDERS.google || OAUTH_PROVIDERS.microsoft || OAUTH_PROVIDERS.github) && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground dark:bg-zinc-950">Or continue with</span>
                  </div>
                </div>

                <div className="grid gap-2">
                  {OAUTH_PROVIDERS.google && (
                    <Button
                      variant="outline"
                      className="h-11 w-full"
                      onClick={() => signInWithGoogle()}
                      disabled={loading}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </Button>
                  )}

                  {OAUTH_PROVIDERS.microsoft && (
                    <Button
                      variant="outline"
                      className="h-11 w-full"
                      onClick={() => signInWithMicrosoft()}
                      disabled={loading}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path fill="#f25022" d="M1 1h10v10H1z" />
                        <path fill="#00a4ef" d="M1 13h10v10H1z" />
                        <path fill="#7fba00" d="M13 1h10v10H13z" />
                        <path fill="#ffb900" d="M13 13h10v10H13z" />
                      </svg>
                      Continue with Microsoft
                    </Button>
                  )}

                  {OAUTH_PROVIDERS.github && (
                    <Button
                      variant="outline"
                      className="h-11 w-full"
                      onClick={() => signInWithGitHub()}
                      disabled={loading}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      Continue with GitHub
                    </Button>
                  )}
                </div>
              </>
            )}

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground dark:bg-zinc-950">New to Cindral?</span>
              </div>
            </div>

            {/* Sign up link */}
            <Link href="/signup" className="block">
              <Button variant="outline" className="h-11 w-full">
                Create an account
              </Button>
            </Link>

            {/* Security note */}
            <p className="text-center text-xs text-muted-foreground">
              <Shield className="mr-1 inline-block h-3 w-3" />
              Protected by enterprise-grade security
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Wrap in Suspense to handle useSearchParams
export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  )
}
