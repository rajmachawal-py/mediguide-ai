/**
 * MediGuide AI — Offline Map Cache
 * Caches indoor hospital map data in IndexedDB for offline navigation.
 * 
 * Features:
 * - Stores full map graph (nodes + edges) per hospital
 * - 7-day TTL auto-expiry
 * - Fallback to API when cache is stale
 */

const DB_NAME = 'mediguide_maps'
const DB_VERSION = 1
const STORE_NAME = 'indoor_maps'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * Opens (or creates) the IndexedDB database.
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'hospital_id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Save map data to IndexedDB cache.
 * @param {string} hospitalId
 * @param {Object} mapData - Full map graph { nodes, edges, floors, hospital_name, ... }
 */
export async function saveMapToCache(hospitalId, mapData) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    store.put({
      hospital_id: hospitalId,
      data: mapData,
      cached_at: Date.now(),
    })

    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error)
    })

    console.log(`[OfflineCache] Map cached for hospital ${hospitalId}`)
  } catch (err) {
    console.warn('[OfflineCache] Failed to save map:', err)
  }
}

/**
 * Retrieve cached map data from IndexedDB.
 * Returns null if not cached or expired.
 * @param {string} hospitalId
 * @returns {Promise<Object|null>}
 */
export async function getMapFromCache(hospitalId) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)

    const result = await new Promise((resolve, reject) => {
      const req = store.get(hospitalId)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })

    if (!result) return null

    // Check TTL
    const age = Date.now() - result.cached_at
    if (age > CACHE_TTL_MS) {
      console.log(`[OfflineCache] Cache expired for ${hospitalId} (${Math.round(age / 3600000)}h old)`)
      return null
    }

    console.log(`[OfflineCache] Cache hit for ${hospitalId} (${Math.round(age / 60000)}min old)`)
    return result.data
  } catch (err) {
    console.warn('[OfflineCache] Failed to read cache:', err)
    return null
  }
}

/**
 * Check if a map is cached and not expired.
 * @param {string} hospitalId
 * @returns {Promise<boolean>}
 */
export async function isMapCached(hospitalId) {
  const data = await getMapFromCache(hospitalId)
  return data !== null
}

/**
 * Clear all cached maps.
 */
export async function clearMapCache() {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
    await new Promise((resolve) => { tx.oncomplete = resolve })
    console.log('[OfflineCache] All cached maps cleared')
  } catch (err) {
    console.warn('[OfflineCache] Failed to clear cache:', err)
  }
}

/**
 * Perform BFS pathfinding on cached map data (fully offline).
 * This mirrors the backend navigation_service.py BFS algorithm.
 *
 * @param {Object} mapData - Cached map data { nodes, edges }
 * @param {string} fromNodeId - Starting node ID
 * @param {string} toNodeId - Destination node ID
 * @param {boolean} accessibleOnly - Filter to wheelchair-accessible edges
 * @returns {Object|null} Route result with steps, or null if no path
 */
export function findRouteOffline(mapData, fromNodeId, toNodeId, accessibleOnly = false) {
  const { nodes = [], edges = [] } = mapData
  if (!nodes.length || !edges.length) return null

  // Build node lookup
  const nodeMap = {}
  nodes.forEach(n => { nodeMap[n.id] = n })

  if (!nodeMap[fromNodeId] || !nodeMap[toNodeId]) return null

  // Filter edges
  const filteredEdges = accessibleOnly
    ? edges.filter(e => e.is_accessible !== false)
    : edges

  // Build adjacency list (bidirectional)
  const adjacency = {}
  filteredEdges.forEach(edge => {
    if (!adjacency[edge.from_node_id]) adjacency[edge.from_node_id] = []
    if (!adjacency[edge.to_node_id]) adjacency[edge.to_node_id] = []
    adjacency[edge.from_node_id].push(edge)
    adjacency[edge.to_node_id].push({
      ...edge,
      from_node_id: edge.to_node_id,
      to_node_id: edge.from_node_id,
    })
  })

  // BFS
  const visited = new Set([fromNodeId])
  const queue = [[fromNodeId, []]] // [currentId, pathOfEdges]

  let foundPath = null
  while (queue.length > 0) {
    const [currentId, path] = queue.shift()
    if (currentId === toNodeId) {
      foundPath = path
      break
    }
    for (const edge of (adjacency[currentId] || [])) {
      const neighborId = edge.to_node_id
      if (!visited.has(neighborId)) {
        visited.add(neighborId)
        queue.push([neighborId, [...path, edge]])
      }
    }
  }

  if (!foundPath) return null

  // Build step-by-step directions
  const steps = []
  let totalDistance = 0
  const floorsVisited = []

  foundPath.forEach((edge, i) => {
    const fromNode = nodeMap[edge.from_node_id]
    const toNode = nodeMap[edge.to_node_id]
    const distance = parseFloat(edge.distance_meters || 0)
    totalDistance += distance

    const floor = toNode.floor_number || 0
    if (!floorsVisited.includes(floor)) floorsVisited.push(floor)

    // Direction text
    let direction
    const fromFloor = fromNode.floor_number || 0
    const toFloor = toNode.floor_number || 0
    const toType = toNode.node_type || 'waypoint'

    if (fromFloor !== toFloor) {
      const transport = toType === 'lift' ? 'Lift' : 'Stairs'
      const dir = toFloor > fromFloor ? 'up' : 'down'
      direction = `Take the ${transport} ${dir} from Floor ${fromFloor} to Floor ${toFloor}`
    } else if (i === foundPath.length - 1) {
      direction = toType === 'department'
        ? `You have arrived at ${toNode.label}`
        : `Walk to ${toNode.label} — you have reached your destination`
    } else if (i === 0 && fromNode.node_type === 'entrance') {
      direction = `Enter through ${fromNode.label} and walk towards ${toNode.label}`
    } else {
      direction = `Walk from ${fromNode.label} to ${toNode.label}`
    }

    steps.push({
      step_number: i + 1,
      from_node_id: edge.from_node_id,
      to_node_id: edge.to_node_id,
      from_label: fromNode.label,
      to_label: toNode.label,
      floor,
      distance_meters: distance > 0 ? distance : null,
      direction,
      node_type: toType,
    })
  })

  return {
    from_node: nodeMap[fromNodeId].label,
    to_node: nodeMap[toNodeId].label,
    steps,
    total_steps: steps.length,
    total_distance_meters: totalDistance > 0 ? Math.round(totalDistance * 10) / 10 : null,
    floors_traversed: floorsVisited,
    accessible_route: accessibleOnly,
    is_offline: true,
  }
}
