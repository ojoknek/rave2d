// RAVE 2D service worker: network-first for pages, cache-first for static assets.
const VERSION = 'rave2d-v2';
const PRECACHE = [
  '/',
  '/style.css',
  '/image/RAVE2D-fabicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];
const OFFLINE_URL = '/offline.html';

// Cloudflare Pages redirects /offline.html -> /offline (308). Chrome refuses to
// serve a redirected response for a navigation, so store a clean copy instead.
async function cacheOffline(cache) {
  const res = await fetch(OFFLINE_URL);
  if (!res.ok) return;
  const body = await res.blob();
  await cache.put(OFFLINE_URL, new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  }));
}

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION)
      .then((c) => Promise.all([c.addAll(PRECACHE), cacheOffline(c)]))
      .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // YouTube, fonts etc. go straight to network

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          // don't cache redirected responses (they can't be served to navigations)
          if (res.ok && !res.redirected) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match(OFFLINE_URL)))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      });
      return hit || net;
    })
  );
});
