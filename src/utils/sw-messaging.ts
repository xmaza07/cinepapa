import { swMonitor } from './sw-monitor';

export type ServiceWorkerMessage = {
  type: 'CACHE_HIT' | 'CACHE_MISS' | 'CACHE_ERROR' | 'NETWORK_SUCCESS' | 'NETWORK_FAILURE' | 'NETWORK_TIMEOUT';
  cacheName?: string;
  url?: string;
  timestamp: number;
};

export function initServiceWorkerMessaging() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event: MessageEvent<ServiceWorkerMessage>) => {
      const { type, cacheName, timestamp } = event.data;

      switch (type) {
        case 'CACHE_HIT':
          if (cacheName) swMonitor.recordCacheHit(cacheName);
          break;
        case 'CACHE_MISS':
          if (cacheName) swMonitor.recordCacheMiss(cacheName);
          break;
        case 'CACHE_ERROR':
          if (cacheName) swMonitor.recordCacheError(cacheName);
          break;
        case 'NETWORK_SUCCESS':
          swMonitor.recordNetworkSuccess();
          break;
        case 'NETWORK_FAILURE':
          swMonitor.recordNetworkFailure();
          break;
        case 'NETWORK_TIMEOUT':
          swMonitor.recordNetworkTimeout();
          break;
      }
    });
  }
}

export function sendMessageToSW(message: ServiceWorkerMessage) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}

// Function to get metrics summary
export async function getServiceWorkerMetrics() {
  return {
    cacheMetrics: swMonitor.getCacheMetrics(),
    networkMetrics: swMonitor.getNetworkMetrics(),
    timestamp: Date.now()
  };
}

// Function to reset metrics
export function resetServiceWorkerMetrics() {
  swMonitor.reset();
}

// Initialize metrics logging interval (every hour)
export function initMetricsLogging(intervalMs = 60 * 60 * 1000) {
  setInterval(() => {
    swMonitor.logAllMetrics();
  }, intervalMs);
}