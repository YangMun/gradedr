/* ============================================================
   GradeR - Service Worker
   Cache-first strategy for all app shell assets.
   Network-first for external CDN (fonts, icons, Chart.js).
   ============================================================ */

const CACHE_NAME = 'gradedr-v2';
const APP_SHELL = [
  '/',
  '/index.html',
  '/css/variables.css',
  '/css/base.css',
  '/css/components.css',
  '/css/sections.css',
  '/js/app.js',
  '/js/calculator.js',
  '/js/charts.js',
  '/js/dataIO.js',
  '/js/gradeScale.js',
  '/js/graduation.js',
  '/js/semesters.js',
  '/js/simulator.js',
  '/js/storage.js',
  '/js/targetGpa.js',
  '/js/ui.js',
  '/favicon.svg',
  '/manifest.json'
];

// Install: pre-cache all app shell assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for same-origin, network-first for CDN
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Network-first for CDN resources (fonts, icons, Chart.js)
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for same-origin assets
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      });
    })
  );
});
