/**
 * MediGuide AI — SVGFloorPlan
 * Renders PNG floor plan backgrounds with interactive route overlays.
 *
 * Features:
 * - PNG floor plan as background image inside SVG container
 * - Animated dashed blue route path along corridor nodes
 * - Green origin room highlight + red destination highlight
 * - Yellow junction waypoints along the path
 * - Green "S" start marker + Red "D" destination marker
 * - Cross-floor indicator when route continues on another floor
 */

import { useMemo } from 'react'
import { NODES, FLOOR_PLAN_IMAGES } from '../../data/navigationGraph'

const SVG_WIDTH = 1200
const SVG_HEIGHT = 830

export default function SVGFloorPlan({
  activeFloor = 0,
  routePath = [],      // Array of node IDs in the route
  startNodeId = null,
  endNodeId = null,
}) {
  // Get floor plan image
  const floorImage = FLOOR_PLAN_IMAGES[activeFloor]

  // Build node lookup
  const nodeMap = useMemo(() => {
    const map = {}
    NODES.forEach(n => { map[n.id] = n })
    return map
  }, [])

  // Get route points for this floor
  const routePoints = useMemo(() => {
    if (!routePath.length) return []
    return routePath
      .map(id => nodeMap[id])
      .filter(n => n && n.floor === activeFloor)
  }, [routePath, activeFloor, nodeMap])

  // Build polyline string
  const polylineStr = routePoints.map(p => `${p.x},${p.y}`).join(' ')

  // Junction waypoints (intermediate nodes, not start/end)
  const junctionPoints = useMemo(() => {
    if (routePoints.length <= 2) return []
    return routePoints.slice(1, -1).filter(p => p.type === 'junction')
  }, [routePoints])

  // Start/end nodes on this floor
  const startNode = startNodeId ? nodeMap[startNodeId] : null
  const endNode = endNodeId ? nodeMap[endNodeId] : null
  const showStart = startNode && startNode.floor === activeFloor
  const showEnd = endNode && endNode.floor === activeFloor

  // First/last route nodes on this floor (for S/D markers)
  const firstOnFloor = routePoints[0]
  const lastOnFloor = routePoints[routePoints.length - 1]

  return (
    <div className="relative rounded-clinical-lg overflow-hidden border border-outline-variant/40 bg-white shadow-clinical-md">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full h-auto"
        style={{ fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif" }}
      >
        <defs>
          {/* Glow filter for route line */}
          <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Pulse animation for destination */}
          <filter id="destPulse" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Animated route dash */}
          <style>{`
            @keyframes marchingAnts {
              to { stroke-dashoffset: -30; }
            }
            @keyframes pulse {
              0%, 100% { opacity: 0.7; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.15); }
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .route-line {
              animation: marchingAnts 0.8s linear infinite;
            }
            .dest-pulse {
              animation: pulse 1.5s ease-in-out infinite;
              transform-origin: center;
            }
            .route-overlay {
              animation: fadeIn 0.5s ease-out;
            }
          `}</style>
        </defs>

        {/* ── PNG Floor Plan Background ── */}
        <image
          href={floorImage}
          x="0"
          y="0"
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          preserveAspectRatio="xMidYMid meet"
        />

        {/* ── Route Path Overlay ── */}
        {polylineStr && (
          <g className="route-overlay">
            {/* Route glow background */}
            <polyline
              points={polylineStr}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.2"
              filter="url(#routeGlow)"
            />

            {/* Route main line (animated dashed) */}
            <polyline
              points={polylineStr}
              fill="none"
              stroke="#2563eb"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="12 6"
              className="route-line"
            />

            {/* Junction waypoints — yellow circles */}
            {junctionPoints.map((p, i) => (
              <g key={`wp-${i}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill="#fbbf24"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  opacity="0.9"
                />
              </g>
            ))}

            {/* Start marker — Green circle with S */}
            {showStart && firstOnFloor && (
              <g>
                <circle
                  cx={firstOnFloor.x}
                  cy={firstOnFloor.y}
                  r="14"
                  fill="#22c55e"
                  stroke="#16a34a"
                  strokeWidth="2.5"
                  opacity="0.95"
                />
                <text
                  x={firstOnFloor.x}
                  y={firstOnFloor.y + 5}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="800"
                >
                  S
                </text>
              </g>
            )}

            {/* End marker — Red circle with D */}
            {showEnd && lastOnFloor && (
              <g className="dest-pulse">
                <circle
                  cx={lastOnFloor.x}
                  cy={lastOnFloor.y}
                  r="16"
                  fill="#ef4444"
                  stroke="#dc2626"
                  strokeWidth="2.5"
                  opacity="0.95"
                  filter="url(#destPulse)"
                />
                <text
                  x={lastOnFloor.x}
                  y={lastOnFloor.y + 5}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="800"
                >
                  D
                </text>
              </g>
            )}

            {/* Floor entry marker (when route comes from another floor) */}
            {!showStart && firstOnFloor && (
              <g>
                <circle
                  cx={firstOnFloor.x}
                  cy={firstOnFloor.y}
                  r="12"
                  fill="#a855f7"
                  stroke="#7c3aed"
                  strokeWidth="2"
                />
                <text
                  x={firstOnFloor.x}
                  y={firstOnFloor.y + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="700"
                >
                  ↑
                </text>
              </g>
            )}

            {/* Floor exit marker (when route continues to another floor) */}
            {!showEnd && lastOnFloor && (
              <g>
                <circle
                  cx={lastOnFloor.x}
                  cy={lastOnFloor.y}
                  r="12"
                  fill="#a855f7"
                  stroke="#7c3aed"
                  strokeWidth="2"
                />
                <text
                  x={lastOnFloor.x}
                  y={lastOnFloor.y + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="700"
                >
                  ↓
                </text>
              </g>
            )}
          </g>
        )}

        {/* No route: show floor title */}
        {!polylineStr && (
          <g opacity="0">
            {/* Invisible — floor plan PNG has its own title */}
          </g>
        )}
      </svg>
    </div>
  )
}
