'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type OnNodesChange,
  type NodeMouseHandler,
  type EdgeMouseHandler,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useRouter } from 'next/navigation'
import { toPng, toSvg } from 'html-to-image'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useTRPC, useTRPCClient } from '@/trpc/client'

import { nodeTypes } from './nodes'
import { edgeTypes } from './edges'
import { SystemMapToolbar } from './toolbar'
import { IMPACT_COLORS } from './constants'
import {
  buildNodesAndEdges,
  extractCategories,
  loadPositionsFromStorage,
  parseImpactEdgeId,
  parseNodeId,
  savePositionsToStorage,
} from './utils'
import type { ImpactEdgeData, MapEdge, MapFilters, MapNode } from './types'
import { AddSystemDialog } from './dialogs/add-system-dialog'
import { ConnectDialog } from './dialogs/connect-dialog'
import { ImpactLevelDialog } from './dialogs/impact-level-dialog'

interface SystemMapProps {
  organizationId: string
}

export function SystemMap({ organizationId }: SystemMapProps) {
  const router = useRouter()
  const trpc = useTRPC()
  const trpcClient = useTRPCClient()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { fitView, zoomIn, zoomOut, getNodes } = useReactFlow()

  // Data fetching
  const { data, isLoading, refetch } = useQuery(trpc.systemMap.getData.queryOptions())

  // State
  const [nodes, setNodes, onNodesChange] = useNodesState<MapNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<MapEdge>([])
  const [filters, setFilters] = useState<MapFilters>({
    regulations: [],
    impactLevels: [],
    systemCategories: [],
    searchQuery: '',
  })

  // Dialog states
  const [addSystemOpen, setAddSystemOpen] = useState(false)
  const [connectDialog, setConnectDialog] = useState<{
    open: boolean
    fromNodeId: string | null
    fromType: 'article' | 'system' | null
  }>({ open: false, fromNodeId: null, fromType: null })
  const [impactLevelDialog, setImpactLevelDialog] = useState<{
    open: boolean
    edgeId: string | null
    articleId: string | null
    systemId: string | null
    currentLevel: 'critical' | 'high' | 'medium' | 'low' | null
  }>({ open: false, edgeId: null, articleId: null, systemId: null, currentLevel: null })

  // Mutations
  const deleteImpact = useMutation({
    mutationFn: (input: { articleId: string; systemId: string }) =>
      trpcClient.systemMap.deleteImpact.mutate(input),
    onSuccess: () => {
      toast.success('Connection removed')
      refetch()
    },
    onError: (err: Error) => {
      toast.error('Failed to remove connection', { description: err.message })
    },
  })

  // Derived data
  const categories = useMemo(() => (data ? extractCategories(data.systems) : []), [data])
  const regulations = useMemo(
    () => (data?.regulations ?? []).map((r: { id: string; name: string }) => ({ id: r.id, name: r.name })),
    [data]
  )

  // Build nodes and edges when data or filters change
  useEffect(() => {
    if (!data) return

    const { nodes: newNodes, edges: newEdges } = buildNodesAndEdges(data, filters)

    // Try to restore positions from localStorage
    const savedPositions = loadPositionsFromStorage(organizationId)
    if (savedPositions) {
      const posMap = new Map(savedPositions.map((p) => [p.nodeId, { x: p.x, y: p.y }]))
      newNodes.forEach((node) => {
        const savedPos = posMap.get(node.id)
        if (savedPos) {
          node.position = savedPos
        }
      })
    }

    setNodes(newNodes)
    setEdges(newEdges)
  }, [data, filters, organizationId, setNodes, setEdges])

  // Fit view on initial load
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => fitView({ padding: 0.2 }), 100)
    }
  }, [nodes.length, fitView])

  // Save positions on node drag
  const handleNodesChange: OnNodesChange<MapNode> = useCallback(
    (changes) => {
      onNodesChange(changes)

      // Save positions on drag end
      const hasDragEnd = changes.some(
        (c) => c.type === 'position' && c.dragging === false
      )
      if (hasDragEnd) {
        const currentNodes = getNodes()
        const positions = currentNodes.map((n) => ({
          nodeId: n.id,
          x: n.position.x,
          y: n.position.y,
        }))
        savePositionsToStorage(organizationId, positions)
      }
    },
    [onNodesChange, getNodes, organizationId]
  )

  // Node double-click handler
  const handleNodeDoubleClick: NodeMouseHandler<MapNode> = useCallback(
    (_, node) => {
      const parsed = parseNodeId(node.id)
      if (!parsed) return

      switch (parsed.type) {
        case 'regulation':
          router.push(`/dashboard/regulations/${parsed.id}`)
          break
        case 'article':
          // Navigate to regulation with article highlighted
          const articleData = node.data
          if (articleData.type === 'article') {
            router.push(`/dashboard/regulations/${articleData.regulationId}?article=${parsed.id}`)
          }
          break
        case 'system':
          // Could navigate to system detail page if it exists
          toast.info(`System: ${node.data.type === 'system' ? node.data.name : ''}`)
          break
      }
    },
    [router]
  )

  // Edge click handler for editing
  const handleEdgeClick: EdgeMouseHandler<MapEdge> = useCallback(
    (_, edge) => {
      const parsed = parseImpactEdgeId(edge.id)
      if (!parsed) return

      const edgeData = edge.data as ImpactEdgeData | undefined
      if (edgeData && 'impactLevel' in edgeData) {
        setImpactLevelDialog({
          open: true,
          edgeId: edge.id,
          articleId: parsed.articleId,
          systemId: parsed.systemId,
          currentLevel: edgeData.impactLevel,
        })
      }
    },
    []
  )

  const handleDeleteConnection = useCallback(
    (edgeId: string) => {
      const parsed = parseImpactEdgeId(edgeId)
      if (!parsed) return

      deleteImpact.mutate({
        articleId: parsed.articleId,
        systemId: parsed.systemId,
      })
    },
    [deleteImpact]
  )

  // Toolbar actions
  const handleAutoLayout = useCallback(() => {
    if (!data) return

    // Clear saved positions and rebuild
    localStorage.removeItem(`cindral-map-positions-${organizationId}`)
    const { nodes: newNodes, edges: newEdges } = buildNodesAndEdges(data, filters)
    setNodes(newNodes)
    setEdges(newEdges)
    setTimeout(() => fitView({ padding: 0.2 }), 100)
  }, [data, filters, organizationId, setNodes, setEdges, fitView])

  const handleExport = useCallback(
    async (format: 'png' | 'svg') => {
      if (!reactFlowWrapper.current) return

      const viewport = reactFlowWrapper.current.querySelector('.react-flow__viewport')
      if (!viewport) return

      try {
        let dataUrl: string
        if (format === 'png') {
          dataUrl = await toPng(viewport as HTMLElement, {
            backgroundColor: '#fff',
            quality: 1,
          })
        } else {
          dataUrl = await toSvg(viewport as HTMLElement, {
            backgroundColor: '#fff',
          })
        }

        // Download
        const link = document.createElement('a')
        link.download = `system-map.${format}`
        link.href = dataUrl
        link.click()

        toast.success(`Exported as ${format.toUpperCase()}`)
      } catch {
        toast.error('Export failed')
      }
    },
    []
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-2 size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading system map...</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={reactFlowWrapper} className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDoubleClick={handleNodeDoubleClick}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          animated: false,
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'regulation') return '#6366f1'
            if (node.type === 'article') return '#64748b'
            if (node.type === 'system') {
              const data = node.data as { impactLevel?: string }
              if (data.impactLevel && data.impactLevel in IMPACT_COLORS) {
                return IMPACT_COLORS[data.impactLevel as keyof typeof IMPACT_COLORS].stroke
              }
              return '#94a3b8'
            }
            return '#94a3b8'
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="!bg-white/80"
        />

        <Panel position="top-left" className="!m-2">
          <SystemMapToolbar
            filters={filters}
            onFiltersChange={setFilters}
            regulations={regulations}
            categories={categories}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onFitView={() => fitView({ padding: 0.2 })}
            onAutoLayout={handleAutoLayout}
            onExport={handleExport}
            onRefresh={() => refetch()}
            isLoading={isLoading}
          />
        </Panel>

        {/* Legend */}
        <Panel position="bottom-left" className="!m-2">
          <div className="rounded-lg border bg-white/80 px-3 py-2 text-xs backdrop-blur-sm">
            <div className="mb-1 font-medium">Impact Level</div>
            <div className="flex gap-3">
              {(['critical', 'high', 'medium', 'low'] as const).map((level) => (
                <div key={level} className="flex items-center gap-1">
                  <div
                    className="size-3 rounded-full"
                    style={{ backgroundColor: IMPACT_COLORS[level].stroke }}
                  />
                  <span className="capitalize">{level}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </ReactFlow>

      {/* Dialogs */}
      <AddSystemDialog
        open={addSystemOpen}
        onOpenChange={setAddSystemOpen}
        onSuccess={() => {
          refetch()
          toast.success('System added')
        }}
      />

      <ConnectDialog
        open={connectDialog.open}
        onOpenChange={(open) =>
          setConnectDialog({ open, fromNodeId: null, fromType: null })
        }
        fromNodeId={connectDialog.fromNodeId}
        fromType={connectDialog.fromType}
        articles={data?.articles ?? []}
        systems={data?.systems ?? []}
        onSuccess={() => {
          refetch()
          toast.success('Connection created')
        }}
      />

      <ImpactLevelDialog
        open={impactLevelDialog.open}
        onOpenChange={(open) =>
          setImpactLevelDialog({
            open,
            edgeId: null,
            articleId: null,
            systemId: null,
            currentLevel: null,
          })
        }
        articleId={impactLevelDialog.articleId}
        systemId={impactLevelDialog.systemId}
        currentLevel={impactLevelDialog.currentLevel}
        onSuccess={() => {
          refetch()
          toast.success('Impact level updated')
        }}
        onDelete={() => {
          if (impactLevelDialog.edgeId) {
            handleDeleteConnection(impactLevelDialog.edgeId)
          }
        }}
      />
    </div>
  )
}
