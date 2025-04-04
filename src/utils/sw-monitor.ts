interface StorageMetrics {
  quota: number;
  usage: number;
  cacheSize: { [key: string]: number };
}

interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
}

interface NetworkMetrics {
  successes: number;
  failures: number;
  timeouts: number;
}

interface ServiceWorkerMetrics {
  cacheStats: { [key: string]: CacheMetrics };
  networkStats: NetworkMetrics;
  storageUsage: StorageMetrics | null;
}

interface ServiceWorkerDebugMessage {
  type: string;
  clientId: string;
  payload: unknown;
}

class ServiceWorkerMonitor {
  private static instance: ServiceWorkerMonitor;
  private debugMode: boolean = false;
  private swInstance: ServiceWorker | null = null;
  private clientId: string;
  private cacheMetrics: { [key: string]: CacheMetrics } = {};
  private networkMetrics: NetworkMetrics = {
    successes: 0,
    failures: 0,
    timeouts: 0
  };

  private constructor() {
    this.clientId = crypto.randomUUID();
    this.initializeMonitoring();
  }

  static getInstance(): ServiceWorkerMonitor {
    if (!ServiceWorkerMonitor.instance) {
      ServiceWorkerMonitor.instance = new ServiceWorkerMonitor();
    }
    return ServiceWorkerMonitor.instance;
  }

  private async initializeMonitoring() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.active) {
          this.swInstance = registration.active;
          this.setupMessageHandling();
        }
      } catch (error) {
        console.error('Failed to initialize SW monitoring:', error);
      }
    }
  }

  private setupMessageHandling() {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'sw-metrics') {
        this.logMetrics(event.data.metrics);
      }
    });
  }

  private logMetrics(metrics: ServiceWorkerMetrics) {
    if (this.debugMode) {
      console.group('Service Worker Metrics');
      console.log('Cache Stats:', metrics.cacheStats);
      console.log('Network Stats:', metrics.networkStats);
      console.log('Storage Usage:', metrics.storageUsage);
      console.groupEnd();
    }
  }

  async logAllMetrics() {
    const metrics = {
      cacheStats: this.getCacheMetrics(),
      networkStats: this.getNetworkMetrics(),
      storageUsage: await this.getStorageMetrics()
    };
    this.logMetrics(metrics);
  }

  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
  }

  getClientId(): string {
    return this.clientId;
  }

  async getStorageMetrics(): Promise<StorageMetrics | null> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const caches = await window.caches.keys();
        
        const cacheSizes: { [key: string]: number } = {};
        for (const cacheName of caches) {
          const cache = await window.caches.open(cacheName);
          const keys = await cache.keys();
          cacheSizes[cacheName] = keys.length;
        }

        return {
          quota: estimate.quota || 0,
          usage: estimate.usage || 0,
          cacheSize: cacheSizes
        };
      }
    } catch (error) {
      console.error('Failed to get storage metrics:', error);
    }
    return null;
  }

  async cleanupCache(targetSize: number): Promise<boolean> {
    try {
      const cacheNames = await window.caches.keys();
      let totalCleared = 0;

      for (const cacheName of cacheNames) {
        const cache = await window.caches.open(cacheName);
        const keys = await cache.keys();
        
        // Sort by last accessed (if available)
        const sortedKeys = await this.sortCacheKeysByAccess(keys);
        
        // Remove items until we're under target size
        for (const key of sortedKeys) {
          if (totalCleared >= targetSize) break;
          
          await cache.delete(key);
          totalCleared++;
        }
      }

      return true;
    } catch (error) {
      console.error('Cache cleanup failed:', error);
      return false;
    }
  }

  private async sortCacheKeysByAccess(keys: readonly Request[]): Promise<Request[]> {
    // In a real implementation, you might want to track access times
    // For now, we'll just return a copy of the keys array
    return [...keys];
  }

  async unregisterServiceWorker(): Promise<boolean> {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
      return true;
    } catch (error) {
      console.error('Failed to unregister service worker:', error);
      return false;
    }
  }

  async updateServiceWorker(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      return true;
    } catch (error) {
      console.error('Failed to update service worker:', error);
      return false;
    }
  }

  // Debug utility to send a message to the service worker
  async sendDebugMessage(message: ServiceWorkerDebugMessage): Promise<void> {
    if (this.swInstance) {
      this.swInstance.postMessage(message);
    }
  }

  // Method to check if a URL is cached
  async isUrlCached(url: string): Promise<boolean> {
    try {
      const cacheNames = await window.caches.keys();
      for (const cacheName of cacheNames) {
        const cache = await window.caches.open(cacheName);
        const response = await cache.match(url);
        if (response) return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to check cache:', error);
      return false;
    }
  }

  // Method to get cache statistics
  async getCacheStats(): Promise<{ [key: string]: number }> {
    const stats: { [key: string]: number } = {};
    try {
      const cacheNames = await window.caches.keys();
      for (const cacheName of cacheNames) {
        const cache = await window.caches.open(cacheName);
        const keys = await cache.keys();
        stats[cacheName] = keys.length;
      }
    } catch (error) {
      console.error('Failed to get cache stats:', error);
    }
    return stats;
  }

  recordCacheHit(cacheName: string) {
    if (!this.cacheMetrics[cacheName]) {
      this.cacheMetrics[cacheName] = { hits: 0, misses: 0, errors: 0 };
    }
    this.cacheMetrics[cacheName].hits++;
  }

  recordCacheMiss(cacheName: string) {
    if (!this.cacheMetrics[cacheName]) {
      this.cacheMetrics[cacheName] = { hits: 0, misses: 0, errors: 0 };
    }
    this.cacheMetrics[cacheName].misses++;
  }

  recordCacheError(cacheName: string) {
    if (!this.cacheMetrics[cacheName]) {
      this.cacheMetrics[cacheName] = { hits: 0, misses: 0, errors: 0 };
    }
    this.cacheMetrics[cacheName].errors++;
  }

  recordNetworkSuccess() {
    this.networkMetrics.successes++;
  }

  recordNetworkFailure() {
    this.networkMetrics.failures++;
  }

  recordNetworkTimeout() {
    this.networkMetrics.timeouts++;
  }

  getCacheMetrics() {
    return { ...this.cacheMetrics };
  }

  getNetworkMetrics() {
    return { ...this.networkMetrics };
  }

  reset() {
    this.cacheMetrics = {};
    this.networkMetrics = {
      successes: 0,
      failures: 0,
      timeouts: 0
    };
  }
}

export const swMonitor = ServiceWorkerMonitor.getInstance();