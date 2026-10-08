const CACHE = 'noor-v1'
const PRECACHE = ['/', '/prayer', '/adhkar', '/qibla', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).catch(() => {}))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/_next/webpack-hmr')) return
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
        return res
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('/'))),
  )
})

self.addEventListener('message', (event) => {
  const data = event.data || {}
  if (data.type === 'show-adhan') {
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-512.png',
      badge: '/icon-512.png',
      tag: 'adhan-' + data.prayer,
      requireInteraction: true,
      vibrate: [300, 100, 300, 100, 300],
      dir: 'rtl',
      lang: 'ar',
    })
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus()
      }
      return self.clients.openWindow('/prayer')
    }),
  )
})
