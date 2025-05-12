// Analytics handling
import { log } from './sw-logging.js';

const analyticsQueue = [];

export function initializeAnalytics() {
  log('info', 'Initializing analytics system');
  return Promise.resolve();
}

export function queueAnalyticsEvent(payload) {
  analyticsQueue.push(payload);
  log('debug', 'Analytics event queued:', payload);
  
  // Try to sync if online
  if (self.navigator.onLine) {
    syncAnalytics();
  }
}

export function syncAnalytics() {
  return Promise.all(
    analyticsQueue.map(payload =>
      fetch('https://www.google-analytics.com/mp/collect?' + new URLSearchParams(payload))
        .then(() => {
          const index = analyticsQueue.indexOf(payload);
          if (index > -1) {
            analyticsQueue.splice(index, 1);
          }
          log('debug', 'Analytics event sent successfully');
        })
        .catch(error => {
          log('error', 'Failed to send analytics event:', error);
        })
    )
  );
}

// Register for background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-analytics') {
    event.waitUntil(syncAnalytics());
  }
});
