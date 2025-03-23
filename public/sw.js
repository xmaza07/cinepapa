const cacheName = 'fdf-cache-v1';
const assetsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
  '/src/index.css',
  '/src/App.css',
  '/src/main.tsx',
  '/src/App.tsx',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => {
        console.log('Caching assets');
        return cache.addAll(assetsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(oldCacheName => oldCacheName !== cacheName)
          .map(oldCacheName => {
            console.log('Clearing old cache:', oldCacheName);
            return caches.delete(oldCacheName);
          })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
