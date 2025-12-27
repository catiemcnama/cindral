'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInWithGitHub, signInWithGoogle, signInWithMicrosoft, signOut, signUp, useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { AlertCircle, Check, Eye, EyeOff, Loader2, Shield, Sparkles, Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

// Check if OAuth providers are configured
const OAUTH_PROVIDERS = {
  google: !!process.env.NEXT_PUBLIC_GOOGLE_ENABLED,
  microsoft: !!process.env.NEXT_PUBLIC_MICROSOFT_ENABLED,
  github: !!process.env.NEXT_PUBLIC_GITHUB_ENABLED,
}

// Constants
const MIN_PASSWORD_LENGTH = 8
const MIN_PASSWORD_SCORE = 2
const EMAIL_VALIDATION_DELAY_MS = 500
const FORM_MAX_WIDTH = 360

// Email validation regex (RFC 5322 simplified)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  'User already exists': 'An account with this email already exists. Try signing in instead.',
  'Invalid email': 'Please enter a valid email address.',
  'Password too short': `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
  'UNIQUE constraint failed': 'An account with this email already exists.',
}

function mapErrorMessage(error: string): string {
  for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
    if (error.toLowerCase().includes(key.toLowerCase())) {
      return message
    }
  }
  return error
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= MIN_PASSWORD_LENGTH) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' }
  if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500' }
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500' }
  if (score <= 4) return { score, label: 'Strong', color: 'bg-emerald-500' }
  return { score, label: 'Excellent', color: 'bg-emerald-600' }
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export default function SignUpPage() {
  const { data: session, isPending: sessionPending } = useSession()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [nameTouched, setNameTouched] = useState(false)

  // Honeypot field for bot detection
  const [honeypot, setHoneypot] = useState('')

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password])
  const debouncedEmail = useDebounce(email, EMAIL_VALIDATION_DELAY_MS)

  // Email validation
  const emailError = useMemo(() => {
    if (!emailTouched || !debouncedEmail) return null
    if (!EMAIL_REGEX.test(debouncedEmail)) return 'Please enter a valid email address'
    return null
  }, [debouncedEmail, emailTouched])

  // Name validation
  const nameError = useMemo(() => {
    if (!nameTouched) return null
    if (name.trim().length === 0) return 'Name is required'
    if (name.trim().length < 2) return 'Name must be at least 2 characters'
    return null
  }, [name, nameTouched])

  // Redirect if already logged in
  useEffect(() => {
    // #region agent log
    // FIX: Check session?.user instead of just session - empty session objects are truthy!
    console.log('[DEBUG-SIGNUP] Redirect check:', {
      hasUser: !!session?.user,
      sessionPending,
      willRedirect: !!(session?.user && !sessionPending),
      sessionData: session,
    })
    fetch('http://127.0.0.1:7242/ingest/b450801b-9423-48b0-8ee4-d3ab4ebfc279', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'signup/page.tsx:redirect-check',
        message: 'Checking redirect condition on signup',
        data: {
          hasUser: !!session?.user,
          sessionPending: sessionPending,
          willRedirect: !!(session?.user && !sessionPending),
          sessionData: session,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        hypothesisId: 'A,B,E',
      }),
    }).catch(() => {})
    // #endregion
    if (session?.user && !sessionPending) {
      // #region agent log
      console.log('[DEBUG-SIGNUP] REDIRECTING - authenticated user detected:', session)
      fetch('http://127.0.0.1:7242/ingest/b450801b-9423-48b0-8ee4-d3ab4ebfc279', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'signup/page.tsx:redirecting',
          message: 'REDIRECTING to onboarding - user authenticated',
          data: { sessionData: session },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          hypothesisId: 'A',
        }),
      }).catch(() => {})
      // #endregion
      router.push('/dashboard/onboarding')
    }
  }, [session, sessionPending, router])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // Bot detection - if honeypot is filled, silently "succeed"
      if (honeypot) {
        router.push('/dashboard/onboarding')
        return
      }

      // Validate name
      if (name.trim().length < 2) {
        setError('Please enter your full name')
        return
      }

      setLoading(true)
      setError('')

      try {
        const result = await signUp.email({
          email: email.trim(),
          password,
          name: name.trim(),
        })

        if (result.error) {
          setError(mapErrorMessage(result.error.message || 'Sign up failed'))
        } else {
          // Sign out the user so they need to sign in manually
          // This ensures they verify their credentials work before accessing the app
          await signOut()
          // Redirect to sign-in page with success message
          router.push('/signin?registered=true')
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Sign up failed'
        setError(mapErrorMessage(errorMessage))
      } finally {
        setLoading(false)
      }
    },
    [email, password, name, honeypot, router]
  )

  const isFormValid = useMemo(() => {
    return (
      name.trim().length >= 2 && EMAIL_REGEX.test(email) && passwordStrength.score >= MIN_PASSWORD_SCORE && !loading
    )
  }, [name, email, passwordStrength.score, loading])

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
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />

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
                Regulatory compliance,
                <br />
                simplified.
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">AI-Powered Monitoring</p>
                    <p className="text-sm text-zinc-400">Track regulatory changes across 50+ jurisdictions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Automated Impact Analysis</p>
                    <p className="text-sm text-zinc-400">Instantly assess how changes affect your systems</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Evidence Pack Generation</p>
                    <p className="text-sm text-zinc-400">One-click audit-ready compliance documentation</p>
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
                &ldquo;Cindral reduced our compliance overhead by 70%. What used to take weeks now takes hours.&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-medium text-white">
                  SC
                </div>
                <div>
                  <p className="font-medium text-white">Sofia Chen</p>
                  <p className="text-sm text-zinc-400">Head of Compliance, Meridian Capital</p>
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
          <Link href="/signin">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Sign in
            </Button>
          </Link>
        </div>

        {/* Mobile social proof */}
        <div className="flex items-center justify-center gap-2 px-4 pb-4 text-xs text-muted-foreground lg:hidden">
          <Zap className="h-3.5 w-3.5" />
          <span>Trusted by 200+ financial institutions</span>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-8 sm:px-8">
          <div className="mx-auto w-full space-y-6" style={{ maxWidth: FORM_MAX_WIDTH }}>
            {/* Header */}
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Create your account</h1>
              <p className="text-sm text-muted-foreground">Start your 14-day free trial. No credit card required.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
              {/* Honeypot field - hidden from users, filled by bots */}
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              {/* Name field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Jane Smith"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setNameTouched(true)}
                  required
                  disabled={loading}
                  aria-invalid={!!nameError}
                  aria-describedby={nameError ? 'name-error' : undefined}
                  className={cn(
                    'h-11 transition-shadow focus-visible:ring-2 focus-visible:ring-primary/20',
                    nameError && 'border-red-500 focus-visible:ring-red-500/20'
                  )}
                />
                {nameError && (
                  <p id="name-error" className="text-xs text-red-600 dark:text-red-400">
                    {nameError}
                  </p>
                )}
              </div>

              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Work email
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
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
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

                {/* Password strength indicator */}
                {password && (
                  <div className="space-y-2 pt-1">
                    <div
                      className="flex gap-1"
                      role="progressbar"
                      aria-valuenow={passwordStrength.score}
                      aria-valuemin={0}
                      aria-valuemax={5}
                      aria-label="Password strength"
                    >
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={cn(
                            'h-1 flex-1 rounded-full transition-all',
                            level <= passwordStrength.score ? passwordStrength.color : 'bg-zinc-200 dark:bg-zinc-800'
                          )}
                        />
                      ))}
                    </div>
                    <p
                      className={cn(
                        'text-xs',
                        passwordStrength.score <= 2 ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'
                      )}
                    >
                      {passwordStrength.label} — Use {MIN_PASSWORD_LENGTH}+ characters with mixed case, numbers &
                      symbols
                    </p>
                  </div>
                )}
              </div>

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
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>

              {/* Terms */}
              <p className="text-center text-xs text-muted-foreground">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                  Privacy Policy
                </Link>
              </p>
            </form>

            {/* OAuth Providers */}
            {(OAUTH_PROVIDERS.google || OAUTH_PROVIDERS.microsoft || OAUTH_PROVIDERS.github) && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground dark:bg-zinc-950">Or sign up with</span>
                  </div>
                </div>

                <div className="grid gap-2">
                  {OAUTH_PROVIDERS.google && (
                    <Button
                      variant="outline"
                      className="h-11 w-full"
                      onClick={() => signInWithGoogle('/dashboard/onboarding')}
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
                      Sign up with Google
                    </Button>
                  )}

                  {OAUTH_PROVIDERS.microsoft && (
                    <Button
                      variant="outline"
                      className="h-11 w-full"
                      onClick={() => signInWithMicrosoft('/dashboard/onboarding')}
                      disabled={loading}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path fill="#f25022" d="M1 1h10v10H1z" />
                        <path fill="#00a4ef" d="M1 13h10v10H1z" />
                        <path fill="#7fba00" d="M13 1h10v10H13z" />
                        <path fill="#ffb900" d="M13 13h10v10H13z" />
                      </svg>
                      Sign up with Microsoft
                    </Button>
                  )}

                  {OAUTH_PROVIDERS.github && (
                    <Button
                      variant="outline"
                      className="h-11 w-full"
                      onClick={() => signInWithGitHub('/dashboard/onboarding')}
                      disabled={loading}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      Sign up with GitHub
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
                <span className="bg-white px-2 text-muted-foreground dark:bg-zinc-950">Already have an account?</span>
              </div>
            </div>

            {/* Sign in link */}
            <Link href="/signin" className="block">
              <Button variant="outline" className="h-11 w-full">
                Sign in instead
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
