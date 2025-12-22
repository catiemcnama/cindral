'use client'

import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'
import { memo } from 'react'

import { IMPACT_COLORS } from '../constants'
import type { ImpactEdgeData } from '../types'

interface ImpactEdgeProps extends Omit<EdgeProps, 'data'> {
  data?: ImpactEdgeData
}

function ImpactEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: ImpactEdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const impactLevel = data?.impactLevel ?? 'medium'
  const strokeColor = IMPACT_COLORS[impactLevel].stroke
  const strokeWidth = selected ? 3 : impactLevel === 'critical' ? 2.5 : impactLevel === 'high' ? 2 : 1.5

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth,
          opacity: selected ? 1 : 0.7,
        }}
      />
      {selected && data?.notes && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan max-w-[200px] rounded-md bg-white px-2 py-1 text-xs shadow-lg"
          >
            {data.notes}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export const ImpactEdge = memo(ImpactEdgeComponent)
