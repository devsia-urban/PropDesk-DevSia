/*
 * DevSia Service Worker v2
 * Handles background push notifications & offline caching for PWA.
 */

const CACHE_NAME = 'propdesk-v2'
const OFFLINE_URL = '/dashboard'

// ── Install: cache critical shell assets ──────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/dashboard',
        '/manifest.json',
        '/icon-192.png',
        '/icon-512.png',
        '/apple-touch-icon.png',
      ])
    })
  )
  self.skipWaiting()
})

// ── Activate: clean up old caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch: Network-first for API, cache-first for static assets ───────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (event.request.url.includes('/api/') || event.request.url.includes('supabase.co')) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match(OFFLINE_URL)))
  )
})

// ── Push: Show notification ────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: '/icon-192.png',
      data: {
        url: data.url || '/dashboard'
      },
      tag: data.tag || 'propdesk-notification',
      renotify: true,
      vibrate: [200, 100, 200, 100, 200],
      silent: false,
      requireInteraction: true,
      actions: [
        { action: 'open', title: 'View Now' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    }

    event.waitUntil(self.registration.showNotification(data.title, options))
  } catch (error) {
    console.error('[SW] Push error:', error)
  }
})

// ── Notification Click ─────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const urlToOpen = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(urlToOpen)
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})
