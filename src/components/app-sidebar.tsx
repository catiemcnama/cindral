'use client'

import {
  BellIcon,
  CheckSquareIcon,
  ChevronLeftIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  NetworkIcon,
  PackageIcon,
  SettingsIcon,
  SparklesIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

import { Progress } from '@/components/ui/progress'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useOnboardingStatus, useOnboardingState } from '@/hooks/use-onboarding'
import { cn } from '@/lib/utils'

// =============================================================================
// Navigation Configuration
// =============================================================================

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboardIcon },
  { name: 'Regulations', href: '/dashboard/regulations', icon: FileTextIcon },
  { name: 'Obligations', href: '/dashboard/obligations', icon: CheckSquareIcon },
  { name: 'System Map', href: '/dashboard/system-map', icon: NetworkIcon },
  { name: 'Alerts', href: '/dashboard/alerts', icon: BellIcon },
  { name: 'Evidence Packs', href: '/dashboard/evidence-packs', icon: PackageIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: SettingsIcon },
]

// =============================================================================
// Component
// =============================================================================

// Total onboarding steps (org, industry, regulations, systems, team)
const TOTAL_STEPS = 5

export function AppSidebar() {
  const pathname = usePathname()
  const { toggleSidebar, state } = useSidebar()
  const { isComplete, isLoading } = useOnboardingStatus()
  const { state: onboardingState } = useOnboardingState()

  const isCollapsed = state === 'collapsed'

  // Calculate actual progress from onboarding state
  const { currentStep, progressPercent } = useMemo(() => {
    if (!onboardingState) {
      return { currentStep: 1, progressPercent: 20 }
    }
    // currentStep is 0-indexed, so add 1 for display
    const step = (onboardingState.currentStep ?? 0) + 1
    const percent = Math.round((step / TOTAL_STEPS) * 100)
    return { currentStep: step, progressPercent: percent }
  }, [onboardingState])

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Logo */}
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground">
            C
          </div>
          <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">Cindral</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Onboarding Progress (if incomplete) */}
        {!isLoading && !isComplete && (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <Link
              href="/dashboard/onboarding"
              className="mx-2 rounded-lg border border-primary/20 bg-primary/5 p-3 transition-colors hover:bg-primary/10"
            >
              <div className="flex items-center gap-2">
                <SparklesIcon className="size-4 text-primary" />
                <span className="text-sm font-medium">Complete Setup</span>
              </div>
              <div className="mt-2">
                <Progress value={progressPercent} className="h-1.5" />
                <p className="mt-1 text-xs text-muted-foreground">{currentStep} of {TOTAL_STEPS} steps</p>
              </div>
            </Link>
          </SidebarGroup>
        )}

        {/* Collapsed onboarding indicator */}
        {!isLoading && !isComplete && isCollapsed && (
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Complete Setup">
                  <Link href="/dashboard/onboarding">
                    <SparklesIcon className="size-4 text-primary" />
                    <span>Setup</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
                      className={cn(isActive && 'bg-sidebar-accent text-sidebar-accent-foreground')}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-2">
        <SidebarMenuButton
          onClick={toggleSidebar}
          tooltip={state === 'expanded' ? 'Collapse' : 'Expand'}
          className="w-full justify-center group-data-[collapsible=icon]:justify-center"
        >
          <ChevronLeftIcon className={cn('size-4 transition-transform', state === 'collapsed' && 'rotate-180')} />
          <span className="group-data-[collapsible=icon]:hidden">Collapse</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  )
}
