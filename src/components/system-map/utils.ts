import type { MapNode, MapEdge, SystemMapData, MapFilters } from './types'
import { LAYOUT_CONFIG } from './constants'

/**
 * Convert API data to React Flow nodes and edges
 */
export function buildNodesAndEdges(
  data: SystemMapData,
  filters: MapFilters
): { nodes: MapNode[]; edges: MapEdge[] } {
  const nodes: MapNode[] = []
  const edges: MapEdge[] = []

  // Filter regulations
  const filteredRegulations =
    filters.regulations.length > 0
      ? data.regulations.filter((r) => filters.regulations.includes(r.id))
      : data.regulations

  // Get regulation IDs for filtering articles
  const regIds = new Set(filteredRegulations.map((r) => r.id))

  // Filter articles by regulation
  const filteredArticles = data.articles.filter((a) => regIds.has(a.regulationId))

  // Get article IDs for filtering impacts
  const articleIds = new Set(filteredArticles.map((a) => a.id))

  // Filter impacts
  let filteredImpacts = data.impacts.filter((i) => articleIds.has(i.articleId))

  // Filter by impact level
  if (filters.impactLevels.length > 0) {
    filteredImpacts = filteredImpacts.filter((i) =>
      filters.impactLevels.includes(i.impactLevel)
    )
  }

  // Get system IDs that have impacts
  const systemIdsWithImpacts = new Set(filteredImpacts.map((i) => i.systemId))

  // Filter systems
  let filteredSystems = data.systems.filter((s) => systemIdsWithImpacts.has(s.id))

  // Filter by category
  if (filters.systemCategories.length > 0) {
    filteredSystems = filteredSystems.filter(
      (s) => s.category && filters.systemCategories.includes(s.category)
    )
  }

  // Apply search filter
  const searchLower = filters.searchQuery.toLowerCase()
  if (searchLower) {
    const matchedRegIds = new Set<string>()
    const matchedArticleIds = new Set<string>()
    const matchedSystemIds = new Set<string>()

    filteredRegulations.forEach((r) => {
      if (
        r.name.toLowerCase().includes(searchLower) ||
        r.framework.toLowerCase().includes(searchLower)
      ) {
        matchedRegIds.add(r.id)
      }
    })

    filteredArticles.forEach((a) => {
      if (
        a.articleNumber.toLowerCase().includes(searchLower) ||
        a.title?.toLowerCase().includes(searchLower)
      ) {
        matchedArticleIds.add(a.id)
        matchedRegIds.add(a.regulationId)
      }
    })

    filteredSystems.forEach((s) => {
      if (
        s.name.toLowerCase().includes(searchLower) ||
        s.category?.toLowerCase().includes(searchLower)
      ) {
        matchedSystemIds.add(s.id)
      }
    })

    // If no matches, show all
    if (
      matchedRegIds.size > 0 ||
      matchedArticleIds.size > 0 ||
      matchedSystemIds.size > 0
    ) {
      // Only filter if there are matches
      if (matchedRegIds.size > 0 || matchedArticleIds.size > 0) {
        // Keep regulations that match or have matching articles
      }
      if (matchedSystemIds.size > 0) {
        filteredSystems = filteredSystems.filter((s) => matchedSystemIds.has(s.id))
      }
    }
  }

  // Calculate positions
  const regYPositions = new Map<string, number>()
  let regY = LAYOUT_CONFIG.topPadding

  filteredRegulations.forEach((reg) => {
    regYPositions.set(reg.id, regY)

    nodes.push({
      id: `reg-${reg.id}`,
      type: 'regulation',
      position: { x: LAYOUT_CONFIG.columns.regulation, y: regY },
      data: {
        type: 'regulation',
        id: reg.id,
        name: reg.name,
        framework: reg.framework,
        articleCount: reg.articleCount,
        status: reg.status ?? 'active',
      },
    })

    // Calculate space for this regulation's articles
    const regArticles = filteredArticles.filter((a) => a.regulationId === reg.id)
    const regHeight = Math.max(
      80,
      regArticles.length * (LAYOUT_CONFIG.rowGap * 0.6)
    )
    regY += regHeight + LAYOUT_CONFIG.rowGap
  })

  // Add article nodes
  const articleYByReg = new Map<string, number>()
  filteredArticles.forEach((article) => {
    const regY = regYPositions.get(article.regulationId) ?? LAYOUT_CONFIG.topPadding
    const currentY = articleYByReg.get(article.regulationId) ?? regY
    articleYByReg.set(article.regulationId, currentY + LAYOUT_CONFIG.rowGap * 0.6)

    nodes.push({
      id: `art-${article.id}`,
      type: 'article',
      position: { x: LAYOUT_CONFIG.columns.article, y: currentY },
      data: {
        type: 'article',
        id: article.id,
        articleNumber: article.articleNumber,
        title: article.title,
        regulationId: article.regulationId,
        regulationName: article.regulationName,
        impactedSystemsCount: article.impactedSystemsCount,
      },
    })

    // Add hierarchy edge from regulation to article
    edges.push({
      id: `hier-${article.regulationId}-${article.id}`,
      source: `reg-${article.regulationId}`,
      target: `art-${article.id}`,
      type: 'hierarchy',
      data: { relationship: 'contains' },
    })
  })

  // Calculate system impact counts and max impact levels
  const systemImpactInfo = new Map<
    string,
    { count: number; maxLevel: 'critical' | 'high' | 'medium' | 'low' }
  >()

  filteredImpacts.forEach((impact) => {
    const current = systemImpactInfo.get(impact.systemId) ?? {
      count: 0,
      maxLevel: 'low' as const,
    }
    current.count++

    const levels = ['low', 'medium', 'high', 'critical'] as const
    if (
      levels.indexOf(impact.impactLevel) > levels.indexOf(current.maxLevel)
    ) {
      current.maxLevel = impact.impactLevel
    }

    systemImpactInfo.set(impact.systemId, current)
  })

  // Add system nodes
  let systemY = LAYOUT_CONFIG.topPadding
  filteredSystems.forEach((system) => {
    const impactInfo = systemImpactInfo.get(system.id)

    nodes.push({
      id: `sys-${system.id}`,
      type: 'system',
      position: { x: LAYOUT_CONFIG.columns.system, y: systemY },
      data: {
        type: 'system',
        id: system.id,
        name: system.name,
        category: system.category,
        criticality: system.criticality,
        impactLevel: impactInfo?.maxLevel ?? null,
        impactCount: impactInfo?.count ?? 0,
      },
    })

    systemY += LAYOUT_CONFIG.rowGap * 0.8
  })

  // Add impact edges
  filteredImpacts.forEach((impact) => {
    // Only add edge if system is in filtered list
    if (!filteredSystems.some((s) => s.id === impact.systemId)) return

    edges.push({
      id: `impact-${impact.articleId}-${impact.systemId}`,
      source: `art-${impact.articleId}`,
      target: `sys-${impact.systemId}`,
      type: 'impact',
      data: {
        impactLevel: impact.impactLevel,
        notes: impact.notes,
      },
    })
  })

  return { nodes, edges }
}

/**
 * Extract unique categories from systems
 */
export function extractCategories(systems: SystemMapData['systems']): string[] {
  const categories = new Set<string>()
  systems.forEach((s) => {
    if (s.category) categories.add(s.category)
  })
  return Array.from(categories).sort()
}

/**
 * Parse edge ID to extract article and system IDs
 */
export function parseImpactEdgeId(edgeId: string): {
  articleId: string
  systemId: string
} | null {
  const match = edgeId.match(/^impact-(.+)-(.+)$/)
  if (!match) return null

  // The edge ID format is impact-{articleId}-{systemId}
  // But both IDs might contain hyphens, so we need to be clever
  // We'll assume the systemId is the last segment after the last hyphen
  const parts = edgeId.replace('impact-', '').split('-')
  if (parts.length < 2) return null

  // Try to find the split point - system IDs are usually simpler
  // For now, assume format: impact-{articleId}-{systemId}
  const systemId = parts[parts.length - 1]
  const articleId = parts.slice(0, -1).join('-')

  return { articleId, systemId }
}

/**
 * Parse node ID to extract type and actual ID
 */
export function parseNodeId(nodeId: string): {
  type: 'regulation' | 'article' | 'system'
  id: string
} | null {
  if (nodeId.startsWith('reg-')) {
    return { type: 'regulation', id: nodeId.replace('reg-', '') }
  }
  if (nodeId.startsWith('art-')) {
    return { type: 'article', id: nodeId.replace('art-', '') }
  }
  if (nodeId.startsWith('sys-')) {
    return { type: 'system', id: nodeId.replace('sys-', '') }
  }
  return null
}

/**
 * Save node positions to localStorage
 */
export function savePositionsToStorage(
  orgId: string,
  positions: Array<{ nodeId: string; x: number; y: number }>
): void {
  try {
    localStorage.setItem(
      `cindral-map-positions-${orgId}`,
      JSON.stringify(positions)
    )
  } catch (e) {
    console.warn('Failed to save map positions:', e)
  }
}

/**
 * Load node positions from localStorage
 */
export function loadPositionsFromStorage(
  orgId: string
): Array<{ nodeId: string; x: number; y: number }> | null {
  try {
    const stored = localStorage.getItem(`cindral-map-positions-${orgId}`)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.warn('Failed to load map positions:', e)
  }
  return null
}

