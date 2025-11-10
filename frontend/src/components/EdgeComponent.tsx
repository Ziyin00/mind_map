import React from 'react'
import type { Edge, Node } from '../types'

interface EdgeComponentProps {
  edge: Edge
  sourceNode: Node | undefined
  targetNode: Node | undefined
}

export const EdgeComponent: React.FC<EdgeComponentProps> = ({
  edge,
  sourceNode,
  targetNode,
}) => {
  if (!sourceNode || !targetNode) return null

  const sourceX = sourceNode.x + sourceNode.width / 2
  const sourceY = sourceNode.y + sourceNode.height / 2
  const targetX = targetNode.x + targetNode.width / 2
  const targetY = targetNode.y + targetNode.height / 2

  // Calculate control points for smooth curve
  const dx = targetX - sourceX
  const dy = targetY - sourceY
  const curvature = 0.3
  const cp1x = sourceX + dx * curvature
  const cp1y = sourceY
  const cp2x = targetX - dx * curvature
  const cp2y = targetY

  // Create smooth bezier curve path
  const pathData = `M ${sourceX} ${sourceY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetX} ${targetY}`

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none edge-svg"
      style={{ width: '100%', height: '100%', zIndex: 1 }}
    >
      <defs>
        <marker
          id={`arrowhead-${edge.id}`}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3.5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon 
            points="0 0, 10 3.5, 0 7" 
            fill="#94a3b8"
            className="transition-all"
          />
        </marker>
        <linearGradient id={`edge-gradient-${edge.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#94a3b8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#64748b" stopOpacity="0.8" />
        </linearGradient>
        <filter id={`glow-${edge.id}`}>
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Shadow path for depth */}
      <path
        d={pathData}
        stroke="#e2e8f0"
        strokeWidth="3"
        fill="none"
        opacity="0.3"
        className="blur-[1.5px]"
      />
      
      {/* Main path with gradient */}
      <path
        d={pathData}
        stroke={`url(#edge-gradient-${edge.id})`}
        strokeWidth="2.5"
        fill="none"
        markerEnd={`url(#arrowhead-${edge.id})`}
        className="transition-all edge-path"
        style={{
          filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.08))',
        }}
      />
    </svg>
  )
}

