'use client'

import { useCallback } from 'react'
import {
  EyeIcon,
  LinkIcon,
  PencilIcon,
  ServerIcon,
  UnlinkIcon,
} from 'lucide-react'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu'
import { cn } from '@/lib/utils'

import { IMPACT_COLORS } from './constants'
import type { ContextMenuState } from './types'

interface SystemMapContextMenuProps {
  state: ContextMenuState
  onClose: () => void
  onViewDetails: (nodeId: string, nodeType: 'regulation' | 'article' | 'system') => void
  onCreateConnection: (fromNodeId: string) => void
  onDeleteConnection: (edgeId: string) => void
  onChangeImpactLevel: (
    edgeId: string,
    level: 'critical' | 'high' | 'medium' | 'low'
  ) => void
  onAddSystem: () => void
  children: React.ReactNode
}

export function SystemMapContextMenu({
  state,
  onClose,
  onViewDetails,
  onCreateConnection,
  onDeleteConnection,
  onChangeImpactLevel,
  onAddSystem,
  children,
}: SystemMapContextMenuProps) {
  const handleViewDetails = useCallback(() => {
    if (state.nodeId && state.nodeType) {
      onViewDetails(state.nodeId, state.nodeType)
    }
    onClose()
  }, [state.nodeId, state.nodeType, onViewDetails, onClose])

  const handleCreateConnection = useCallback(() => {
    if (state.nodeId) {
      onCreateConnection(state.nodeId)
    }
    onClose()
  }, [state.nodeId, onCreateConnection, onClose])

  const handleDeleteConnection = useCallback(() => {
    if (state.edgeId) {
      onDeleteConnection(state.edgeId)
    }
    onClose()
  }, [state.edgeId, onDeleteConnection, onClose])

  const handleChangeLevel = useCallback(
    (level: 'critical' | 'high' | 'medium' | 'low') => {
      if (state.edgeId) {
        onChangeImpactLevel(state.edgeId, level)
      }
      onClose()
    },
    [state.edgeId, onChangeImpactLevel, onClose]
  )

  return (
    <ContextMenu>
      {children}
      <ContextMenuContent className="w-48">
        {/* Node actions */}
        {state.nodeId && state.nodeType && (
          <>
            <ContextMenuItem onClick={handleViewDetails}>
              <EyeIcon className="mr-2 size-4" />
              View Details
            </ContextMenuItem>

            {state.nodeType === 'article' && (
              <ContextMenuItem onClick={handleCreateConnection}>
                <LinkIcon className="mr-2 size-4" />
                Connect to System
              </ContextMenuItem>
            )}

            {state.nodeType === 'system' && (
              <ContextMenuItem onClick={handleCreateConnection}>
                <LinkIcon className="mr-2 size-4" />
                Connect to Article
              </ContextMenuItem>
            )}

            <ContextMenuSeparator />
          </>
        )}

        {/* Edge actions */}
        {state.edgeId && (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <PencilIcon className="mr-2 size-4" />
                Change Impact Level
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {(['critical', 'high', 'medium', 'low'] as const).map((level) => (
                  <ContextMenuItem
                    key={level}
                    onClick={() => handleChangeLevel(level)}
                  >
                    <span
                      className={cn(
                        'mr-2 size-3 rounded-full',
                        IMPACT_COLORS[level].bg
                      )}
                    />
                    <span className="capitalize">{level}</span>
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuItem
              onClick={handleDeleteConnection}
              className="text-destructive focus:text-destructive"
            >
              <UnlinkIcon className="mr-2 size-4" />
              Remove Connection
            </ContextMenuItem>

            <ContextMenuSeparator />
          </>
        )}

        {/* General actions */}
        <ContextMenuItem onClick={onAddSystem}>
          <ServerIcon className="mr-2 size-4" />
          Add New System
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

