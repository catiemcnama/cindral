// =============================================================================
// Visual Constants for System Map
// =============================================================================

export const IMPACT_COLORS = {
  critical: {
    bg: 'bg-red-500',
    border: 'border-red-500',
    stroke: '#ef4444',
    text: 'text-red-600',
    light: 'bg-red-50',
  },
  high: {
    bg: 'bg-orange-500',
    border: 'border-orange-500',
    stroke: '#f97316',
    text: 'text-orange-600',
    light: 'bg-orange-50',
  },
  medium: {
    bg: 'bg-yellow-500',
    border: 'border-yellow-500',
    stroke: '#eab308',
    text: 'text-yellow-600',
    light: 'bg-yellow-50',
  },
  low: {
    bg: 'bg-green-500',
    border: 'border-green-500',
    stroke: '#22c55e',
    text: 'text-green-600',
    light: 'bg-green-50',
  },
} as const

export const CRITICALITY_COLORS = {
  critical: 'bg-red-100 border-red-300 text-red-800',
  high: 'bg-orange-100 border-orange-300 text-orange-800',
  medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  low: 'bg-green-100 border-green-300 text-green-800',
  info: 'bg-blue-100 border-blue-300 text-blue-800',
} as const

export const NODE_DIMENSIONS = {
  regulation: { width: 200, height: 80 },
  article: { width: 180, height: 70 },
  system: { width: 160, height: 60 },
} as const

export const LAYOUT_CONFIG = {
  // Horizontal spacing between columns
  columnGap: 300,
  // Vertical spacing between nodes in same column
  rowGap: 100,
  // Starting positions for each column
  columns: {
    regulation: 50,
    article: 350,
    system: 650,
  },
  // Top padding
  topPadding: 50,
} as const

