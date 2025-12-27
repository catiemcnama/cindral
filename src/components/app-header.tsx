'use client'

import {
  BellIcon,
  Building2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  HelpCircleIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { CommandSearch, SearchTrigger, useCommandSearch } from '@/components/command-search'
import { NotificationBadge } from '@/components/notification-badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { signOut, useSession } from '@/lib/auth-client'

// =============================================================================
// Breadcrumb Configuration
// =============================================================================

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  regulations: 'Regulations',
  obligations: 'Obligations',
  'system-map': 'System Map',
  alerts: 'Alerts',
  'evidence-packs': 'Evidence Packs',
  settings: 'Settings',
  onboarding: 'Setup',
}

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: { label: string; href: string }[] = []

  let path = ''
  for (const segment of segments) {
    path += `/${segment}`
    const label = ROUTE_LABELS[segment] ?? segment
    breadcrumbs.push({ label, href: path })
  }

  return breadcrumbs
}

// =============================================================================
// Component
// =============================================================================

export function AppHeader() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const { open, setOpen } = useCommandSearch()

  const handleSignOut = async () => {
    await signOut()
    router.push('/signin')
  }

  const initials =
    session?.user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U'

  const breadcrumbs = getBreadcrumbs(pathname)
  const currentOrg = session?.session?.activeOrganizationId ? 'My Organization' : null

  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b border-border bg-background px-4 lg:px-6">
        <SidebarTrigger className="md:hidden" />

        {/* Breadcrumbs */}
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            {breadcrumbs.map((crumb, idx) => (
              <BreadcrumbItem key={crumb.href}>
                {idx === breadcrumbs.length - 1 ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <>
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                    <BreadcrumbSeparator>
                      <ChevronRightIcon className="size-3.5" />
                    </BreadcrumbSeparator>
                  </>
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div className="w-full max-w-sm">
          <SearchTrigger onClick={() => setOpen(true)} />
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          {/* Help */}
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex" asChild>
            <Link href="/docs">
              <HelpCircleIcon className="size-4" />
              <span className="sr-only">Help</span>
            </Link>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/dashboard/alerts">
              <NotificationBadge count={3} size="sm">
                <BellIcon className="size-4" />
              </NotificationBadge>
              <span className="sr-only">Notifications</span>
            </Link>
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/settings">
              <SettingsIcon className="size-4" />
              <span className="sr-only">Settings</span>
            </Link>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar className="size-7">
                  <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || 'User'} />
                  <AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback>
                </Avatar>
                <ChevronDownIcon className="size-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
              {/* User info */}
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm leading-none font-medium">{session?.user?.name || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email || 'user@example.com'}
                  </p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {/* Organization */}
              {currentOrg && (
                <>
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Organization
                  </DropdownMenuLabel>
                  <DropdownMenuItem className="gap-2">
                    <Building2Icon className="size-4" />
                    <span className="flex-1">{currentOrg}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      Active
                    </Badge>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Actions */}
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="gap-2">
                    <UserIcon className="size-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="gap-2">
                    <SettingsIcon className="size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive focus:text-destructive">
                <LogOutIcon className="size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Command palette */}
      <CommandSearch open={open} onOpenChange={setOpen} />
    </>
  )
}
