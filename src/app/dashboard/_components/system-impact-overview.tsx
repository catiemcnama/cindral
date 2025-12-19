import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Mock data matching the Figma mockup
const stats = [
  {
    label: 'Controls at Risk',
    value: 24,
    trend: { direction: 'up' as const, value: 3 },
    color: 'text-orange-400',
    chartColor: 'stroke-orange-400',
  },
  {
    label: 'Critical Systems Impacted',
    value: 64,
    trend: { direction: 'up' as const, value: 12 },
    color: 'text-red-400',
    chartColor: 'stroke-red-400',
  },
  {
    label: 'Evidence Gaps Detected',
    value: 19,
    trend: { direction: 'up' as const, value: 5 },
    color: 'text-blue-400',
    chartColor: 'stroke-blue-400',
  },
  {
    label: 'Upcoming Deadlines',
    value: 3,
    trend: { direction: 'down' as const, value: 1 },
    color: 'text-emerald-400',
    chartColor: 'stroke-emerald-400',
  },
]

// Mini sparkline component
function MiniChart({ color, trend }: { color: string; trend: 'up' | 'down' }) {
  // Generate a simple path for the sparkline
  const points = trend === 'up' 
    ? 'M0,20 L10,18 L20,15 L30,12 L40,14 L50,10 L60,8 L70,5 L80,3'
    : 'M0,5 L10,8 L20,10 L30,8 L40,12 L50,15 L60,13 L70,18 L80,20'

  return (
    <svg className="w-20 h-6" viewBox="0 0 80 24">
      <path
        d={points}
        fill="none"
        className={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SystemImpactOverview() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">System Impact Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <div className="flex items-center gap-1 text-xs">
                  {stat.trend.direction === 'up' ? (
                    <TrendingUpIcon className={cn('size-3', stat.trend.direction === 'up' && stat.label !== 'Upcoming Deadlines' ? 'text-red-400' : 'text-emerald-400')} />
                  ) : (
                    <TrendingDownIcon className="size-3 text-emerald-400" />
                  )}
                  <span className={cn(
                    stat.trend.direction === 'up' && stat.label !== 'Upcoming Deadlines' 
                      ? 'text-red-400' 
                      : 'text-emerald-400'
                  )}>
                    {stat.trend.direction === 'up' ? '+' : '-'}{stat.trend.value}
                  </span>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <span className={cn('text-3xl font-bold', stat.color)}>{stat.value}</span>
                <MiniChart color={stat.chartColor} trend={stat.trend.direction} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
