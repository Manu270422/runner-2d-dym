// sw.js — Service Worker para PWA offline
// Estrategia: Cache First para assets, Network First para HTML

const CACHE = 'runner2d-dym-v2';

const PRECACHE = [
  './',
  './index.html',
  './offline.html',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Yo uso Cache First para JS/CSS/audio/imágenes (cambian poco)
  if (/\.(js|css|wav|mp3|ogg|png|jpg|svg|woff2?)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        }).catch(() => caches.match('./offline.html'));
      })
    );
    return;
  }

  // Para el resto (HTML, navegación) — Network First
  e.respondWith(
    fetch(e.request)
      .catch(() => caches.match(e.request)
        .then(res => res || caches.match('./offline.html'))
      )
  );
});
