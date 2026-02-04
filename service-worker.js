const CACHE_NAME = 'thingy-v1';
const urlsToCache = [
  '/THINGY/',
  '/THINGY/index.html',
  '/THINGY/styles.css',
  '/THINGY/app.js',
  '/THINGY/manifest.json',
  '/THINGY/icons/icon-192x192.svg',
  '/THINGY/icons/icon-512x512.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
