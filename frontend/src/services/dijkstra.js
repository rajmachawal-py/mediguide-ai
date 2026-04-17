/**
 * MediGuide AI — Dijkstra Shortest Path Navigation
 *
 * Weighted bidirectional graph pathfinding using a min-heap priority queue.
 * Replaces the old BFS router with distance-aware shortest-path routing.
 *
 * Features:
 * - Dijkstra with Euclidean distance weights
 * - Accessibility mode: removes staircase edges → forces lift-only
 * - Sterile zone avoidance: OT edges get Infinity weight
 * - Cross-floor routing via lift/staircase nodes
 * - Step-by-step human-readable instruction generator
 * - Distance in metres (pixel distance × 0.05)
 */

import { NODES, EDGES, FLOOR_LABELS } from '../data/navigationGraph'

// ── Min-Heap Priority Queue ──────────────────────────────────

class MinHeap {
  constructor() { this.heap = [] }

  push(item) {
    this.heap.push(item)
    this._bubbleUp(this.heap.length - 1)
  }

  pop() {
    const top = this.heap[0]
    const last = this.heap.pop()
    if (this.heap.length > 0) {
      this.heap[0] = last
      this._sinkDown(0)
    }
    return top
  }

  get size() { return this.heap.length }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (this.heap[parent].dist <= this.heap[i].dist) break
      ;[this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]]
      i = parent
    }
  }

  _sinkDown(i) {
    const n = this.heap.length
    while (true) {
      let smallest = i
      const left = 2 * i + 1
      const right = 2 * i + 2
      if (left < n && this.heap[left].dist < this.heap[smallest].dist) smallest = left
      if (right < n && this.heap[right].dist < this.heap[smallest].dist) smallest = right
      if (smallest === i) break
      ;[this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]]
      i = smallest
    }
  }
}

// ── Build Adjacency List ─────────────────────────────────────

function buildGraph(options = {}) {
  const { accessibleOnly = false, avoidSterile = false } = options

  // Build node lookup
  const nodeMap = {}
  NODES.forEach(n => { nodeMap[n.id] = n })

  // Build adjacency (bidirectional)
  const adj = {}
  NODES.forEach(n => { adj[n.id] = [] })

  EDGES.forEach(edge => {
    // Skip staircase edges in accessible mode
    if (accessibleOnly && edge.transport === 'stairs') return

    let weight = edge.weight

    // Sterile zone avoidance: make edges TO sterile nodes very expensive
    if (avoidSterile) {
      const toNode = nodeMap[edge.to]
      const fromNode = nodeMap[edge.from]
      if (toNode?.isSterile || fromNode?.isSterile) {
        weight = 999999
      }
    }

    // Bidirectional
    if (adj[edge.from]) adj[edge.from].push({ to: edge.to, weight, edge })
    if (adj[edge.to]) adj[edge.to].push({ to: edge.from, weight, edge })
  })

  return { adj, nodeMap }
}

// ── Dijkstra Algorithm ───────────────────────────────────────

/**
 * Find shortest path from start to end using Dijkstra.
 *
 * @param {string} startId - Start node ID
 * @param {string} endId - End node ID
 * @param {Object} options
 * @param {boolean} options.accessibleOnly - Remove staircase edges
 * @param {boolean} options.avoidSterile - Avoid OT/sterile zones
 * @returns {Object|null} Route result with path, steps, distance
 */
export function findShortestPath(startId, endId, options = {}) {
  const { adj, nodeMap } = buildGraph(options)

  if (!nodeMap[startId] || !nodeMap[endId]) {
    console.warn(`[Dijkstra] Node not found: ${startId} or ${endId}`)
    return null
  }

  // Dijkstra
  const dist = {}
  const prev = {}
  const visited = new Set()
  const pq = new MinHeap()

  NODES.forEach(n => { dist[n.id] = Infinity })
  dist[startId] = 0
  pq.push({ id: startId, dist: 0 })

  while (pq.size > 0) {
    const { id: u } = pq.pop()
    if (visited.has(u)) continue
    visited.add(u)

    if (u === endId) break

    for (const neighbor of (adj[u] || [])) {
      const newDist = dist[u] + neighbor.weight
      if (newDist < dist[neighbor.to]) {
        dist[neighbor.to] = newDist
        prev[neighbor.to] = u
        pq.push({ id: neighbor.to, dist: newDist })
      }
    }
  }

  // No path found
  if (dist[endId] === Infinity) return null

  // Reconstruct path
  const path = []
  let current = endId
  while (current) {
    path.unshift(current)
    current = prev[current]
  }

  // Generate step-by-step instructions
  const steps = generateSteps(path, nodeMap, options)
  const totalPixelDist = dist[endId]
  const totalMeters = Math.round(totalPixelDist * 0.05 * 10) / 10

  // Determine which floors the route crosses
  const floorsUsed = [...new Set(path.map(id => nodeMap[id].floor))].sort()

  return {
    path,
    steps,
    totalDistance: totalMeters,
    totalPixelDistance: totalPixelDist,
    floorsUsed,
    startNode: nodeMap[startId],
    endNode: nodeMap[endId],
    isMultiFloor: floorsUsed.length > 1,
    isCritical: nodeMap[endId].isCritical || false,
    isSterile: nodeMap[endId].isSterile || false,
    accessible: options.accessibleOnly || false,
  }
}

// ── Step-by-Step Instruction Generator ───────────────────────

function generateSteps(path, nodeMap, options) {
  if (path.length < 2) return []

  const steps = []
  let cumulativeDistance = 0

  for (let i = 0; i < path.length - 1; i++) {
    const fromNode = nodeMap[path[i]]
    const toNode = nodeMap[path[i + 1]]

    // Calculate segment distance
    const segDist = Math.round(
      Math.sqrt((toNode.x - fromNode.x) ** 2 + (toNode.y - fromNode.y) ** 2) * 0.05 * 10
    ) / 10

    cumulativeDistance += segDist

    // Skip internal corridor-to-corridor junctions (merge into one "walk along..." step)
    if (fromNode.type === 'junction' && toNode.type === 'junction' && fromNode.floor === toNode.floor) {
      // Don't create a step — these get merged below
      continue
    }

    // Generate instruction
    let instruction = ''
    const floorLabel = FLOOR_LABELS[toNode.floor] || `Floor ${toNode.floor}`

    if (fromNode.floor !== toNode.floor) {
      // Cross-floor transition
      const transport = toNode.type === 'lift' || fromNode.type === 'lift' ? 'lift' : 'staircase'
      const dir = toNode.floor > fromNode.floor ? 'up' : 'down'
      instruction = `Take the ${transport} ${dir} to ${FLOOR_LABELS[toNode.floor]}`
    } else if (i === 0) {
      // First step
      instruction = `Start at ${fromNode.label}`
    } else if (i === path.length - 2) {
      // Last step — arrival
      instruction = `You have arrived at ${toNode.label}`
    } else if (toNode.type === 'junction') {
      // Walking to a junction — describe corridor
      instruction = `Walk along the corridor towards ${toNode.label}`
    } else {
      // Walking to a department/room
      instruction = `Walk to ${toNode.label}`
    }

    steps.push({
      stepNumber: steps.length + 1,
      instruction,
      floor: toNode.floor,
      floorLabel,
      distance: segDist,
      cumulativeDistance: Math.round(cumulativeDistance * 10) / 10,
      fromId: fromNode.id,
      toId: toNode.id,
      fromLabel: fromNode.label,
      toLabel: toNode.label,
      isCrossFloor: fromNode.floor !== toNode.floor,
      nodeType: toNode.type,
    })
  }

  // Post-process: merge consecutive junction walks into a single direction
  const mergedSteps = []
  let pendingCorridorSteps = []

  steps.forEach((step, i) => {
    if (step.nodeType === 'junction' && !step.isCrossFloor) {
      pendingCorridorSteps.push(step)
    } else {
      // Flush pending corridor steps as one merged step
      if (pendingCorridorSteps.length > 0) {
        const first = pendingCorridorSteps[0]
        const last = pendingCorridorSteps[pendingCorridorSteps.length - 1]
        const totalSegDist = pendingCorridorSteps.reduce((sum, s) => sum + s.distance, 0)
        mergedSteps.push({
          ...first,
          stepNumber: mergedSteps.length + 1,
          instruction: `Walk along the corridor`,
          toId: last.toId,
          toLabel: last.toLabel,
          distance: Math.round(totalSegDist * 10) / 10,
        })
        pendingCorridorSteps = []
      }
      mergedSteps.push({ ...step, stepNumber: mergedSteps.length + 1 })
    }
  })

  // Flush any remaining corridor steps
  if (pendingCorridorSteps.length > 0) {
    const first = pendingCorridorSteps[0]
    const last = pendingCorridorSteps[pendingCorridorSteps.length - 1]
    const totalSegDist = pendingCorridorSteps.reduce((sum, s) => sum + s.distance, 0)
    mergedSteps.push({
      ...first,
      stepNumber: mergedSteps.length + 1,
      instruction: `Walk along the corridor`,
      toId: last.toId,
      toLabel: last.toLabel,
      distance: Math.round(totalSegDist * 10) / 10,
    })
  }

  return mergedSteps
}

// ── Voice Navigation ─────────────────────────────────────────

/**
 * Generate a full narration string for TTS from route steps.
 * @param {Array} steps - Route steps
 * @param {string} language - 'en' | 'hi' | 'mr'
 * @returns {string} Full narration text
 */
export function generateVoiceNarration(steps, language = 'en') {
  if (!steps.length) return ''

  const lines = steps.map((step, i) => {
    if (language === 'hi') {
      if (step.isCrossFloor) return `चरण ${i + 1}: ${step.instruction.replace('Take the lift', 'लिफ्ट लें').replace('Take the staircase', 'सीढ़ी से जाएं').replace('up to', 'ऊपर').replace('down to', 'नीचे')}`
      if (i === steps.length - 1) return `चरण ${i + 1}: आप ${step.toLabel} पहुँच गए हैं`
      return `चरण ${i + 1}: ${step.instruction.replace('Walk along the corridor', 'गलियारे में चलें').replace('Walk to', 'चलकर जाएं').replace('Start at', 'शुरू करें')}`
    }
    if (language === 'mr') {
      if (step.isCrossFloor) return `चरण ${i + 1}: ${step.instruction.replace('Take the lift', 'लिफ्ट घ्या').replace('Take the staircase', 'जिन्याने जा').replace('up to', 'वर').replace('down to', 'खाली')}`
      if (i === steps.length - 1) return `चरण ${i + 1}: तुम्ही ${step.toLabel} ला पोहोचलात`
      return `चरण ${i + 1}: ${step.instruction.replace('Walk along the corridor', 'कॉरिडॉरमधून चला').replace('Walk to', 'चालत जा').replace('Start at', 'सुरू करा')}`
    }
    return `Step ${i + 1}: ${step.instruction}. ${step.distance > 0 ? `About ${step.distance} meters.` : ''}`
  })

  return lines.join('. ')
}

// Re-export graph data for convenience
export { NODES, EDGES, FLOOR_LABELS }
