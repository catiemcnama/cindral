'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { AlertTriangleIcon, ServerIcon, ShieldCheckIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { CRITICALITY_COLORS, IMPACT_COLORS } from '../constants'
import type { SystemNodeData } from '../types'

interface SystemNodeProps {
  data: SystemNodeData
  selected?: boolean
}

function SystemNodeComponent({ data, selected }: SystemNodeProps) {
  const criticalityClass =
    data.criticality && data.criticality in CRITICALITY_COLORS
      ? CRITICALITY_COLORS[data.criticality as keyof typeof CRITICALITY_COLORS]
      : 'bg-gray-100 border-gray-300 text-gray-800'

  const impactColor = data.impactLevel ? IMPACT_COLORS[data.impactLevel] : null

  return (
    <div
      className={cn(
        'group relative rounded-lg border-2 p-2.5 shadow-sm transition-all',
        'hover:shadow-md',
        impactColor ? impactColor.light : 'bg-white',
        selected ? 'ring-2 ring-blue-300' : '',
        impactColor ? impactColor.border : 'border-gray-200'
      )}
      style={{ minWidth: 160 }}
    >
      {/* Handle for incoming from articles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-2 !border-gray-400 !bg-gray-100"
      />

      {/* Header */}
      <div className="mb-1.5 flex items-center gap-2">
        <div className={cn('rounded p-1', criticalityClass)}>
          <ServerIcon className="size-3.5" />
        </div>
        <div className="flex-1 truncate">
          <div className="truncate text-xs font-medium text-gray-800">{data.name}</div>
        </div>
      </div>

      {/* Category */}
      {data.category && <div className="mb-1.5 truncate text-xs text-gray-500">{data.category}</div>}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        {data.criticality && (
          <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium capitalize', criticalityClass)}>
            {data.criticality}
          </span>
        )}
        {data.impactLevel && (
          <div className={cn('flex items-center gap-1', impactColor?.text)}>
            {data.impactLevel === 'critical' ? (
              <AlertTriangleIcon className="size-3" />
            ) : (
              <ShieldCheckIcon className="size-3" />
            )}
            <span className="capitalize">{data.impactLevel}</span>
          </div>
        )}
      </div>

      {/* Impact count badge */}
      {data.impactCount > 0 && (
        <div className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
          {data.impactCount}
        </div>
      )}
    </div>
  )
}

export const SystemNode = memo(SystemNodeComponent)
