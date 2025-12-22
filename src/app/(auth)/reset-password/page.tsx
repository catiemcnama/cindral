'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { AlertCircle, ArrowLeft, Check, Eye, EyeOff, Loader2, Shield, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useMemo, useState } from 'react'

// Constants
const MIN_PASSWORD_LENGTH = 8
const FORM_MAX_WIDTH = 360

// Password strength requirements
const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Contains a number', test: (p: string) => /\d/.test(p) },
  { label: 'Contains a lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Contains an uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
]

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const errorParam = searchParams.get('error')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(
    errorParam === 'INVALID_TOKEN' ? 'This password reset link has expired or is invalid.' : ''
  )
  const [success, setSuccess] = useState(false)

  // Password validation
  const passwordStrength = useMemo(() => {
    return PASSWORD_REQUIREMENTS.map((req) => ({
      ...req,
      passed: req.test(password),
    }))
  }, [password])

  const passwordsMatch = useMemo(() => {
    return password === confirmPassword && password.length > 0
  }, [password, confirmPassword])

  const isPasswordStrong = useMemo(() => {
    return passwordStrength.every((req) => req.passed)
  }, [passwordStrength])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!token) {
        setError('Invalid reset token. Please request a new password reset.')
        return
      }
      if (!passwordsMatch) {
        setError('Passwords do not match')
        return
      }
      if (!isPasswordStrong) {
        setError('Password does not meet all requirements')
        return
      }

      setLoading(true)
      setError('')

      try {
        const result = await authClient.resetPassword({
          newPassword: password,
          token,
        })

        if (result.error) {
          if (result.error.message?.includes('INVALID_TOKEN') || result.error.message?.includes('expired')) {
            setError('This password reset link has expired. Please request a new one.')
          } else {
            setError(result.error.message || 'Failed to reset password. Please try again.')
          }
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
    [token, password, passwordsMatch, isPasswordStrong]
  )

  const isFormValid = useMemo(() => {
    return token && password.length >= MIN_PASSWORD_LENGTH && passwordsMatch && isPasswordStrong && !loading
  }, [token, password, passwordsMatch, isPasswordStrong, loading])

  // Invalid/expired token state
  if (!token || errorParam === 'INVALID_TOKEN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 px-4 dark:from-zinc-950 dark:to-zinc-900">
        <div className="mx-auto w-full space-y-6" style={{ maxWidth: FORM_MAX_WIDTH }}>
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Header */}
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Link expired</h1>
            <p className="text-sm text-muted-foreground">
              This password reset link has expired or is invalid. Please request a new one.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link href="/forgot-password" className="block">
              <Button className="h-11 w-full">Request new reset link</Button>
            </Link>
            <Link href="/signin" className="block">
              <Button variant="outline" className="h-11 w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign in
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Success state
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
            <h1 className="text-2xl font-bold tracking-tight">Password reset successful!</h1>
            <p className="text-sm text-muted-foreground">
              Your password has been updated. You can now sign in with your new password.
            </p>
          </div>

          {/* Sign In Button */}
          <Button className="h-11 w-full" onClick={() => router.push('/signin')}>
            Continue to sign in
          </Button>
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
          <h1 className="text-2xl font-bold tracking-tight">Create new password</h1>
          <p className="text-sm text-muted-foreground">
            Your new password must be different from previously used passwords.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {/* New Password field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              New password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your new password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
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

            {/* Password strength indicators */}
            {password.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {passwordStrength.map((req) => (
                  <div key={req.label} className="flex items-center gap-2 text-xs">
                    {req.passed ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span
                      className={cn(req.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}
                    >
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm new password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your new password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className={cn(
                  'h-11 pr-10 transition-shadow focus-visible:ring-2 focus-visible:ring-primary/20',
                  confirmPassword.length > 0 && !passwordsMatch && 'border-red-500 focus-visible:ring-red-500/20'
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-red-600 dark:text-red-400">Passwords do not match</p>
            )}
            {confirmPassword.length > 0 && passwordsMatch && (
              <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <Check className="h-3 w-3" />
                Passwords match
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
                Resetting password...
              </>
            ) : (
              'Reset password'
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
      </div>
    </div>
  )
}

// Loading fallback while searchParams are being read
function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
