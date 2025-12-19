'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboardIcon,
  FileTextIcon,
  CheckSquareIcon,
  NetworkIcon,
  BellIcon,
  PackageIcon,
  SettingsIcon,
  ChevronLeftIcon,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboardIcon },
  { name: 'Regulations', href: '/dashboard/regulations', icon: FileTextIcon },
  { name: 'Obligations', href: '/dashboard/obligations', icon: CheckSquareIcon },
  { name: 'System Map', href: '/dashboard/system-map', icon: NetworkIcon },
  { name: 'Alerts', href: '/dashboard/alerts', icon: BellIcon },
  { name: 'Evidence Packs', href: '/dashboard/evidence-packs', icon: PackageIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: SettingsIcon },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { toggleSidebar, state } = useSidebar()

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
            C
          </div>
          <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">
            Cindral
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive =
                  item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href)

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
                      className={cn(
                        isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
                      )}
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

      <SidebarFooter className="p-2">
        <SidebarMenuButton
          onClick={toggleSidebar}
          tooltip={state === 'expanded' ? 'Collapse' : 'Expand'}
          className="w-full justify-center group-data-[collapsible=icon]:justify-center"
        >
          <ChevronLeftIcon
            className={cn(
              'size-4 transition-transform',
              state === 'collapsed' && 'rotate-180'
            )}
          />
          <span className="group-data-[collapsible=icon]:hidden">Collapse</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  )
}
