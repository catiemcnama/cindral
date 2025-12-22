'use client'

import { useCallback, useState } from 'react'
import {
  DownloadIcon,
  FilterIcon,
  LayoutGridIcon,
  MaximizeIcon,
  MinusIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

import { IMPACT_COLORS } from './constants'
import type { MapFilters } from './types'

interface ToolbarProps {
  filters: MapFilters
  onFiltersChange: (filters: MapFilters) => void
  regulations: Array<{ id: string; name: string }>
  categories: string[]
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
  onAutoLayout: () => void
  onExport: (format: 'png' | 'svg') => void
  onRefresh: () => void
  isLoading?: boolean
}

export function SystemMapToolbar({
  filters,
  onFiltersChange,
  regulations,
  categories,
  onZoomIn,
  onZoomOut,
  onFitView,
  onAutoLayout,
  onExport,
  onRefresh,
  isLoading,
}: ToolbarProps) {
  const [searchOpen, setSearchOpen] = useState(false)

  const handleSearch = useCallback(
    (value: string) => {
      onFiltersChange({ ...filters, searchQuery: value })
    },
    [filters, onFiltersChange]
  )

  const toggleRegulation = useCallback(
    (regId: string) => {
      const current = filters.regulations
      const updated = current.includes(regId)
        ? current.filter((id) => id !== regId)
        : [...current, regId]
      onFiltersChange({ ...filters, regulations: updated })
    },
    [filters, onFiltersChange]
  )

  const toggleImpactLevel = useCallback(
    (level: 'critical' | 'high' | 'medium' | 'low') => {
      const current = filters.impactLevels
      const updated = current.includes(level)
        ? current.filter((l) => l !== level)
        : [...current, level]
      onFiltersChange({ ...filters, impactLevels: updated })
    },
    [filters, onFiltersChange]
  )

  const toggleCategory = useCallback(
    (cat: string) => {
      const current = filters.systemCategories
      const updated = current.includes(cat)
        ? current.filter((c) => c !== cat)
        : [...current, cat]
      onFiltersChange({ ...filters, systemCategories: updated })
    },
    [filters, onFiltersChange]
  )

  const clearFilters = useCallback(() => {
    onFiltersChange({
      regulations: [],
      impactLevels: [],
      systemCategories: [],
      searchQuery: '',
    })
  }, [onFiltersChange])

  const hasActiveFilters =
    filters.regulations.length > 0 ||
    filters.impactLevels.length > 0 ||
    filters.systemCategories.length > 0 ||
    filters.searchQuery.length > 0

  return (
    <div className="flex items-center justify-between rounded-lg border bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm">
      {/* Left: Search & Filters */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          {searchOpen ? (
            <div className="flex items-center gap-1">
              <Input
                placeholder="Search nodes..."
                value={filters.searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-8 w-48"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => {
                  handleSearch('')
                  setSearchOpen(false)
                }}
              >
                <XIcon className="size-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setSearchOpen(true)}
            >
              <SearchIcon className="size-4" />
            </Button>
          )}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Filter Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={hasActiveFilters ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 gap-1.5"
            >
              <FilterIcon className="size-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                  {filters.regulations.length +
                    filters.impactLevels.length +
                    filters.systemCategories.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="start">
            <div className="space-y-4">
              {/* Regulations */}
              <div>
                <Label className="mb-2 block text-sm font-medium">
                  Regulations
                </Label>
                <div className="max-h-32 space-y-2 overflow-y-auto">
                  {regulations.map((reg) => (
                    <div key={reg.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`reg-${reg.id}`}
                        checked={filters.regulations.includes(reg.id)}
                        onCheckedChange={() => toggleRegulation(reg.id)}
                      />
                      <label
                        htmlFor={`reg-${reg.id}`}
                        className="text-sm leading-none"
                      >
                        {reg.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Impact Levels */}
              <div>
                <Label className="mb-2 block text-sm font-medium">
                  Impact Level
                </Label>
                <div className="flex flex-wrap gap-2">
                  {(['critical', 'high', 'medium', 'low'] as const).map(
                    (level) => (
                      <button
                        key={level}
                        onClick={() => toggleImpactLevel(level)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                          filters.impactLevels.includes(level)
                            ? cn(IMPACT_COLORS[level].bg, 'text-white')
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        )}
                      >
                        <span
                          className={cn(
                            'size-2 rounded-full',
                            IMPACT_COLORS[level].bg
                          )}
                        />
                        <span className="capitalize">{level}</span>
                      </button>
                    )
                  )}
                </div>
              </div>

              <Separator />

              {/* Categories */}
              {categories.length > 0 && (
                <div>
                  <Label className="mb-2 block text-sm font-medium">
                    System Categories
                  </Label>
                  <div className="max-h-32 space-y-2 overflow-y-auto">
                    {categories.map((cat) => (
                      <div key={cat} className="flex items-center gap-2">
                        <Checkbox
                          id={`cat-${cat}`}
                          checked={filters.systemCategories.includes(cat)}
                          onCheckedChange={() => toggleCategory(cat)}
                        />
                        <label
                          htmlFor={`cat-${cat}`}
                          className="text-sm leading-none"
                        >
                          {cat}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasActiveFilters && (
                <>
                  <Separator />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    <XIcon className="mr-2 size-4" />
                    Clear All Filters
                  </Button>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Right: View Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCwIcon
            className={cn('size-4', isLoading && 'animate-spin')}
          />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onZoomOut}
        >
          <MinusIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onZoomIn}
        >
          <PlusIcon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onFitView}
        >
          <MaximizeIcon className="size-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onAutoLayout}
          title="Auto-arrange layout"
        >
          <LayoutGridIcon className="size-4" />
        </Button>

        {/* Export Dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <DownloadIcon className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-32" align="end">
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => onExport('png')}
              >
                Export PNG
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => onExport('svg')}
              >
                Export SVG
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

