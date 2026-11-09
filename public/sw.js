/*
 * Dosman service worker.
 * - Pages: network first, saved so they open without internet.
 * - Hashed assets (/_astro) and photos: cache first.
 * - Never touches /admin.
 * Bump VERSION on every change to this file.
 */
const VERSION = 'v1'
const PAGES = `pages-${VERSION}`
const ASSETS = `assets-${VERSION}`
const PRECACHE = ['/offline.html', '/brand/logo-vertical-current.svg', '/', '/menu']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(PAGES).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![PAGES, ASSETS].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== location.origin || url.pathname.startsWith('/admin')) return

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(PAGES).then((c) => c.put(req, copy))
          return res
        })
        .catch(async () => (await caches.match(req, { ignoreSearch: true })) || caches.match('/offline.html')),
    )
    return
  }

  if (url.pathname.startsWith('/_astro/') || url.pathname.startsWith('/images/') || url.pathname.startsWith('/brand/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(ASSETS).then((c) => c.put(req, copy))
            }
            return res
          }),
      ),
    )
  }
})
