import type { Node, Edge } from '@xyflow/react'

// =============================================================================
// Node Types
// =============================================================================

export interface RegulationNodeData extends Record<string, unknown> {
  type: 'regulation'
  id: string
  name: string
  framework: string
  articleCount: number
  status: 'active' | 'superseded' | 'draft'
}

export interface ArticleNodeData extends Record<string, unknown> {
  type: 'article'
  id: string
  articleNumber: string
  title: string | null
  regulationId: string
  regulationName: string
  impactedSystemsCount: number
}

export interface SystemNodeData extends Record<string, unknown> {
  type: 'system'
  id: string
  name: string
  category: string | null
  criticality: 'critical' | 'high' | 'medium' | 'low' | 'info' | null
  impactLevel: 'critical' | 'high' | 'medium' | 'low' | null
  impactCount: number
}

export type MapNodeData = RegulationNodeData | ArticleNodeData | SystemNodeData

export type MapNode = Node<MapNodeData>

// =============================================================================
// Edge Types
// =============================================================================

export interface ImpactEdgeData extends Record<string, unknown> {
  impactLevel: 'critical' | 'high' | 'medium' | 'low'
  notes?: string | null
}

export interface HierarchyEdgeData extends Record<string, unknown> {
  relationship: 'contains'
}

export type MapEdgeData = ImpactEdgeData | HierarchyEdgeData

export type MapEdge = Edge<MapEdgeData>

// =============================================================================
// Map State
// =============================================================================

export interface MapFilters {
  regulations: string[]
  impactLevels: ('critical' | 'high' | 'medium' | 'low')[]
  systemCategories: string[]
  searchQuery: string
}

export interface NodePosition {
  nodeId: string
  x: number
  y: number
}

export interface MapLayout {
  positions: NodePosition[]
  updatedAt: Date
}

// =============================================================================
// API Types
// =============================================================================

export interface SystemMapData {
  regulations: Array<{
    id: string
    name: string
    framework: string
    status: 'active' | 'superseded' | 'draft' | null
    articleCount: number
  }>
  articles: Array<{
    id: string
    articleNumber: string
    title: string | null
    regulationId: string
    regulationName: string
    impactedSystemsCount: number
  }>
  systems: Array<{
    id: string
    name: string
    category: string | null
    criticality: 'critical' | 'high' | 'medium' | 'low' | 'info' | null
  }>
  impacts: Array<{
    articleId: string
    systemId: string
    impactLevel: 'critical' | 'high' | 'medium' | 'low'
    notes: string | null
  }>
}

// =============================================================================
// Context Menu
// =============================================================================

export interface ContextMenuState {
  isOpen: boolean
  x: number
  y: number
  nodeId: string | null
  nodeType: 'regulation' | 'article' | 'system' | null
  edgeId: string | null
}

