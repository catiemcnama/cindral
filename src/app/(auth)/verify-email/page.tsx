'use client'

import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { AlertCircle, CheckCircle2, Loader2, Mail, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const errorParam = searchParams.get('error')

  // Compute initial state based on URL params to avoid setState in effect
  const initialStatus = errorParam ? 'error' : !token ? 'no-token' : 'loading'
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>(initialStatus)
  const [error, setError] = useState(errorParam || '')

  // Auto-verify when token is present
  useEffect(() => {
    // Skip if no token or already in error/no-token state from URL params
    if (!token || errorParam) {
      return
    }

    const verifyEmail = async () => {
      try {
        const result = await authClient.verifyEmail({ query: { token } })

        if (result.error) {
          setStatus('error')
          setError(result.error.message || 'Verification failed')
        } else {
          setStatus('success')
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            router.push('/dashboard')
          }, 3000)
        }
      } catch (err: unknown) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Verification failed')
      }
    }

    verifyEmail()
  }, [token, errorParam, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 px-4 dark:from-zinc-950 dark:to-zinc-900">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5 text-xl font-semibold">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-5 w-5" />
          </div>
          Cindral
        </Link>

        <div className="rounded-xl border bg-white p-8 shadow-sm dark:bg-zinc-900">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Verifying your email</h1>
                <p className="mt-1 text-sm text-muted-foreground">Please wait while we verify your email address...</p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">Email verified!</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your email has been successfully verified. Redirecting to your dashboard...
                </p>
              </div>
              <Link href="/app">
                <Button className="mt-2">Go to Dashboard</Button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-red-600 dark:text-red-400">Verification failed</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {error || 'The verification link is invalid or has expired.'}
                </p>
              </div>
              <div className="flex w-full flex-col gap-2">
                <p className="text-sm text-muted-foreground">Sign in to request a new verification email.</p>
                <Link href="/signin">
                  <Button className="w-full">Sign In</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="outline" className="w-full">
                    Create New Account
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {status === 'no-token' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Mail className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Check your email</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  We&apos;ve sent you a verification link. Click the link in your email to verify your account.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                  Didn&apos;t receive the email? Sign in to request a new one.
                </p>
                <Link href="/signin">
                  <Button variant="outline" className="w-full">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Shield className="mr-1 inline-block h-3 w-3" />
          Protected by enterprise-grade security
        </p>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
