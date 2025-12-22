'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import {
  AlertTriangleIcon,
  BellIcon,
  CheckSquareIcon,
  FileTextIcon,
  Loader2Icon,
  NetworkIcon,
  SearchIcon,
  SettingsIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from '@/hooks/use-debounce'

// =============================================================================
// Types
// =============================================================================

type SearchResultType = 'regulation' | 'article' | 'obligation' | 'system' | 'alert'

interface QuickAction {
  id: string
  name: string
  icon: typeof SearchIcon
  href: string
  keywords?: string[]
}

// =============================================================================
// Constants
// =============================================================================

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'dashboard', name: 'Go to Dashboard', icon: NetworkIcon, href: '/dashboard', keywords: ['home', 'overview'] },
  { id: 'regulations', name: 'View Regulations', icon: FileTextIcon, href: '/dashboard/regulations' },
  { id: 'obligations', name: 'View Obligations', icon: CheckSquareIcon, href: '/dashboard/obligations' },
  { id: 'systems', name: 'View System Map', icon: NetworkIcon, href: '/dashboard/system-map' },
  { id: 'alerts', name: 'View Alerts', icon: BellIcon, href: '/dashboard/alerts' },
  { id: 'settings', name: 'Settings', icon: SettingsIcon, href: '/dashboard/settings' },
]

const TYPE_ICONS: Record<SearchResultType, typeof SearchIcon> = {
  regulation: FileTextIcon,
  article: FileTextIcon,
  obligation: CheckSquareIcon,
  system: NetworkIcon,
  alert: BellIcon,
}

const TYPE_LABELS: Record<SearchResultType, string> = {
  regulation: 'Regulations',
  article: 'Articles',
  obligation: 'Obligations',
  system: 'Systems',
  alert: 'Alerts',
}

const TYPE_ROUTES: Record<SearchResultType, string> = {
  regulation: '/dashboard/regulations',
  article: '/dashboard/regulations',
  obligation: '/dashboard/obligations',
  system: '/dashboard/system-map',
  alert: '/dashboard/alerts',
}

// =============================================================================
// Hook: useCommandSearch
// =============================================================================

export function useCommandSearch() {
  const [open, setOpen] = useState(false)

  // Global keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return { open, setOpen }
}

// =============================================================================
// Component: CommandSearch
// =============================================================================

interface CommandSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const router = useRouter()
  const trpc = useTRPC()
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 200)

  // Search query
  const searchQuery = useQuery({
    ...trpc.search.global.queryOptions({
      query: debouncedQuery,
      limit: 5,
    }),
    enabled: debouncedQuery.length >= 2,
  })

  const { data: results, isLoading, error } = searchQuery

  // Handle selection
  const handleSelect = useCallback(
    (type: SearchResultType, id: string) => {
      const baseRoute = TYPE_ROUTES[type]
      const route = type === 'article' ? `${baseRoute}?article=${id}` : `${baseRoute}?id=${id}`
      router.push(route)
      onOpenChange(false)
      setQuery('')
    },
    [router, onOpenChange]
  )

  const handleAction = useCallback(
    (href: string) => {
      router.push(href)
      onOpenChange(false)
      setQuery('')
    },
    [router, onOpenChange]
  )

  // Reset query when dialog closes - using onOpenChange callback instead of effect
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      onOpenChange(newOpen)
      if (!newOpen) {
        // Delay reset to avoid cascading renders
        setTimeout(() => setQuery(''), 0)
      }
    },
    [onOpenChange]
  )

  const hasResults = results && results.totalResults > 0
  const showLoading = isLoading && debouncedQuery.length >= 2

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <CommandInput placeholder="Search regulations, systems, obligations..." value={query} onValueChange={setQuery} />
      <CommandList>
        {/* Loading state */}
        {showLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertTriangleIcon className="size-5 text-destructive" />
            <p className="mt-2 text-sm text-muted-foreground">Search failed. Please try again.</p>
          </div>
        )}

        {/* Empty state */}
        {!showLoading && !error && debouncedQuery.length >= 2 && !hasResults && (
          <CommandEmpty>No results found for &ldquo;{debouncedQuery}&rdquo;</CommandEmpty>
        )}

        {/* Search results */}
        {hasResults && !showLoading && (
          <>
            {results.regulations.length > 0 && (
              <CommandGroup heading={TYPE_LABELS.regulation}>
                {results.regulations.map((item) => {
                  const Icon = TYPE_ICONS.regulation
                  return (
                    <CommandItem key={`reg-${item.id}`} onSelect={() => handleSelect('regulation', item.id)}>
                      <Icon className="mr-2 size-4 text-muted-foreground" />
                      <div className="flex-1">
                        <span className="font-medium">{item.name}</span>
                        {item.subtitle && <span className="ml-2 text-xs text-muted-foreground">{item.subtitle}</span>}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {results.articles.length > 0 && (
              <CommandGroup heading={TYPE_LABELS.article}>
                {results.articles.map((item) => {
                  const Icon = TYPE_ICONS.article
                  return (
                    <CommandItem key={`art-${item.id}`} onSelect={() => handleSelect('article', item.id)}>
                      <Icon className="mr-2 size-4 text-muted-foreground" />
                      <div className="flex-1">
                        <span className="font-medium">{item.title}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{item.regulationName}</span>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {results.obligations.length > 0 && (
              <CommandGroup heading={TYPE_LABELS.obligation}>
                {results.obligations.map((item) => {
                  const Icon = TYPE_ICONS.obligation
                  return (
                    <CommandItem key={`obl-${item.id}`} onSelect={() => handleSelect('obligation', item.id)}>
                      <Icon className="mr-2 size-4 text-muted-foreground" />
                      <div className="flex-1">
                        <span className="font-medium">{item.title}</span>
                        <span className="ml-2 text-xs text-muted-foreground capitalize">{item.status}</span>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {results.systems.length > 0 && (
              <CommandGroup heading={TYPE_LABELS.system}>
                {results.systems.map((item) => {
                  const Icon = TYPE_ICONS.system
                  return (
                    <CommandItem key={`sys-${item.id}`} onSelect={() => handleSelect('system', item.id)}>
                      <Icon className="mr-2 size-4 text-muted-foreground" />
                      <div className="flex-1">
                        <span className="font-medium">{item.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{item.category}</span>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {results.alerts.length > 0 && (
              <CommandGroup heading={TYPE_LABELS.alert}>
                {results.alerts.map((item) => {
                  const Icon = TYPE_ICONS.alert
                  return (
                    <CommandItem key={`alert-${item.id}`} onSelect={() => handleSelect('alert', item.id)}>
                      <Icon className="mr-2 size-4 text-muted-foreground" />
                      <div className="flex-1">
                        <span className="font-medium">{item.title}</span>
                        <span className="ml-2 text-xs text-muted-foreground capitalize">{item.severity}</span>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </>
        )}

        {/* Quick actions - show when no query */}
        {(!debouncedQuery || debouncedQuery.length < 2) && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Quick Actions">
              {QUICK_ACTIONS.map((action) => (
                <CommandItem key={action.id} onSelect={() => handleAction(action.href)} keywords={action.keywords}>
                  <action.icon className="mr-2 size-4 text-muted-foreground" />
                  <span>{action.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>

      {/* Footer */}
      <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">↑↓</kbd>
          <span>Navigate</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">↵</kbd>
          <span>Select</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">esc</kbd>
          <span>Close</span>
        </div>
      </div>
    </CommandDialog>
  )
}

// =============================================================================
// Component: SearchTrigger (for header)
// =============================================================================

interface SearchTriggerProps {
  onClick: () => void
}

export function SearchTrigger({ onClick }: SearchTriggerProps) {
  return (
    <Button
      variant="outline"
      className="relative h-9 w-full justify-start bg-muted/50 pl-9 text-sm text-muted-foreground hover:bg-muted md:w-64 lg:w-80"
      onClick={onClick}
    >
      <SearchIcon className="absolute left-3 size-4" />
      <span className="hidden md:inline">Search...</span>
      <kbd className="pointer-events-none absolute right-2 hidden h-5 items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 select-none md:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  )
}
