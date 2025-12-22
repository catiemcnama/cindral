'use client'

import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { BookOpenIcon, CheckCircle2Icon, ClockIcon, FileTextIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { RegulationNodeData } from '../types'

const statusConfig = {
  active: { icon: CheckCircle2Icon, color: 'text-green-500', label: 'Active' },
  superseded: { icon: ClockIcon, color: 'text-amber-500', label: 'Superseded' },
  draft: { icon: FileTextIcon, color: 'text-gray-500', label: 'Draft' },
}

interface RegulationNodeProps {
  data: RegulationNodeData
  selected?: boolean
}

function RegulationNodeComponent({ data, selected }: RegulationNodeProps) {
  const status = statusConfig[data.status] || statusConfig.active
  const StatusIcon = status.icon

  return (
    <div
      className={cn(
        'group relative rounded-lg border-2 bg-gradient-to-br from-indigo-50 to-purple-50 p-3 shadow-md transition-all',
        'hover:shadow-lg',
        selected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-indigo-200'
      )}
      style={{ minWidth: 200 }}
    >
      {/* Header */}
      <div className="mb-2 flex items-center gap-2">
        <div className="rounded-md bg-indigo-100 p-1.5">
          <BookOpenIcon className="size-4 text-indigo-600" />
        </div>
        <div className="flex-1 truncate">
          <div className="truncate text-sm font-semibold text-indigo-900">{data.name}</div>
          <div className="text-xs text-indigo-600">{data.framework}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-gray-600">
          <FileTextIcon className="size-3" />
          <span>{data.articleCount} articles</span>
        </div>
        <div className={cn('flex items-center gap-1', status.color)}>
          <StatusIcon className="size-3" />
          <span>{status.label}</span>
        </div>
      </div>

      {/* Handle for outgoing connections to articles */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-indigo-400 !bg-indigo-100"
      />
    </div>
  )
}

export const RegulationNode = memo(RegulationNodeComponent)
