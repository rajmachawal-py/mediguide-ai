/**
 * MediGuide AI — SVGFloorPlan
 * Renders professional hospital floor plan SVGs for Ruby Hall Clinic.
 *
 * Features:
 * - Embeds the actual SVG floor plan artwork per floor
 * - Overlays clickable department hotspots
 * - Shows animated route path (glowing blue line)
 * - Highlights selected and destination nodes
 * - Pinch-zoom / scroll supported (via viewBox)
 */

import { useMemo } from 'react'

// Node type → color mapping for hotspot highlights
const NODE_COLORS = {
  entrance:   { fill: '#22c55e', stroke: '#16a34a', glow: '#22c55e' },
  department: { fill: '#3b82f6', stroke: '#2563eb', glow: '#3b82f6' },
  lift:       { fill: '#a855f7', stroke: '#7c3aed', glow: '#a855f7' },
  stairs:     { fill: '#6b7280', stroke: '#4b5563', glow: '#6b7280' },
  waypoint:   { fill: '#64748b', stroke: '#475569', glow: '#64748b' },
}

export default function SVGFloorPlan({
  nodes = [],
  edges = [],
  routeSteps = [],
  activeFloor = 0,
  onNodeTap,
  selectedNodeId,
}) {
  // Filter nodes & edges for active floor
  const floorNodes = useMemo(
    () => nodes.filter(n => n.floor_number === activeFloor),
    [nodes, activeFloor]
  )

  // Build route path points for this floor
  const routePathPoints = useMemo(() => {
    if (!routeSteps.length) return []

    const nodeMap = {}
    nodes.forEach(n => { nodeMap[n.id] = n })

    const points = []
    routeSteps.forEach(step => {
      if (step.floor === activeFloor) {
        const fromNode = nodeMap[step.from_node_id]
        const toNode = nodeMap[step.to_node_id]
        if (fromNode && fromNode.floor_number === activeFloor && points.length === 0) {
          points.push({ x: fromNode.x_pos, y: fromNode.y_pos, label: fromNode.label })
        }
        if (toNode && toNode.floor_number === activeFloor) {
          points.push({ x: toNode.x_pos, y: toNode.y_pos, label: toNode.label })
        }
      }
    })
    return points
  }, [routeSteps, nodes, activeFloor])

  // Build polyline string for route
  const routePolyline = routePathPoints.map(p =>
    `${(p.x / 100) * 1100},${(p.y / 100) * 750}`
  ).join(' ')

  // Check if a node is the route destination
  const destNodeId = routeSteps.length > 0
    ? routeSteps[routeSteps.length - 1].to_node_id
    : null

  // Check if a node is the route start
  const startNodeId = routeSteps.length > 0
    ? routeSteps[0].from_node_id
    : null

  return (
    <div className="relative rounded-2xl overflow-hidden border border-surface-700/50 bg-surface-900/50 shadow-xl">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1100 750"
        className="w-full h-auto"
        style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}
      >
        <defs>
          {/* Glow filter for route */}
          <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Pulse animation for destination */}
          <filter id="destGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Hatch pattern */}
          <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#b0c4de" strokeWidth="1" opacity="0.4" />
          </pattern>
          <pattern id="stair" width="10" height="10" patternUnits="userSpaceOnUse">
            <line x1="0" y1="5" x2="10" y2="5" stroke="#95a5a6" strokeWidth="1" />
          </pattern>
          {/* Animated dash for route */}
          <style>{`
            @keyframes dash { to { stroke-dashoffset: -40; } }
            @keyframes pulse { 0%, 100% { opacity: 0.6; r: 12; } 50% { opacity: 1; r: 18; } }
            .route-line { animation: dash 1s linear infinite; }
            .dest-pulse { animation: pulse 1.5s ease-in-out infinite; }
          `}</style>
        </defs>

        {/* Render the actual floor plan SVG */}
        {activeFloor === 0 && <GroundFloorPlan />}
        {activeFloor === 1 && <FirstFloorPlan />}
        {activeFloor === 2 && <SecondFloorPlan />}

        {/* Route path overlay */}
        {routePolyline && (
          <g>
            {/* Route glow background */}
            <polyline
              points={routePolyline}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.25"
              filter="url(#routeGlow)"
            />
            {/* Route main line */}
            <polyline
              points={routePolyline}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="12 8"
              className="route-line"
            />
          </g>
        )}

        {/* Start node marker */}
        {startNodeId && floorNodes.find(n => n.id === startNodeId) && (() => {
          const node = floorNodes.find(n => n.id === startNodeId)
          const cx = (node.x_pos / 100) * 1100
          const cy = (node.y_pos / 100) * 750
          return (
            <g>
              <circle cx={cx} cy={cy} r="14" fill="#22c55e" opacity="0.3" />
              <circle cx={cx} cy={cy} r="8" fill="#22c55e" stroke="white" strokeWidth="2" />
              <text x={cx} y={cy - 18} textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="700">START</text>
            </g>
          )
        })()}

        {/* Destination node marker */}
        {destNodeId && floorNodes.find(n => n.id === destNodeId) && (() => {
          const node = floorNodes.find(n => n.id === destNodeId)
          const cx = (node.x_pos / 100) * 1100
          const cy = (node.y_pos / 100) * 750
          return (
            <g>
              <circle cx={cx} cy={cy} r="12" fill="#ef4444" opacity="0.5" className="dest-pulse" />
              <circle cx={cx} cy={cy} r="8" fill="#ef4444" stroke="white" strokeWidth="2" />
              <text x={cx} y={cy - 18} textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="700">📍 DESTINATION</text>
            </g>
          )
        })()}

        {/* Clickable department hotspots (invisible overlay) */}
        {floorNodes
          .filter(n => n.node_type === 'department' || n.department_id)
          .map(node => {
            const cx = (node.x_pos / 100) * 1100
            const cy = (node.y_pos / 100) * 750
            const isSelected = node.id === selectedNodeId
            return (
              <g key={node.id}>
                {isSelected && (
                  <circle cx={cx} cy={cy} r="20" fill="#3b82f6" opacity="0.2" className="dest-pulse" />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r="16"
                  fill="transparent"
                  stroke="transparent"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onNodeTap?.(node)}
                />
              </g>
            )
          })
        }
      </svg>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════
// GROUND FLOOR SVG
// ═══════════════════════════════════════════════════════════════
function GroundFloorPlan() {
  return (
    <g>
      {/* Background */}
      <rect width="1100" height="750" fill="#f0f4f8" />
      <rect x="30" y="60" width="1040" height="660" fill="#e8edf2" stroke="#2c3e50" strokeWidth="5" rx="4" />

      {/* Title */}
      <rect x="30" y="10" width="1040" height="45" fill="#1a3a5c" rx="3" />
      <text x="550" y="36" textAnchor="middle" fill="white" fontSize="16" fontWeight="700" letterSpacing="3">RUBY HALL CLINIC, PUNE  ·  GROUND FLOOR  (G)</text>

      {/* Main Entrance Lobby */}
      <rect x="40" y="70" width="310" height="150" fill="#c8a2c8" fillOpacity="0.35" stroke="#7b2d8b" strokeWidth="2" />
      <text x="195" y="125" textAnchor="middle" fill="#4a0072" fontSize="13" fontWeight="700">MAIN ENTRANCE</text>
      <text x="195" y="143" textAnchor="middle" fill="#4a0072" fontSize="11">LOBBY &amp; RECEPTION</text>
      <text x="195" y="159" textAnchor="middle" fill="#4a0072" fontSize="10">Info Desk · Seating · Help</text>

      {/* OPD Registration */}
      <rect x="355" y="70" width="200" height="150" fill="#c8a2c8" fillOpacity="0.35" stroke="#7b2d8b" strokeWidth="2" />
      <text x="455" y="130" textAnchor="middle" fill="#4a0072" fontSize="12" fontWeight="700">OPD</text>
      <text x="455" y="148" textAnchor="middle" fill="#4a0072" fontSize="11">REGISTRATION</text>
      <text x="455" y="165" textAnchor="middle" fill="#4a0072" fontSize="10">&amp; BILLING</text>

      {/* Emergency */}
      <rect x="560" y="70" width="230" height="150" fill="#e74c3c" fillOpacity="0.28" stroke="#c0392b" strokeWidth="3" />
      <text x="675" y="120" textAnchor="middle" fill="#7b0000" fontSize="13" fontWeight="700">⚡ EMERGENCY</text>
      <text x="675" y="138" textAnchor="middle" fill="#7b0000" fontSize="11">&amp; CASUALTY</text>
      <text x="675" y="155" textAnchor="middle" fill="#7b0000" fontSize="10">24 × 7  ·  Triage  ·  Resus</text>

      {/* Ambulance Bay */}
      <rect x="795" y="70" width="175" height="75" fill="#e74c3c" fillOpacity="0.18" stroke="#c0392b" strokeWidth="2" strokeDasharray="6,3" />
      <text x="882" y="103" textAnchor="middle" fill="#7b0000" fontSize="11" fontWeight="700">AMBULANCE BAY</text>
      <text x="882" y="119" textAnchor="middle" fill="#7b0000" fontSize="10">&amp; DROP-OFF ZONE</text>

      {/* Security */}
      <rect x="795" y="148" width="175" height="72" fill="#95a5a6" fillOpacity="0.35" stroke="#7f8c8d" strokeWidth="2" />
      <text x="882" y="181" textAnchor="middle" fill="#2c3e50" fontSize="11" fontWeight="700">SECURITY</text>

      {/* Main Corridor */}
      <rect x="40" y="225" width="930" height="34" fill="#dce8f5" stroke="#2980b9" strokeWidth="1.5" />
      <text x="505" y="247" textAnchor="middle" fill="#1a5276" fontSize="10" fontWeight="600" letterSpacing="4">MAIN ENTRANCE CORRIDOR — GROUND FLOOR</text>

      {/* Cardiology OPD */}
      <rect x="40" y="264" width="175" height="110" fill="#e74c3c" fillOpacity="0.25" stroke="#c0392b" strokeWidth="2" />
      <text x="127" y="308" textAnchor="middle" fill="#7b0000" fontSize="12" fontWeight="700">CARDIOLOGY</text>
      <text x="127" y="325" textAnchor="middle" fill="#7b0000" fontSize="10">OPD · Consult</text>

      {/* Radiology */}
      <rect x="220" y="264" width="200" height="110" fill="#3498db" fillOpacity="0.25" stroke="#2980b9" strokeWidth="2" />
      <text x="320" y="305" textAnchor="middle" fill="#1a3a6e" fontSize="12" fontWeight="700">RADIOLOGY</text>
      <text x="320" y="322" textAnchor="middle" fill="#1a3a6e" fontSize="10">X-Ray · CT · MRI</text>

      {/* Blood Bank */}
      <rect x="425" y="264" width="160" height="55" fill="#922b21" fillOpacity="0.25" stroke="#922b21" strokeWidth="2" />
      <text x="505" y="285" textAnchor="middle" fill="#5b0000" fontSize="12" fontWeight="700">🩸 BLOOD BANK</text>

      {/* Pathology */}
      <rect x="425" y="323" width="160" height="51" fill="#0097a7" fillOpacity="0.25" stroke="#0097a7" strokeWidth="2" />
      <text x="505" y="343" textAnchor="middle" fill="#004d50" fontSize="12" fontWeight="700">PATHOLOGY</text>
      <text x="505" y="359" textAnchor="middle" fill="#004d50" fontSize="10">Lab · Samples</text>

      {/* Pharmacy */}
      <rect x="590" y="264" width="175" height="110" fill="#f39c12" fillOpacity="0.28" stroke="#e67e22" strokeWidth="2" />
      <text x="677" y="308" textAnchor="middle" fill="#7d4a00" fontSize="12" fontWeight="700">💊 PHARMACY</text>
      <text x="677" y="325" textAnchor="middle" fill="#7d4a00" fontSize="10">Dispensing Counter</text>

      {/* Cafeteria */}
      <rect x="770" y="264" width="200" height="110" fill="#27ae60" fillOpacity="0.25" stroke="#1e8449" strokeWidth="2" />
      <text x="870" y="308" textAnchor="middle" fill="#0a4d1f" fontSize="12" fontWeight="700">☕ CAFETERIA</text>
      <text x="870" y="325" textAnchor="middle" fill="#0a4d1f" fontSize="10">Food &amp; Beverages</text>

      {/* Service Corridor */}
      <rect x="40" y="378" width="930" height="28" fill="#dce8f5" stroke="#2980b9" strokeWidth="1" />
      <text x="505" y="396" textAnchor="middle" fill="#1a5276" fontSize="9" fontWeight="600" letterSpacing="3">SERVICE CORRIDOR</text>

      {/* OPD Consult Rooms Row */}
      <text x="40" y="422" fill="#7f8c8d" fontSize="10" fontWeight="600" letterSpacing="2">OPD CONSULTATION ROOMS</text>

      {/* C-01 Cardiology */}
      <rect x="40" y="432" width="145" height="90" fill="#e74c3c" fillOpacity="0.18" stroke="#c0392b" strokeWidth="1.5" />
      <text x="112" y="468" textAnchor="middle" fill="#7b0000" fontSize="11" fontWeight="700">C-01</text>
      <text x="112" y="484" textAnchor="middle" fill="#7b0000" fontSize="10">Cardiology</text>

      {/* C-02 Neurology */}
      <rect x="190" y="432" width="145" height="90" fill="#8e44ad" fillOpacity="0.22" stroke="#7d3c98" strokeWidth="1.5" />
      <text x="262" y="468" textAnchor="middle" fill="#4a1a7a" fontSize="11" fontWeight="700">C-02</text>
      <text x="262" y="484" textAnchor="middle" fill="#4a1a7a" fontSize="10">Neurology</text>

      {/* C-03 Orthopedics */}
      <rect x="340" y="432" width="145" height="90" fill="#27ae60" fillOpacity="0.22" stroke="#1e8449" strokeWidth="1.5" />
      <text x="412" y="468" textAnchor="middle" fill="#0a4d1f" fontSize="11" fontWeight="700">C-03</text>
      <text x="412" y="484" textAnchor="middle" fill="#0a4d1f" fontSize="10">Orthopedics</text>

      {/* C-04 Oncology */}
      <rect x="490" y="432" width="145" height="90" fill="#f39c12" fillOpacity="0.22" stroke="#e67e22" strokeWidth="1.5" />
      <text x="562" y="468" textAnchor="middle" fill="#7d4a00" fontSize="11" fontWeight="700">C-04</text>
      <text x="562" y="484" textAnchor="middle" fill="#7d4a00" fontSize="10">Oncology</text>

      {/* C-05 Urology */}
      <rect x="640" y="432" width="145" height="90" fill="#16a085" fillOpacity="0.22" stroke="#138d75" strokeWidth="1.5" />
      <text x="712" y="468" textAnchor="middle" fill="#0a4d40" fontSize="11" fontWeight="700">C-05</text>
      <text x="712" y="484" textAnchor="middle" fill="#0a4d40" fontSize="10">Urology</text>

      {/* C-06 Gastro */}
      <rect x="790" y="432" width="145" height="90" fill="#8e44ad" fillOpacity="0.18" stroke="#7d3c98" strokeWidth="1.5" />
      <text x="862" y="468" textAnchor="middle" fill="#4a1a7a" fontSize="11" fontWeight="700">C-06</text>
      <text x="862" y="484" textAnchor="middle" fill="#4a1a7a" fontSize="10">Gastroenterology</text>

      {/* Lower Corridor */}
      <rect x="40" y="526" width="930" height="28" fill="#dce8f5" stroke="#2980b9" strokeWidth="1" />
      <text x="505" y="544" textAnchor="middle" fill="#1a5276" fontSize="9" fontWeight="600" letterSpacing="3">LOWER CORRIDOR — GROUND FLOOR</text>

      {/* Waiting Area */}
      <rect x="40" y="558" width="200" height="110" fill="#bdc3c7" fillOpacity="0.4" stroke="#95a5a6" strokeWidth="1.5" />
      <text x="140" y="607" textAnchor="middle" fill="#2c3e50" fontSize="12" fontWeight="700">WAITING AREA</text>
      <text x="140" y="624" textAnchor="middle" fill="#2c3e50" fontSize="10">Seating · TV · ACs</text>

      {/* WC */}
      <rect x="245" y="558" width="80" height="55" fill="url(#hatch)" stroke="#7f8c8d" strokeWidth="1.5" />
      <text x="285" y="583" textAnchor="middle" fill="#2c3e50" fontSize="11" fontWeight="700">WC</text>
      <text x="285" y="598" textAnchor="middle" fill="#2c3e50" fontSize="10">♂ Male</text>
      <rect x="245" y="617" width="80" height="51" fill="url(#hatch)" stroke="#7f8c8d" strokeWidth="1.5" />
      <text x="285" y="639" textAnchor="middle" fill="#2c3e50" fontSize="11" fontWeight="700">WC</text>
      <text x="285" y="654" textAnchor="middle" fill="#2c3e50" fontSize="10">♀ Female</text>

      {/* Medical Store */}
      <rect x="330" y="558" width="180" height="110" fill="#f39c12" fillOpacity="0.2" stroke="#e67e22" strokeWidth="1.5" />
      <text x="420" y="607" textAnchor="middle" fill="#7d4a00" fontSize="12" fontWeight="700">MEDICAL STORE</text>

      {/* Lifts */}
      <rect x="515" y="558" width="75" height="110" fill="#2c3e50" fillOpacity="0.3" stroke="#2c3e50" strokeWidth="2" />
      <text x="552" y="601" textAnchor="middle" fill="white" fontSize="12" fontWeight="700">🛗</text>
      <text x="552" y="618" textAnchor="middle" fill="white" fontSize="10">LIFTS</text>

      {/* Staircase Left */}
      <rect x="595" y="558" width="100" height="110" fill="#95a5a6" fillOpacity="0.3" stroke="#7f8c8d" strokeWidth="1.5" strokeDasharray="5,3" />
      <text x="645" y="617" textAnchor="middle" fill="#2c3e50" fontSize="10" fontWeight="700">STAIRCASE</text>
      <text x="645" y="632" textAnchor="middle" fill="#2c3e50" fontSize="9">Fire Exit (L)</text>

      {/* Admin Office */}
      <rect x="700" y="558" width="155" height="110" fill="#bdc3c7" fillOpacity="0.35" stroke="#95a5a6" strokeWidth="1.5" />
      <text x="777" y="607" textAnchor="middle" fill="#2c3e50" fontSize="12" fontWeight="700">ADMIN OFFICE</text>

      {/* Staircase Right */}
      <rect x="860" y="558" width="110" height="110" fill="#95a5a6" fillOpacity="0.3" stroke="#7f8c8d" strokeWidth="1.5" strokeDasharray="5,3" />
      <text x="915" y="617" textAnchor="middle" fill="#2c3e50" fontSize="10" fontWeight="700">STAIRCASE</text>
      <text x="915" y="632" textAnchor="middle" fill="#2c3e50" fontSize="9">Fire Exit (R)</text>

      {/* Legend */}
      <rect x="30" y="678" width="1040" height="42" fill="#1a3a5c" rx="3" />
      <text x="55" y="696" fill="#aed6f1" fontSize="9" fontWeight="700" letterSpacing="2">LEGEND</text>
      <rect x="55" y="703" width="12" height="12" fill="#c8a2c8" stroke="#7b2d8b" strokeWidth="1" />
      <text x="72" y="714" fill="white" fontSize="9">Reception</text>
      <rect x="155" y="703" width="12" height="12" fill="#e74c3c" fillOpacity="0.5" stroke="#c0392b" strokeWidth="1" />
      <text x="172" y="714" fill="white" fontSize="9">Emergency</text>
      <rect x="260" y="703" width="12" height="12" fill="#3498db" fillOpacity="0.5" stroke="#2980b9" strokeWidth="1" />
      <text x="277" y="714" fill="white" fontSize="9">Radiology</text>
      <rect x="350" y="703" width="12" height="12" fill="#f39c12" fillOpacity="0.5" stroke="#e67e22" strokeWidth="1" />
      <text x="367" y="714" fill="white" fontSize="9">Pharmacy</text>
      <rect x="440" y="703" width="12" height="12" fill="#27ae60" fillOpacity="0.5" stroke="#1e8449" strokeWidth="1" />
      <text x="457" y="714" fill="white" fontSize="9">Cafeteria</text>
      <rect x="530" y="703" width="12" height="12" fill="#dce8f5" stroke="#2980b9" strokeWidth="1" />
      <text x="547" y="714" fill="white" fontSize="9">Corridor</text>
      <rect x="610" y="703" width="12" height="12" fill="#95a5a6" fillOpacity="0.5" stroke="#7f8c8d" strokeWidth="1" />
      <text x="627" y="714" fill="white" fontSize="9">Utility / Stairs</text>
    </g>
  )
}


// ═══════════════════════════════════════════════════════════════
// FIRST FLOOR SVG
// ═══════════════════════════════════════════════════════════════
function FirstFloorPlan() {
  return (
    <g>
      <rect width="1100" height="750" fill="#f0f4f8" />
      <rect x="30" y="60" width="1040" height="660" fill="#e8edf2" stroke="#2c3e50" strokeWidth="5" rx="4" />

      <rect x="30" y="10" width="1040" height="45" fill="#1a3a5c" rx="3" />
      <text x="550" y="36" textAnchor="middle" fill="white" fontSize="16" fontWeight="700" letterSpacing="3">RUBY HALL CLINIC, PUNE  ·  FIRST FLOOR  (1)</text>

      {/* Male General Ward */}
      <rect x="40" y="70" width="310" height="260" fill="#607d8b" fillOpacity="0.2" stroke="#37474f" strokeWidth="2.5" />
      <text x="195" y="92" textAnchor="middle" fill="#1a2a35" fontSize="13" fontWeight="700" letterSpacing="1">MALE GENERAL WARD</text>
      {/* Bed grid abbreviated */}
      {[...Array(15)].map((_, i) => {
        const row = Math.floor(i / 5)
        const col = i % 5
        return (
          <g key={`m${i}`}>
            <rect x={48 + col * 48} y={100 + row * 32} width="42" height="26" fill="#90a4ae" fillOpacity="0.6" stroke="#546e7a" strokeWidth="1" rx="3" />
            <text x={69 + col * 48} y={117 + row * 32} textAnchor="middle" fill="white" fontSize="8">M{i + 1}</text>
          </g>
        )
      })}
      <rect x="48" y="200" width="95" height="45" fill="#00897b" fillOpacity="0.45" stroke="#00695c" strokeWidth="2" />
      <text x="95" y="224" textAnchor="middle" fill="#003d33" fontSize="10" fontWeight="700">NURSE STATION</text>

      {/* ICU */}
      <rect x="358" y="70" width="340" height="240" fill="#00acc1" fillOpacity="0.22" stroke="#00838f" strokeWidth="3" />
      <text x="528" y="92" textAnchor="middle" fill="#004d56" fontSize="13" fontWeight="700" letterSpacing="1">ICU — INTENSIVE CARE UNIT</text>
      {[...Array(10)].map((_, i) => {
        const row = Math.floor(i / 5)
        const col = i % 5
        return (
          <g key={`icu${i}`}>
            <rect x={366 + col * 62} y={105 + row * 48} width="55" height="40" fill="#00bcd4" fillOpacity="0.5" stroke="#0097a7" strokeWidth="1.5" rx="4" />
            <text x={393 + col * 62} y={129 + row * 48} textAnchor="middle" fill="white" fontSize="9" fontWeight="700">Bed {i + 1}</text>
          </g>
        )
      })}
      <rect x="366" y="203" width="135" height="52" fill="#00897b" fillOpacity="0.5" stroke="#00695c" strokeWidth="2" />
      <text x="433" y="229" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">NURSE STATION</text>

      {/* OT Complex */}
      <rect x="706" y="70" width="364" height="300" fill="#1abc9c" fillOpacity="0.15" stroke="#0d7a5c" strokeWidth="3" />
      <text x="888" y="92" textAnchor="middle" fill="#0a3d2f" fontSize="13" fontWeight="700" letterSpacing="1">OT COMPLEX</text>
      <rect x="715" y="105" width="160" height="90" fill="#1abc9c" fillOpacity="0.35" stroke="#0d7a5c" strokeWidth="2" />
      <text x="795" y="141" textAnchor="middle" fill="#0a3d2f" fontSize="12" fontWeight="700">OT — 1</text>
      <text x="795" y="158" textAnchor="middle" fill="#0a3d2f" fontSize="10">General Surgery</text>
      <rect x="883" y="105" width="175" height="90" fill="#1abc9c" fillOpacity="0.35" stroke="#0d7a5c" strokeWidth="2" />
      <text x="970" y="141" textAnchor="middle" fill="#0a3d2f" fontSize="12" fontWeight="700">OT — 2</text>
      <text x="970" y="158" textAnchor="middle" fill="#0a3d2f" fontSize="10">Orthopaedics</text>
      <rect x="715" y="205" width="160" height="90" fill="#ec407a" fillOpacity="0.3" stroke="#ad1457" strokeWidth="2" />
      <text x="795" y="241" textAnchor="middle" fill="#5c0030" fontSize="12" fontWeight="700">OT — 3</text>
      <text x="795" y="258" textAnchor="middle" fill="#5c0030" fontSize="10">Gynaecology</text>
      <rect x="883" y="205" width="175" height="90" fill="#e74c3c" fillOpacity="0.3" stroke="#c0392b" strokeWidth="2" />
      <text x="970" y="241" textAnchor="middle" fill="#7b0000" fontSize="12" fontWeight="700">OT — 4</text>
      <text x="970" y="258" textAnchor="middle" fill="#7b0000" fontSize="10">Emergency OT</text>

      {/* Main Corridor */}
      <rect x="40" y="338" width="930" height="34" fill="#dce8f5" stroke="#2980b9" strokeWidth="1.5" />
      <text x="505" y="360" textAnchor="middle" fill="#1a5276" fontSize="10" fontWeight="600" letterSpacing="4">MAIN CORRIDOR — FIRST FLOOR</text>

      {/* Female General Ward */}
      <rect x="40" y="378" width="310" height="260" fill="#ec407a" fillOpacity="0.15" stroke="#ad1457" strokeWidth="2.5" />
      <text x="195" y="400" textAnchor="middle" fill="#5c0030" fontSize="13" fontWeight="700" letterSpacing="1">FEMALE GENERAL WARD</text>
      {[...Array(15)].map((_, i) => {
        const row = Math.floor(i / 5)
        const col = i % 5
        return (
          <g key={`f${i}`}>
            <rect x={48 + col * 48} y={408 + row * 32} width="42" height="26" fill="#f48fb1" fillOpacity="0.65" stroke="#e91e63" strokeWidth="1" rx="3" />
            <text x={69 + col * 48} y={425 + row * 32} textAnchor="middle" fill="#5c0030" fontSize="8">F{i + 1}</text>
          </g>
        )
      })}
      <rect x="48" y="508" width="95" height="45" fill="#00897b" fillOpacity="0.45" stroke="#00695c" strokeWidth="2" />
      <text x="95" y="532" textAnchor="middle" fill="#003d33" fontSize="10" fontWeight="700">NURSE STATION</text>

      {/* Private Rooms */}
      <rect x="706" y="378" width="364" height="290" fill="#f39c12" fillOpacity="0.12" stroke="#e67e22" strokeWidth="2.5" />
      <text x="888" y="400" textAnchor="middle" fill="#7d4a00" fontSize="13" fontWeight="700" letterSpacing="1">PRIVATE ROOMS</text>
      {['P1', 'P2', 'P3'].map((label, i) => (
        <g key={label}>
          <rect x={714 + i * 115} y="425" width="105" height="75" fill="#ffe082" fillOpacity="0.55" stroke="#f9a825" strokeWidth="1.5" />
          <text x={766 + i * 115} y="458" textAnchor="middle" fill="#7d4a00" fontSize="11" fontWeight="700">Room {label}</text>
        </g>
      ))}
      {['P4', 'P5 ★', 'P6 ★'].map((label, i) => (
        <g key={label}>
          <rect x={714 + i * 115} y="510" width="105" height="80" fill={i > 0 ? '#ffca28' : '#ffd54f'} fillOpacity="0.6" stroke="#f57f17" strokeWidth={i > 0 ? 2.5 : 1.5} />
          <text x={766 + i * 115} y="551" textAnchor="middle" fill="#5c3000" fontSize="11" fontWeight="700">Room {label}</text>
        </g>
      ))}

      {/* Lifts */}
      <rect x="358" y="555" width="75" height="80" fill="#2c3e50" fillOpacity="0.35" stroke="#2c3e50" strokeWidth="2" />
      <text x="395" y="591" textAnchor="middle" fill="white" fontSize="13">🛗</text>
      <text x="395" y="608" textAnchor="middle" fill="white" fontSize="10">LIFTS</text>

      {/* Lower Corridor */}
      <rect x="40" y="648" width="930" height="28" fill="#dce8f5" stroke="#2980b9" strokeWidth="1" />
      <text x="505" y="666" textAnchor="middle" fill="#1a5276" fontSize="9" fontWeight="600" letterSpacing="3">LOWER CORRIDOR — FIRST FLOOR</text>

      {/* Staircase Left */}
      <rect x="40" y="680" width="155" height="38" fill="url(#stair)" stroke="#7f8c8d" strokeWidth="1.5" />
      <text x="117" y="702" textAnchor="middle" fill="#2c3e50" fontSize="9" fontWeight="700">STAIRCASE — FIRE EXIT (L)</text>

      {/* Staircase Right */}
      <rect x="900" y="680" width="170" height="38" fill="url(#stair)" stroke="#7f8c8d" strokeWidth="1.5" />
      <text x="985" y="702" textAnchor="middle" fill="#2c3e50" fontSize="9" fontWeight="700">STAIRCASE — FIRE EXIT (R)</text>

      {/* Legend */}
      <rect x="30" y="726" width="1040" height="20" fill="#1a3a5c" rx="3" />
      <text x="60" y="739" fill="white" fontSize="9">■ ICU</text>
      <text x="115" y="739" fill="white" fontSize="9">■ OT Complex</text>
      <text x="230" y="739" fill="white" fontSize="9">■ Male Ward</text>
      <text x="340" y="739" fill="white" fontSize="9">■ Female Ward</text>
      <text x="460" y="739" fill="white" fontSize="9">■ Private / VIP</text>
      <text x="575" y="739" fill="white" fontSize="9">■ Nurse Station</text>
      <text x="700" y="739" fill="white" fontSize="9">■ Utility / WC</text>
      <text x="810" y="739" fill="white" fontSize="9">■ Corridor</text>
    </g>
  )
}


// ═══════════════════════════════════════════════════════════════
// SECOND FLOOR SVG
// ═══════════════════════════════════════════════════════════════
function SecondFloorPlan() {
  return (
    <g>
      <rect width="1100" height="750" fill="#f0f4f8" />
      <rect x="30" y="60" width="1040" height="660" fill="#e8edf2" stroke="#2c3e50" strokeWidth="5" rx="4" />

      <rect x="30" y="10" width="1040" height="45" fill="#1a3a5c" rx="3" />
      <text x="550" y="36" textAnchor="middle" fill="white" fontSize="16" fontWeight="700" letterSpacing="3">RUBY HALL CLINIC, PUNE  ·  SECOND FLOOR  (2)</text>

      {/* Neurology Ward */}
      <rect x="40" y="70" width="300" height="250" fill="#7e57c2" fillOpacity="0.22" stroke="#4527a0" strokeWidth="2.5" />
      <text x="190" y="92" textAnchor="middle" fill="#1a005e" fontSize="13" fontWeight="700">NEUROLOGY WARD</text>
      <text x="190" y="108" textAnchor="middle" fill="#1a005e" fontSize="11">&amp; NEURO ICU</text>
      {[...Array(6)].map((_, i) => (
        <g key={`n${i}`}>
          <rect x={48 + i * 48} y="118" width="42" height="26" fill="#9575cd" fillOpacity="0.6" stroke="#5e35b1" strokeWidth="1" rx="3" />
          <text x={69 + i * 48} y="135" textAnchor="middle" fill="white" fontSize="8">N{i + 1}</text>
        </g>
      ))}
      <rect x="48" y="210" width="120" height="50" fill="#00897b" fillOpacity="0.45" stroke="#00695c" strokeWidth="2" />
      <text x="108" y="235" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">NURSE STATION</text>

      {/* Neurosurgery */}
      <rect x="347" y="70" width="260" height="250" fill="#5c6bc0" fillOpacity="0.22" stroke="#283593" strokeWidth="2.5" />
      <text x="477" y="92" textAnchor="middle" fill="#0d1a5c" fontSize="13" fontWeight="700">NEUROSURGERY</text>
      <text x="477" y="108" textAnchor="middle" fill="#0d1a5c" fontSize="10">OPD · Ward · Neuro OT</text>
      <rect x="355" y="160" width="245" height="90" fill="#3949ab" fillOpacity="0.25" stroke="#283593" strokeWidth="2" />
      <text x="477" y="197" textAnchor="middle" fill="#0d1a5c" fontSize="12" fontWeight="700">NEURO-OT</text>
      <text x="477" y="214" textAnchor="middle" fill="#0d1a5c" fontSize="10">Brain &amp; Spine Surgery</text>

      {/* Oncology */}
      <rect x="614" y="70" width="250" height="250" fill="#ffa726" fillOpacity="0.2" stroke="#e65100" strokeWidth="2.5" />
      <text x="739" y="92" textAnchor="middle" fill="#7d2000" fontSize="13" fontWeight="700">ONCOLOGY</text>
      <text x="739" y="108" textAnchor="middle" fill="#7d2000" fontSize="10">Cancer Care · Chemo Suite</text>
      <rect x="622" y="155" width="120" height="85" fill="#ff8f00" fillOpacity="0.3" stroke="#e65100" strokeWidth="2" />
      <text x="682" y="190" textAnchor="middle" fill="#5d1a00" fontSize="11" fontWeight="700">CHEMO</text>
      <text x="682" y="207" textAnchor="middle" fill="#5d1a00" fontSize="10">INFUSION</text>
      <rect x="748" y="155" width="110" height="85" fill="#ffe0b2" fillOpacity="0.55" stroke="#e65100" strokeWidth="2" />
      <text x="803" y="190" textAnchor="middle" fill="#5d1a00" fontSize="11" fontWeight="700">ONCO</text>
      <text x="803" y="207" textAnchor="middle" fill="#5d1a00" fontSize="10">DAY CARE</text>

      {/* OT Access */}
      <rect x="870" y="70" width="200" height="250" fill="#1abc9c" fillOpacity="0.15" stroke="#0d7a5c" strokeWidth="2.5" />
      <text x="970" y="92" textAnchor="middle" fill="#0a3d2f" fontSize="12" fontWeight="700">NEURO-ONCO</text>
      <text x="970" y="108" textAnchor="middle" fill="#0a3d2f" fontSize="10">OT ACCESS</text>
      <rect x="878" y="118" width="185" height="90" fill="#a5d6a7" fillOpacity="0.5" stroke="#388e3c" strokeWidth="2" />
      <text x="970" y="155" textAnchor="middle" fill="#1a4a1c" fontSize="12" fontWeight="700">PRE-OP ROOM</text>
      <rect x="878" y="218" width="185" height="95" fill="#c8e6c9" fillOpacity="0.5" stroke="#388e3c" strokeWidth="2" />
      <text x="970" y="258" textAnchor="middle" fill="#1a4a1c" fontSize="12" fontWeight="700">POST-OP ROOM</text>

      {/* Main Corridor */}
      <rect x="40" y="326" width="1030" height="34" fill="#dce8f5" stroke="#2980b9" strokeWidth="1.5" />
      <text x="555" y="348" textAnchor="middle" fill="#1a5276" fontSize="10" fontWeight="600" letterSpacing="4">MAIN CORRIDOR — SECOND FLOOR</text>

      {/* Orthopedics Ward */}
      <rect x="40" y="366" width="270" height="270" fill="#43a047" fillOpacity="0.18" stroke="#1b5e20" strokeWidth="2.5" />
      <text x="175" y="388" textAnchor="middle" fill="#0a2f0c" fontSize="13" fontWeight="700">ORTHOPEDICS WARD</text>
      <text x="175" y="404" textAnchor="middle" fill="#0a2f0c" fontSize="10">Bone &amp; Joint</text>
      {[...Array(12)].map((_, i) => {
        const row = Math.floor(i / 6)
        const col = i % 6
        return (
          <g key={`o${i}`}>
            <rect x={48 + col * 44} y={413 + row * 31} width="38" height="25" fill="#81c784" fillOpacity="0.65" stroke="#388e3c" strokeWidth="1" rx="3" />
            <text x={67 + col * 44} y={430 + row * 31} textAnchor="middle" fill="#0a2f0c" fontSize="8">O{i + 1}</text>
          </g>
        )
      })}
      <rect x="48" y="478" width="120" height="45" fill="#00897b" fillOpacity="0.45" stroke="#00695c" strokeWidth="2" />
      <text x="108" y="499" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">NURSE STATION</text>
      <rect x="48" y="533" width="125" height="55" fill="#a5d6a7" fillOpacity="0.45" stroke="#388e3c" strokeWidth="1.5" />
      <text x="110" y="558" textAnchor="middle" fill="#1a4a1c" fontSize="11" fontWeight="700">PLASTER ROOM</text>
      <rect x="180" y="533" width="122" height="55" fill="#c8e6c9" fillOpacity="0.5" stroke="#388e3c" strokeWidth="1.5" />
      <text x="241" y="558" textAnchor="middle" fill="#1a4a1c" fontSize="11" fontWeight="700">PHYSIO</text>

      {/* Urology */}
      <rect x="317" y="366" width="245" height="175" fill="#00897b" fillOpacity="0.18" stroke="#00695c" strokeWidth="2.5" />
      <text x="439" y="388" textAnchor="middle" fill="#003d33" fontSize="13" fontWeight="700">UROLOGY</text>
      <text x="439" y="404" textAnchor="middle" fill="#003d33" fontSize="10">OPD · Ward · Endoscopy</text>
      <rect x="325" y="447" width="110" height="50" fill="#b2dfdb" fillOpacity="0.5" stroke="#00897b" strokeWidth="1.5" />
      <text x="380" y="471" textAnchor="middle" fill="#003d33" fontSize="10" fontWeight="700">UROLOGY OPD</text>
      <rect x="443" y="447" width="111" height="50" fill="#00bcd4" fillOpacity="0.25" stroke="#0097a7" strokeWidth="1.5" />
      <text x="498" y="471" textAnchor="middle" fill="#004d56" fontSize="10" fontWeight="700">ENDOSCOPY</text>

      {/* Gastroenterology */}
      <rect x="569" y="366" width="245" height="270" fill="#7e57c2" fillOpacity="0.15" stroke="#4527a0" strokeWidth="2.5" />
      <text x="691" y="388" textAnchor="middle" fill="#1a005e" fontSize="12" fontWeight="700">GASTROENTEROLOGY</text>
      <text x="691" y="404" textAnchor="middle" fill="#1a005e" fontSize="10">OPD · GI Endoscopy · Ward</text>
      <rect x="577" y="448" width="229" height="80" fill="#9c27b0" fillOpacity="0.2" stroke="#6a1b9a" strokeWidth="2" />
      <text x="691" y="482" textAnchor="middle" fill="#1a005e" fontSize="12" fontWeight="700">GI ENDOSCOPY SUITE</text>
      <text x="691" y="499" textAnchor="middle" fill="#1a005e" fontSize="10">Gastroscopy · Colonoscopy</text>
      <rect x="577" y="538" width="229" height="55" fill="#ce93d8" fillOpacity="0.35" stroke="#6a1b9a" strokeWidth="1.5" />
      <text x="691" y="563" textAnchor="middle" fill="#1a005e" fontSize="11" fontWeight="700">GASTRO OPD</text>

      {/* Private & VIP Rooms */}
      <rect x="820" y="366" width="250" height="270" fill="#ffa726" fillOpacity="0.12" stroke="#e65100" strokeWidth="2.5" />
      <text x="945" y="388" textAnchor="middle" fill="#7d2000" fontSize="12" fontWeight="700">PRIVATE &amp; VIP ROOMS</text>
      {['S1', 'S2'].map((label, i) => (
        <g key={label}>
          <rect x={828 + i * 120} y="415" width="110" height="75" fill="#ffe082" fillOpacity="0.55" stroke="#f9a825" strokeWidth="1.5" />
          <text x={883 + i * 120} y="449" textAnchor="middle" fill="#7d4a00" fontSize="11" fontWeight="700">Room {label}</text>
        </g>
      ))}
      {['S3 ★', 'S4 ★'].map((label, i) => (
        <g key={label}>
          <rect x={828 + i * 120} y="500" width="110" height="80" fill="#ffca28" fillOpacity="0.65" stroke="#f57f17" strokeWidth="2.5" />
          <text x={883 + i * 120} y="540" textAnchor="middle" fill="#5c3000" fontSize="11" fontWeight="700">Room {label}</text>
        </g>
      ))}

      {/* Lower Corridor */}
      <rect x="40" y="648" width="1030" height="28" fill="#dce8f5" stroke="#2980b9" strokeWidth="1" />
      <text x="555" y="666" textAnchor="middle" fill="#1a5276" fontSize="9" fontWeight="600" letterSpacing="3">LOWER CORRIDOR — SECOND FLOOR</text>

      {/* Staircase Left */}
      <rect x="40" y="680" width="155" height="38" fill="url(#stair)" stroke="#7f8c8d" strokeWidth="1.5" />
      <text x="117" y="702" textAnchor="middle" fill="#2c3e50" fontSize="9" fontWeight="700">STAIRCASE (L)</text>

      {/* Lifts */}
      <rect x="285" y="680" width="75" height="38" fill="#2c3e50" fillOpacity="0.35" stroke="#2c3e50" strokeWidth="2" />
      <text x="322" y="702" textAnchor="middle" fill="white" fontSize="10">🛗 LIFTS</text>

      {/* Staircase Right */}
      <rect x="900" y="680" width="170" height="38" fill="url(#stair)" stroke="#7f8c8d" strokeWidth="1.5" />
      <text x="985" y="702" textAnchor="middle" fill="#2c3e50" fontSize="9" fontWeight="700">STAIRCASE (R)</text>

      {/* Legend */}
      <rect x="30" y="726" width="1040" height="20" fill="#1a3a5c" rx="3" />
      <text x="50" y="739" fill="white" fontSize="9">■ Neurology</text>
      <text x="150" y="739" fill="white" fontSize="9">■ Neurosurgery</text>
      <text x="280" y="739" fill="white" fontSize="9">■ Oncology</text>
      <text x="380" y="739" fill="white" fontSize="9">■ Orthopedics</text>
      <text x="500" y="739" fill="white" fontSize="9">■ Urology</text>
      <text x="580" y="739" fill="white" fontSize="9">■ Gastroenterology</text>
      <text x="730" y="739" fill="white" fontSize="9">■ Private / VIP</text>
      <text x="860" y="739" fill="white" fontSize="9">■ Stairs / Lifts</text>
    </g>
  )
}
