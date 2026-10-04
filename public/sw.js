const CACHE_NAME = 'campuswatt-v1'
const URLS_TO_CACHE = ['/', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  // Don't cache API calls — always go to network
  if (url.pathname.startsWith('/api/')) return
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})