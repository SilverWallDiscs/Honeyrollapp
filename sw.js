/**
 * sw.js — Service Worker de Honeyroll ♡
 * Cache-first para assets estáticos → funciona offline
 */

const CACHE = 'honeyroll-v2';

const PRECACHE = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './Assets/Habitacion.png',
  './Assets/Honeydefault.png',
  './Assets/Honeydurmiendo.png',
  './Assets/Honeyfeliz.png',
  './Assets/icon.ico',
];

/* ── Instalación: pre-cachear todos los assets ── */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

/* ── Activación: limpiar caches viejos ── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch: cache-first, fallback a red ── */
self.addEventListener('fetch', e => {
  /* Solo interceptar GET */
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request).then(response => {
        /* Solo cachear respuestas válidas del mismo origen */
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return response;
      });
    })
  );
});
