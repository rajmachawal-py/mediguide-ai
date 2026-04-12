/**
 * MediGuide AI — SVGFloorPlan
 * Renders the indoor hospital map as an interactive SVG with:
 * - Department nodes (tappable to set destination)
 * - Waypoint/lift/stairs/entrance nodes
 * - Animated route path overlay when a route is active
 * - Floor filtering (only shows nodes on the active floor)
 */

import { useMemo } from 'react'
import { FiNavigation, FiArrowUp } from 'react-icons/fi'

// Node type → visual configuration
const NODE_STYLES = {
  entrance:   { fill: '#22c55e', stroke: '#16a34a', radius: 10, emoji: '🚪' },
  department: { fill: '#2f8fff', stroke: '#1a6ff5', radius: 9,  emoji: '🏥' },
  lift:       { fill: '#a855f7', stroke: '#9333ea', radius: 7,  emoji: '🛗' },
  stairs:     { fill: '#f59e0b', stroke: '#d97706', radius: 7,  emoji: '🪜' },
  waypoint:   { fill: '#64748b', stroke: '#475569', radius: 5,  emoji: '' },
}

const SVG_WIDTH = 800
const SVG_HEIGHT = 500

export default function SVGFloorPlan({
  nodes = [],
  edges = [],
  routeSteps = [],
  activeFloor = 0,
  onNodeTap,
  selectedNodeId,
}) {
  // Filter nodes visible on active floor
  const floorNodes = useMemo(
    () => nodes.filter(n => n.floor_number === activeFloor),
    [nodes, activeFloor]
  )

  // Build a set of node IDs on this floor for edge filtering
  const floorNodeIds = useMemo(
    () => new Set(floorNodes.map(n => n.id)),
    [floorNodes]
  )

  // Edges where both ends are on the active floor
  const floorEdges = useMemo(
    () => edges.filter(e => floorNodeIds.has(e.from_node_id) && floorNodeIds.has(e.to_node_id)),
    [edges, floorNodeIds]
  )

  // Node lookup for positioning
  const nodeMap = useMemo(() => {
    const map = {}
    nodes.forEach(n => { map[n.id] = n })
    return map
  }, [nodes])

  // Build route path segments on this floor
  const routePathOnFloor = useMemo(() => {
    if (!routeSteps || routeSteps.length === 0) return []
    return routeSteps.filter(step => {
      const fromNode = nodeMap[step.from_node_id]
      const toNode = nodeMap[step.to_node_id]
      return fromNode && toNode &&
        fromNode.floor_number === activeFloor &&
        toNode.floor_number === activeFloor
    })
  }, [routeSteps, nodeMap, activeFloor])

  // Build SVG path string for route
  const routePathD = useMemo(() => {
    if (routePathOnFloor.length === 0) return ''
    const segments = []
    routePathOnFloor.forEach((step, i) => {
      const from = nodeMap[step.from_node_id]
      const to = nodeMap[step.to_node_id]
      if (!from || !to) return
      const fx = Number(from.x_pos) || 0
      const fy = Number(from.y_pos) || 0
      const tx = Number(to.x_pos) || 0
      const ty = Number(to.y_pos) || 0
      if (i === 0) segments.push(`M ${fx} ${fy}`)
      segments.push(`L ${tx} ${ty}`)
    })
    return segments.join(' ')
  }, [routePathOnFloor, nodeMap])

  const getNodeStyle = (node) => NODE_STYLES[node.node_type] || NODE_STYLES.waypoint

  return (
    <div className="w-full rounded-2xl bg-surface-900/80 border border-surface-700/40 overflow-hidden relative">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full h-auto"
        style={{ minHeight: '300px', maxHeight: '450px' }}
      >
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(51,65,85,0.2)" strokeWidth="0.5" />
          </pattern>
          {/* Route animation dash */}
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#2f8fff" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#grid)" />

        {/* Draw edges (walking paths) */}
        {floorEdges.map((edge) => {
          const from = nodeMap[edge.from_node_id]
          const to = nodeMap[edge.to_node_id]
          if (!from || !to) return null
          return (
            <line
              key={edge.id}
              x1={Number(from.x_pos) || 0}
              y1={Number(from.y_pos) || 0}
              x2={Number(to.x_pos) || 0}
              y2={Number(to.y_pos) || 0}
              stroke="rgba(100,116,139,0.3)"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
          )
        })}

        {/* Draw route path (animated) */}
        {routePathD && (
          <>
            {/* Glow background */}
            <path
              d={routePathD}
              fill="none"
              stroke="rgba(34,197,94,0.15)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Main route line */}
            <path
              d={routePathD}
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="12 6"
              className="animate-route-dash"
            />
          </>
        )}

        {/* Draw nodes */}
        {floorNodes.map((node) => {
          const style = getNodeStyle(node)
          const x = Number(node.x_pos) || 0
          const y = Number(node.y_pos) || 0
          const isSelected = selectedNodeId === node.id
          const isDepartment = node.node_type === 'department'
          const isEntrance = node.node_type === 'entrance'

          return (
            <g
              key={node.id}
              onClick={() => isDepartment && onNodeTap?.(node)}
              style={{ cursor: isDepartment ? 'pointer' : 'default' }}
            >
              {/* Selection ring */}
              {isSelected && (
                <circle
                  cx={x} cy={y}
                  r={style.radius + 6}
                  fill="none"
                  stroke="#2f8fff"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  opacity="0.7"
                  className="animate-pulse"
                />
              )}

              {/* Entrance pulse ring */}
              {isEntrance && (
                <circle
                  cx={x} cy={y}
                  r={style.radius + 4}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="1.5"
                  opacity="0.4"
                  className="animate-pulse"
                />
              )}

              {/* Node circle */}
              <circle
                cx={x} cy={y}
                r={style.radius}
                fill={isSelected ? '#2f8fff' : style.fill}
                stroke={isSelected ? '#56b0ff' : style.stroke}
                strokeWidth="2"
                opacity="0.9"
              />

              {/* Label */}
              <text
                x={x}
                y={y + style.radius + 14}
                textAnchor="middle"
                fill={isDepartment || isEntrance ? '#e2e8f0' : '#94a3b8'}
                fontSize={isDepartment || isEntrance ? '11' : '9'}
                fontWeight={isDepartment || isEntrance ? '600' : '400'}
                fontFamily="Inter, system-ui, sans-serif"
              >
                {node.label}
              </text>
            </g>
          )
        })}

        {/* "No nodes" message */}
        {floorNodes.length === 0 && (
          <text
            x={SVG_WIDTH / 2}
            y={SVG_HEIGHT / 2}
            textAnchor="middle"
            fill="#64748b"
            fontSize="14"
            fontFamily="Inter, system-ui, sans-serif"
          >
            No map data for this floor
          </text>
        )}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-surface-700/30">
        {Object.entries(NODE_STYLES)
          .filter(([type]) => type !== 'waypoint')
          .map(([type, style]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ background: style.fill }}
              />
              <span className="text-[10px] text-surface-400 capitalize">{type}</span>
            </div>
          ))
        }
      </div>
    </div>
  )
}
