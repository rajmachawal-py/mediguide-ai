/**
 * MediGuide AI — Service Worker
 * Caches app shell and navigation API responses for offline use.
 *
 * Strategy:
 * - App shell (HTML/JS/CSS): Cache-first, network-update
 * - API /navigation/*: Network-first, cache-fallback (stale-while-revalidate)
 * - Other API calls: Network-only (triage needs real-time AI)
 */

const CACHE_NAME = 'mediguide-v1'

// App shell files to pre-cache
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
]

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching app shell')
      return cache.addAll(APP_SHELL).catch(() => {
        // Some files may not exist in dev, that's OK
        console.warn('[SW] Some shell files could not be cached')
      })
    })
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

// Fetch: apply caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Navigation API calls: network-first, cache-fallback
  if (url.pathname.includes('/api/navigation/')) {
    event.respondWith(networkFirstThenCache(event.request))
    return
  }

  // Hospital API calls: network-first, cache-fallback
  if (url.pathname.includes('/api/hospitals/')) {
    event.respondWith(networkFirstThenCache(event.request))
    return
  }

  // App shell / static assets: cache-first, network-fallback
  if (
    event.request.destination === 'document' ||
    event.request.destination === 'script' ||
    event.request.destination === 'style' ||
    event.request.destination === 'image' ||
    event.request.destination === 'font'
  ) {
    event.respondWith(cacheFirstThenNetwork(event.request))
    return
  }
})

/**
 * Network-first with cache fallback.
 * Used for API data that should be fresh when online, but available offline.
 */
async function networkFirstThenCache(request) {
  const cache = await caches.open(CACHE_NAME)

  try {
    const networkResponse = await fetch(request)
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch {
    // Network failed — try cache
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      console.log('[SW] Serving from cache (offline):', request.url)
      return cachedResponse
    }

    // No cache either — return offline fallback
    return new Response(
      JSON.stringify({ error: 'Offline — no cached data available' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

/**
 * Cache-first with network fallback.
 * Used for app shell / static assets that rarely change.
 */
async function cacheFirstThenNetwork(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    const cache = await caches.open(CACHE_NAME)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch {
    // Nothing in cache, no network — return basic offline page
    if (request.destination === 'document') {
      return new Response(
        `<!DOCTYPE html>
        <html><head><title>MediGuide AI — Offline</title>
        <style>
          body { font-family: sans-serif; background: #0a0f1c; color: #e2e8f0;
                 display: flex; align-items: center; justify-content: center;
                 height: 100vh; margin: 0; text-align: center; }
          h1 { font-size: 1.5rem; }
          p { color: #94a3b8; font-size: 0.875rem; }
        </style></head>
        <body>
          <div>
            <h1>📡 You're Offline</h1>
            <p>MediGuide AI requires an internet connection for AI triage.<br>
            Indoor hospital maps may be available offline if previously viewed.</p>
          </div>
        </body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }
    return new Response('Offline', { status: 503 })
  }
}
