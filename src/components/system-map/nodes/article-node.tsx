'use client'

import { Handle, Position } from '@xyflow/react'
import { FileTextIcon, ServerIcon } from 'lucide-react'
import { memo } from 'react'

import { cn } from '@/lib/utils'
import type { ArticleNodeData } from '../types'

interface ArticleNodeProps {
  data: ArticleNodeData
  selected?: boolean
}

function ArticleNodeComponent({ data, selected }: ArticleNodeProps) {
  return (
    <div
      className={cn(
        'group relative rounded-lg border-2 bg-gradient-to-br from-slate-50 to-gray-50 p-2.5 shadow-sm transition-all',
        'hover:shadow-md',
        selected ? 'border-slate-500 ring-2 ring-slate-200' : 'border-slate-200'
      )}
      style={{ minWidth: 180 }}
    >
      {/* Handle for incoming from regulation */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-2 !border-slate-400 !bg-slate-100"
      />

      {/* Header */}
      <div className="mb-1.5 flex items-center gap-2">
        <div className="rounded bg-slate-100 p-1">
          <FileTextIcon className="size-3.5 text-slate-600" />
        </div>
        <div className="flex-1 truncate">
          <div className="truncate text-xs font-medium text-slate-800">Art. {data.articleNumber}</div>
        </div>
      </div>

      {/* Title */}
      {data.title && (
        <div className="mb-1.5 line-clamp-2 text-xs text-slate-600" title={data.title}>
          {data.title}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <div className="truncate text-slate-500">{data.regulationName}</div>
        {data.impactedSystemsCount > 0 && (
          <div className="flex items-center gap-1 text-slate-600">
            <ServerIcon className="size-3" />
            <span>{data.impactedSystemsCount}</span>
          </div>
        )}
      </div>

      {/* Handle for outgoing to systems */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-2 !border-slate-400 !bg-slate-100"
      />
    </div>
  )
}

export const ArticleNode = memo(ArticleNodeComponent)
