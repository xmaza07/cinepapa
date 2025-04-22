
// Service Worker file for offline functionality
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/offline.html',
        '/favicon.ico'
      ]);
    })
  );
  // Force the service worker to become active right away
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  // Claim clients so that the service worker starts controlling all pages
  event.waitUntil(self.clients.claim());
});

// This helps with dynamic imports
const cacheFirstWithNetworkFallback = async (request) => {
  try {
    // Try to get from cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache, try network
    const networkResponse = await fetch(request);
    
    // Cache successful responses for next time
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open('v1');
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Error fetching resource:', error);
    
    // For navigation requests, return the offline page
    if (request.mode === 'navigate') {
      const cache = await caches.open('v1');
      return cache.match('/offline.html');
    }
    
    return new Response('Network error happened', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};

self.addEventListener('fetch', (event) => {
  // Special handling for dynamic JS imports
  if (event.request.url.includes('/assets/') && 
      (event.request.url.endsWith('.js') || event.request.url.includes('.js?'))) {
    
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response to store in cache
          const responseToCache = response.clone();
          caches.open('v1').then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(async () => {
          // Try to return from cache if network fails
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          
          console.error('Failed to fetch dynamic import:', event.request.url);
          // Return a simple error response if we can't fetch and don't have it cached
          return new Response('Failed to load dynamic import', {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
          });
        })
    );
  } else {
    // Regular fetch handling for other resources
    event.respondWith(cacheFirstWithNetworkFallback(event.request));
  }
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
