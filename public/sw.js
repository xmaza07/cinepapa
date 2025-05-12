// Import all service worker modules
importScripts(
  './sw-logging.js',
  './sw-performance.js',
  './sw-network.js',
  './sw-analytics.js'
);

// Core service worker initialization
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      self.initializeLogging(),
      self.initializePerformanceTracking(),
      self.initializeNetworkSimulation(),
      self.initializeAnalytics(),
      caches.open('v1').then((cache) => {
        return cache.addAll([
          '/',
          '/index.html',
          '/offline.html',
          '/favicon.ico',
          '/manifest.json',
          '/logo.jpeg'
        ]);
      })
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.log('info', 'Service Worker activating');
  event.waitUntil(Promise.all([
    self.clients.claim(),
    // Enable navigation preload if it's supported
    self.registration.navigationPreload?.enable()
  ]));
});

// Intercept fetch requests to apply network simulation and tracking
self.addEventListener('fetch', (event) => {
  const tracker = self.trackRequest(event.request.url, performance.now());
  
  event.respondWith(
    // Check cache first
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          tracker.cacheHit();
          return cachedResponse;
        }
        
        tracker.cacheMiss();
        return self.simulateNetworkConditions(event.request)
          .then(response => {
            tracker.success(performance.now());
            // Cache successful responses
            if (response.ok) {
              const responseToCache = response.clone();
              caches.open('v1').then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
            return response;
          })
          .catch(error => {
            tracker.error();
            // For navigation requests, return the offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            throw error;
          });
      })
  );
});

// Handle messages from the debug panel and clients
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'SET_LOG_LEVEL':
      self.setLogLevel(payload.level);
      break;
    case 'SET_NETWORK_CONDITIONS':
      self.setNetworkConditions(payload);
      break;
    case 'GET_METRICS':
      event.source.postMessage({
        type: 'METRICS_UPDATE',
        payload: self.getMetrics()
      });
      break;
    case 'GET_LOGS':
      event.source.postMessage({
        type: 'LOGS_UPDATE',
        payload: self.getLogs()
      });
      break;
    case 'CLEAR_LOGS':
      self.clearLogs();
      break;
    case 'ANALYTICS_EVENT':
      self.queueAnalyticsEvent(payload);
      break;
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
  }
});

// Remove duplicate activate event listener

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

// Remove duplicate fetch event listener and redundant functions

// Remove duplicate message event listener
