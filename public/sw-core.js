// Core service worker functionality
import { initializeLogging, log } from './sw-logging.js';
import { initializePerformanceTracking } from './sw-performance.js';
import { initializeNetworkSimulation } from './sw-network.js';
import { initializeAnalytics } from './sw-analytics.js';

// Initialize all modules
self.addEventListener('install', (event) => {
  log('info', 'Service Worker installing');
  event.waitUntil(
    Promise.all([
      initializeLogging(),
      initializePerformanceTracking(),
      initializeNetworkSimulation(),
      initializeAnalytics(),
      caches.open('v1').then((cache) => {
        return cache.addAll([
          '/',
          '/index.html',
          '/offline.html',
          '/favicon.ico'
        ]);
      })
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  log('info', 'Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// Message handling from debug panel
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SET_LOG_LEVEL':
      setLogLevel(payload.level);
      break;
    case 'SET_NETWORK_CONDITIONS':
      setNetworkConditions(payload);
      break;
    default:
      // Forward to appropriate module based on message type
      break;
  }
});
