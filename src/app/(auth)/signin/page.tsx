'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn, useSession } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { AlertCircle, Check, Eye, EyeOff, Loader2, Shield, Sparkles, Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SignInPage() {
  const { data: session, isPending: sessionPending } = useSession()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Redirect if already logged in
  useEffect(() => {
    if (session && !sessionPending) {
      router.push('/app')
    }
  }, [session, sessionPending, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn.email({
        email,
        password,
      })

      if (result.error) {
        setError(result.error.message || 'Invalid credentials')
      } else {
        router.push('/app')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

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
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
          }} 
        />

        <div className="relative flex h-full flex-col justify-between p-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 text-xl font-semibold text-white transition-opacity hover:opacity-80">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
              <Shield className="h-5 w-5" />
            </div>
            Cindral
          </Link>

          {/* Features */}
          <div className="space-y-8">
            <div>
              <h2 className="mb-6 text-3xl font-bold tracking-tight text-white">
                Welcome back to<br />your command center.
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
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 text-sm font-medium text-white">
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

        <div className="flex flex-1 items-center justify-center px-4 pb-8 sm:px-8">
          <div className="mx-auto w-full max-w-[360px] space-y-6">
            {/* Header */}
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Welcome back</h1>
              <p className="text-sm text-muted-foreground">
                Sign in to your account to continue
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
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                  disabled={loading}
                  className={cn(
                    'h-11 transition-shadow',
                    focusedField === 'email' && 'ring-2 ring-primary/20'
                  )}
                />
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
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    required
                    disabled={loading}
                    minLength={6}
                    className={cn(
                      'h-11 pr-10 transition-shadow',
                      focusedField === 'password' && 'ring-2 ring-primary/20'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit button */}
              <Button 
                type="submit" 
                className="h-11 w-full text-base font-medium" 
                disabled={loading}
              >
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

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground dark:bg-zinc-950">
                  New to Cindral?
                </span>
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
