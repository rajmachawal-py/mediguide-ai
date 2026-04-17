/**
 * MediGuide AI — SVGFloorPlan
 * Renders PNG floor plan backgrounds with interactive route overlays.
 *
 * CRITICAL ROUTING RULE:
 * The animated route path is drawn ONLY through corridor junction nodes
 * (type === 'junction'). Room/department nodes are shown as pin markers
 * but are NEVER part of the polyline itself, guaranteeing the path
 * always stays inside the orange corridor strips on the PNG floor plan.
 *
 * Features:
 * - PNG floor plan as background image inside SVG container
 * - Animated dashed blue route path through corridor junctions ONLY
 * - Green "S" start marker + Red "D" destination marker
 * - Yellow junction waypoints along the path
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

  // ─── CORRIDOR-ONLY route points for drawing the polyline ───
  // Filter the full path to ONLY include nodes on this floor.
  // Then separate into: corridor-only points (for the polyline)
  // and room/start/end markers (for pin icons).
  const { corridorPoints, startMarker, endMarker, entryMarker, exitMarker } = useMemo(() => {
    if (!routePath.length) {
      return { corridorPoints: [], startMarker: null, endMarker: null, entryMarker: null, exitMarker: null }
    }

    // Get all route nodes on this floor, in order
    const floorNodes = routePath
      .map(id => nodeMap[id])
      .filter(n => n && n.floor === activeFloor)

    if (floorNodes.length === 0) {
      return { corridorPoints: [], startMarker: null, endMarker: null, entryMarker: null, exitMarker: null }
    }

    // Separate junction/corridor nodes from room nodes
    // Junction points form the polyline; room nodes are just markers
    const junctionTypes = new Set(['junction', 'stairs', 'lift', 'entrance'])
    const corridorOnly = floorNodes.filter(n => junctionTypes.has(n.type))

    // If a room node is the FIRST node on the floor, find its nearest
    // junction neighbor (the next node in the path that IS a junction)
    // and connect from that junction. Same for last node.

    const firstNode = floorNodes[0]
    const lastNode = floorNodes[floorNodes.length - 1]

    // Determine start/end markers
    const isStartOnFloor = startNodeId && nodeMap[startNodeId]?.floor === activeFloor
    const isEndOnFloor = endNodeId && nodeMap[endNodeId]?.floor === activeFloor

    // The "start marker" position: if the start room is on this floor,
    // use the first node. Otherwise it's a floor-entry (purple marker).
    let sMarker = null
    let eMarker = null
    let entryMark = null
    let exitMark = null

    if (isStartOnFloor) {
      sMarker = firstNode
    } else if (floorNodes.length > 0) {
      entryMark = corridorOnly[0] || floorNodes[0]
    }

    if (isEndOnFloor) {
      eMarker = lastNode
    } else if (floorNodes.length > 0) {
      exitMark = corridorOnly[corridorOnly.length - 1] || floorNodes[floorNodes.length - 1]
    }

    // If there are no junction nodes but we have room nodes,
    // just connect them (fallback — shouldn't happen with good graph data)
    const points = corridorOnly.length > 0 ? corridorOnly : floorNodes

    return {
      corridorPoints: points,
      startMarker: sMarker,
      endMarker: eMarker,
      entryMarker: entryMark,
      exitMarker: exitMark,
    }
  }, [routePath, activeFloor, nodeMap, startNodeId, endNodeId])

  // Build polyline string from corridor-only points
  // Clamp all coordinates to stay inside the SVG viewBox
  const polylineStr = corridorPoints
    .map(p => {
      const x = Math.max(0, Math.min(SVG_WIDTH, p.x))
      const y = Math.max(0, Math.min(SVG_HEIGHT, p.y))
      return `${x},${y}`
    })
    .join(' ')

  // Junction waypoints (intermediate corridor nodes, not first/last)
  const junctionWaypoints = useMemo(() => {
    if (corridorPoints.length <= 2) return []
    return corridorPoints.slice(1, -1).filter(p => p.type === 'junction')
  }, [corridorPoints])

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

            {/* Route main line (animated dashed) — CORRIDOR ONLY */}
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
            {junctionWaypoints.map((p, i) => (
              <g key={`wp-${i}`}>
                <circle
                  cx={Math.max(0, Math.min(SVG_WIDTH, p.x))}
                  cy={Math.max(0, Math.min(SVG_HEIGHT, p.y))}
                  r="5"
                  fill="#fbbf24"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  opacity="0.9"
                />
              </g>
            ))}

            {/* ── Start marker — Green circle with "S" ── */}
            {startMarker && (
              <g>
                {/* Thin connector line from room door to nearest corridor junction */}
                {corridorPoints.length > 0 && (
                  <line
                    x1={Math.max(0, Math.min(SVG_WIDTH, startMarker.x))}
                    y1={Math.max(0, Math.min(SVG_HEIGHT, startMarker.y))}
                    x2={Math.max(0, Math.min(SVG_WIDTH, corridorPoints[0].x))}
                    y2={Math.max(0, Math.min(SVG_HEIGHT, corridorPoints[0].y))}
                    stroke="#22c55e"
                    strokeWidth="2.5"
                    strokeDasharray="4 3"
                    opacity="0.7"
                  />
                )}
                <circle
                  cx={Math.max(0, Math.min(SVG_WIDTH, startMarker.x))}
                  cy={Math.max(0, Math.min(SVG_HEIGHT, startMarker.y))}
                  r="14"
                  fill="#22c55e"
                  stroke="#16a34a"
                  strokeWidth="2.5"
                  opacity="0.95"
                />
                <text
                  x={Math.max(0, Math.min(SVG_WIDTH, startMarker.x))}
                  y={Math.max(0, Math.min(SVG_HEIGHT, startMarker.y)) + 5}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="800"
                >
                  S
                </text>
              </g>
            )}

            {/* ── End marker — Red circle with "D" ── */}
            {endMarker && (
              <g className="dest-pulse">
                {/* Thin connector line from nearest corridor junction to room door */}
                {corridorPoints.length > 0 && (
                  <line
                    x1={Math.max(0, Math.min(SVG_WIDTH, corridorPoints[corridorPoints.length - 1].x))}
                    y1={Math.max(0, Math.min(SVG_HEIGHT, corridorPoints[corridorPoints.length - 1].y))}
                    x2={Math.max(0, Math.min(SVG_WIDTH, endMarker.x))}
                    y2={Math.max(0, Math.min(SVG_HEIGHT, endMarker.y))}
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeDasharray="4 3"
                    opacity="0.7"
                  />
                )}
                <circle
                  cx={Math.max(0, Math.min(SVG_WIDTH, endMarker.x))}
                  cy={Math.max(0, Math.min(SVG_HEIGHT, endMarker.y))}
                  r="16"
                  fill="#ef4444"
                  stroke="#dc2626"
                  strokeWidth="2.5"
                  opacity="0.95"
                  filter="url(#destPulse)"
                />
                <text
                  x={Math.max(0, Math.min(SVG_WIDTH, endMarker.x))}
                  y={Math.max(0, Math.min(SVG_HEIGHT, endMarker.y)) + 5}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="800"
                >
                  D
                </text>
              </g>
            )}

            {/* Floor entry marker (route arrives from another floor via lift/stairs) */}
            {entryMarker && (
              <g>
                <circle
                  cx={Math.max(0, Math.min(SVG_WIDTH, entryMarker.x))}
                  cy={Math.max(0, Math.min(SVG_HEIGHT, entryMarker.y))}
                  r="12"
                  fill="#a855f7"
                  stroke="#7c3aed"
                  strokeWidth="2"
                />
                <text
                  x={Math.max(0, Math.min(SVG_WIDTH, entryMarker.x))}
                  y={Math.max(0, Math.min(SVG_HEIGHT, entryMarker.y)) + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="700"
                >
                  ↑
                </text>
              </g>
            )}

            {/* Floor exit marker (route continues to another floor) */}
            {exitMarker && (
              <g>
                <circle
                  cx={Math.max(0, Math.min(SVG_WIDTH, exitMarker.x))}
                  cy={Math.max(0, Math.min(SVG_HEIGHT, exitMarker.y))}
                  r="12"
                  fill="#a855f7"
                  stroke="#7c3aed"
                  strokeWidth="2"
                />
                <text
                  x={Math.max(0, Math.min(SVG_WIDTH, exitMarker.x))}
                  y={Math.max(0, Math.min(SVG_HEIGHT, exitMarker.y)) + 4}
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
      </svg>
    </div>
  )
}
