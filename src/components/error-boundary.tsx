'use client'

import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { logger } from '@/lib/logger'

// =============================================================================
// Types
// =============================================================================

interface ErrorBoundaryProps {
  children: ReactNode
  /** Custom fallback UI */
  fallback?: ReactNode
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** Custom retry function */
  onRetry?: () => void
  /** Title for error card */
  title?: string
  /** Description for error card */
  description?: string
  /** Whether to show error details (dev only) */
  showDetails?: boolean
  /** Compact mode for inline errors */
  compact?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

// =============================================================================
// Error Boundary Component
// =============================================================================

/**
 * Error Boundary - Catches React rendering errors
 *
 * Features:
 * - Retry functionality
 * - Error logging
 * - Custom fallback UI
 * - Sentry integration ready
 * - Compact mode for cards
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    // Log the error
    logger.error('React Error Boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })

    // Call custom handler if provided
    this.props.onError?.(error, errorInfo)

    // Sentry integration (when available)
    // Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    this.props.onRetry?.()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback
      }

      const {
        title = 'Something went wrong',
        description = 'An error occurred while loading this section.',
        showDetails = process.env.NODE_ENV === 'development',
        compact = false,
      } = this.props

      // Compact error display
      if (compact) {
        return (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangleIcon className="size-5 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={this.handleRetry}>
              <RefreshCwIcon className="mr-2 size-4" />
              Retry
            </Button>
          </div>
        )
      }

      // Full error card
      return (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangleIcon className="size-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-lg text-destructive">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showDetails && this.state.error && (
              <div className="rounded-md bg-muted/50 p-3">
                <p className="font-mono text-xs text-muted-foreground">{this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="mt-2 max-h-32 overflow-auto font-mono text-xs text-muted-foreground">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}
            <Button variant="outline" onClick={this.handleRetry}>
              <RefreshCwIcon className="mr-2 size-4" />
              Try again
            </Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

// =============================================================================
// Query Error Fallback (for TanStack Query)
// =============================================================================

interface QueryErrorFallbackProps {
  error: Error
  resetErrorBoundary?: () => void
  title?: string
  description?: string
  compact?: boolean
}

/**
 * Fallback component for TanStack Query errors
 * Use with QueryErrorResetBoundary
 */
export function QueryErrorFallback({
  error,
  resetErrorBoundary,
  title = 'Failed to load data',
  description = 'There was a problem loading this content.',
  compact = false,
}: QueryErrorFallbackProps) {
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network')
  const isAuthError = error.message.includes('401') || error.message.includes('unauthorized')

  const errorTitle = isAuthError ? 'Authentication required' : isNetworkError ? 'Connection error' : title

  const errorDescription = isAuthError
    ? 'Please sign in to view this content.'
    : isNetworkError
      ? 'Please check your internet connection and try again.'
      : description

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
        <div className="flex items-center gap-3">
          <AlertTriangleIcon className="size-5 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">{errorTitle}</p>
            <p className="text-xs text-muted-foreground">{errorDescription}</p>
          </div>
        </div>
        {resetErrorBoundary && (
          <Button variant="outline" size="sm" onClick={resetErrorBoundary}>
            <RefreshCwIcon className="mr-2 size-4" />
            Retry
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangleIcon className="size-6 text-destructive" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-destructive">{errorTitle}</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{errorDescription}</p>
        {resetErrorBoundary && (
          <Button variant="outline" className="mt-4" onClick={resetErrorBoundary}>
            <RefreshCwIcon className="mr-2 size-4" />
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// Higher-Order Component
// =============================================================================

/**
 * HOC to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component'

  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  )

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`

  return ComponentWithErrorBoundary
}
