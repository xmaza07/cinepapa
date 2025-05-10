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

// Store for offline analytics events
const analyticsQueue = [];

// Listen for analytics events from the main thread
self.addEventListener('message', (event) => {
  if (event.data.type === 'ANALYTICS_EVENT') {
    if (self.navigator.onLine) {
      // If online, try to send immediately
      fetch('https://www.google-analytics.com/mp/collect?' + new URLSearchParams(event.data.payload))
        .catch(() => {
          // If sending fails, queue the event
          analyticsQueue.push(event.data.payload);
        });
    } else {
      // If offline, queue the event
      analyticsQueue.push(event.data.payload);
    }
  }
});

// When coming back online, try to send queued events
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-analytics') {
    event.waitUntil(
      Promise.all(
        analyticsQueue.map(payload =>
          fetch('https://www.google-analytics.com/mp/collect?' + new URLSearchParams(payload))
        )
      ).then(() => {
        // Clear the queue after successful sync
        analyticsQueue.length = 0;
      })
    );
  }
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  // Claim clients so that the service worker starts controlling all pages
  event.waitUntil(self.clients.claim());
  
  // Enable navigation preload if it's supported
  if (self.registration.navigationPreload) {
    event.waitUntil(
      self.registration.navigationPreload.enable()
    );
  }
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
  // Properly handle navigation preload
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        // First, try to use the navigation preload response if it's available
        const preloadResponse = await event.preloadResponse;
        if (preloadResponse) {
          return preloadResponse;
        }

        // If preload isn't available or fails, use the network (with cache fallback)
        return await cacheFirstWithNetworkFallback(event.request);
      } catch (error) {
        // If all fails, show offline page
        const cache = await caches.open('v1');
        return await cache.match('/offline.html') || new Response('Offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    })());
  } 
  else if (event.request.url.includes('/assets/') && 
      (event.request.url.endsWith('.js') || event.request.url.includes('.js?'))) {
    
    // Special handling for dynamic JS imports
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
