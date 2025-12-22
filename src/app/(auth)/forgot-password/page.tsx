'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { AlertCircle, ArrowLeft, Check, Loader2, Mail, Shield } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

// Constants
const FORM_MAX_WIDTH = 360
const EMAIL_VALIDATION_DELAY_MS = 500

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)

  const debouncedEmail = useDebounce(email, EMAIL_VALIDATION_DELAY_MS)

  // Email validation
  const emailError = useMemo(() => {
    if (!emailTouched || !debouncedEmail) return null
    if (!EMAIL_REGEX.test(debouncedEmail)) return 'Please enter a valid email address'
    return null
  }, [debouncedEmail, emailTouched])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      setError('')

      try {
        const result = await authClient.requestPasswordReset({
          email: email.trim(),
          redirectTo: `${window.location.origin}/reset-password`,
        })

        if (result.error) {
          setError(result.error.message || 'Failed to send reset email. Please try again.')
        } else {
          setSuccess(true)
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [email]
  )

  const isFormValid = useMemo(() => {
    return EMAIL_REGEX.test(email) && !loading
  }, [email, loading])

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 px-4 dark:from-zinc-950 dark:to-zinc-900">
        <div className="mx-auto w-full space-y-6" style={{ maxWidth: FORM_MAX_WIDTH }}>
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>

          {/* Header */}
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              If an account exists for <span className="font-medium text-foreground">{email}</span>, we&apos;ve sent
              password reset instructions.
            </p>
          </div>

          {/* Email Icon */}
          <div className="flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <Mail className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>

          {/* Help Text */}
          <div className="space-y-3 text-center text-sm text-muted-foreground">
            <p>The link will expire in 1 hour.</p>
            <p>
              Didn&apos;t receive the email? Check your spam folder or{' '}
              <button
                onClick={() => {
                  setSuccess(false)
                  setEmail('')
                }}
                className="text-primary underline-offset-4 hover:underline"
              >
                try again
              </button>
              .
            </p>
          </div>

          {/* Back to Sign In */}
          <Link href="/signin" className="block">
            <Button variant="outline" className="h-11 w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 px-4 dark:from-zinc-950 dark:to-zinc-900">
      <div className="mx-auto w-full space-y-6" style={{ maxWidth: FORM_MAX_WIDTH }}>
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5 text-xl font-semibold">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          Cindral
        </Link>

        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Forgot your password?</h1>
          <p className="text-sm text-muted-foreground">
            No worries! Enter your email and we&apos;ll send you reset instructions.
          </p>
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
                Sending...
              </>
            ) : (
              'Send reset instructions'
            )}
          </Button>
        </form>

        {/* Back to Sign In */}
        <div className="text-center">
          <Link
            href="/signin"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>

        {/* Security note */}
        <p className="text-center text-xs text-muted-foreground">
          <Shield className="mr-1 inline-block h-3 w-3" />
          We&apos;ll never share your email with anyone else.
        </p>
      </div>
    </div>
  )
}
