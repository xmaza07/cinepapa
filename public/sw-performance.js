// Performance metrics tracking
import { log } from './sw-logging.js';

let metrics = {
  requestCount: 0,
  totalResponseTime: 0,
  cacheHits: 0,
  cacheMisses: 0,
  errors: 0
};

export function initializePerformanceTracking() {
  log('info', 'Initializing performance tracking');
  return Promise.resolve();
}

export function trackRequest(url, startTime) {
  metrics.requestCount++;
  return {
    success: (responseTime) => {
      metrics.totalResponseTime += responseTime;
      log('debug', `Request to ${url} completed in ${responseTime}ms`);
    },
    error: () => {
      metrics.errors++;
      log('error', `Request to ${url} failed`);
    },
    cacheHit: () => {
      metrics.cacheHits++;
      log('debug', `Cache hit for ${url}`);
    },
    cacheMiss: () => {
      metrics.cacheMisses++;
      log('debug', `Cache miss for ${url}`);
    }
  };
}

export function getMetrics() {
  return {
    ...metrics,
    averageResponseTime: metrics.requestCount ? metrics.totalResponseTime / metrics.requestCount : 0
  };
}

// Reset metrics (e.g., for periodic reporting)
export function resetMetrics() {
  metrics = {
    requestCount: 0,
    totalResponseTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0
  };
}
