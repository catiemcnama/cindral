'use client'

import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface NotificationBadgeProps {
  /** Number to display (0 hides the badge) */
  count: number
  /** Maximum number to display before showing "99+" */
  max?: number
  /** Badge color variant */
  variant?: 'default' | 'destructive' | 'warning' | 'success'
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show dot instead of count */
  dot?: boolean
  /** Position relative to parent */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  /** Pulse animation */
  pulse?: boolean
  /** Additional classes */
  className?: string
  /** Children to wrap */
  children?: React.ReactNode
}

// =============================================================================
// Styles
// =============================================================================

const variantStyles = {
  default: 'bg-primary text-primary-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  warning: 'bg-orange-500 text-white',
  success: 'bg-emerald-500 text-white',
}

const sizeStyles = {
  sm: 'min-w-4 h-4 text-[10px] px-1',
  md: 'min-w-5 h-5 text-xs px-1.5',
  lg: 'min-w-6 h-6 text-sm px-2',
}

const dotSizeStyles = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
}

const positionStyles = {
  'top-right': '-top-1 -right-1',
  'top-left': '-top-1 -left-1',
  'bottom-right': '-bottom-1 -right-1',
  'bottom-left': '-bottom-1 -left-1',
}

// =============================================================================
// Component
// =============================================================================

/**
 * Notification Badge
 *
 * Shows a count badge or dot indicator, typically positioned on icons
 * to indicate new items.
 *
 * @example
 * ```tsx
 * // Badge with count
 * <NotificationBadge count={5}>
 *   <BellIcon className="size-5" />
 * </NotificationBadge>
 *
 * // Dot indicator
 * <NotificationBadge count={1} dot>
 *   <BellIcon className="size-5" />
 * </NotificationBadge>
 *
 * // Standalone badge
 * <NotificationBadge count={12} />
 * ```
 */
export function NotificationBadge({
  count,
  max = 99,
  variant = 'destructive',
  size = 'sm',
  dot = false,
  position = 'top-right',
  pulse = false,
  className,
  children,
}: NotificationBadgeProps) {
  // Don't show badge if count is 0
  if (count === 0) {
    return children ? <>{children}</> : null
  }

  const displayCount = count > max ? `${max}+` : count.toString()

  const badge = (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full leading-none font-medium',
        dot ? dotSizeStyles[size] : sizeStyles[size],
        variantStyles[variant],
        pulse && 'animate-pulse',
        children && 'absolute',
        children && positionStyles[position],
        className
      )}
      aria-label={`${count} new items`}
    >
      {!dot && displayCount}
    </span>
  )

  // Standalone badge (no children)
  if (!children) {
    return badge
  }

  // Wrapped badge
  return (
    <span className="relative inline-flex">
      {children}
      {badge}
    </span>
  )
}

// =============================================================================
// Sidebar Badge (Inline)
// =============================================================================

interface SidebarBadgeProps {
  count: number
  max?: number
  variant?: 'default' | 'destructive' | 'warning' | 'success'
  className?: string
}

/**
 * Inline badge for sidebar navigation items
 *
 * @example
 * ```tsx
 * <SidebarMenuButton>
 *   <BellIcon />
 *   <span>Alerts</span>
 *   <SidebarBadge count={5} />
 * </SidebarMenuButton>
 * ```
 */
export function SidebarBadge({ count, max = 99, variant = 'destructive', className }: SidebarBadgeProps) {
  if (count === 0) return null

  const displayCount = count > max ? `${max}+` : count.toString()

  return (
    <span
      className={cn(
        'ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {displayCount}
    </span>
  )
}

// =============================================================================
// Live Indicator
// =============================================================================

interface LiveIndicatorProps {
  /** Whether data is live/connected */
  isLive?: boolean
  /** Pulse animation */
  pulse?: boolean
  /** Label text */
  label?: string
  className?: string
}

/**
 * Live indicator dot, shows connection status
 *
 * @example
 * ```tsx
 * <LiveIndicator isLive={isPolling} label="Live" />
 * ```
 */
export function LiveIndicator({ isLive = true, pulse = true, label = 'Live', className }: LiveIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          isLive ? 'bg-emerald-500' : 'bg-muted-foreground',
          isLive && pulse && 'animate-pulse'
        )}
        aria-hidden
      />
      <span className={cn('text-xs', isLive ? 'text-emerald-500' : 'text-muted-foreground')}>{label}</span>
    </div>
  )
}

// =============================================================================
// Last Updated Display
// =============================================================================

interface LastUpdatedProps {
  /** Last update timestamp */
  date: Date | null
  /** Prefix text */
  prefix?: string
  className?: string
}

/**
 * Display last updated timestamp
 *
 * @example
 * ```tsx
 * <LastUpdated date={lastUpdated} prefix="Updated" />
 * ```
 */
export function LastUpdated({ date, prefix = 'Updated', className }: LastUpdatedProps) {
  if (!date) return null

  const formatTime = (d: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)

    if (diffSec < 10) return 'just now'
    if (diffSec < 60) return `${diffSec}s ago`
    if (diffMin < 60) return `${diffMin}m ago`
    return d.toLocaleTimeString()
  }

  return (
    <span className={cn('text-xs text-muted-foreground', className)}>
      {prefix} {formatTime(date)}
    </span>
  )
}
