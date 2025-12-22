'use client'

import { memo } from 'react'
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react'

function HierarchyEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        stroke: selected ? '#6366f1' : '#94a3b8',
        strokeWidth: selected ? 2 : 1.5,
        strokeDasharray: '5,5',
        opacity: selected ? 1 : 0.5,
      }}
    />
  )
}

export const HierarchyEdge = memo(HierarchyEdgeComponent)
