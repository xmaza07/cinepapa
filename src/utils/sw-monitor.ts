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

  // Enhanced cleanupCache with improved algorithm
  async cleanupCache(targetSize: number): Promise<boolean> {
    try {
      const cacheNames = await window.caches.keys();
      const metrics = await this.getStorageMetrics();
      if (!metrics) return false;
      
      // Calculate how much we need to reduce each cache (proportional to current size)
      const totalCacheSize = Object.values(metrics.cacheSize).reduce((sum, size) => sum + size, 0);
      const reductionFactor = targetSize / totalCacheSize;
      
      for (const cacheName of cacheNames) {
        const currentSize = metrics.cacheSize[cacheName] || 0;
        const targetReduction = currentSize - (currentSize * reductionFactor);
        
        if (targetReduction > 0) {
          // Prioritize which items to keep in this cache
          await this.cleanupSpecificCache(cacheName, currentSize - targetReduction);
        }
      }

      return true;
    } catch (error) {
      console.error('Cache cleanup failed:', error);
      return false;
    }
  }
  
  // New method to clean up a specific cache only
  async cleanupSpecificCache(cacheName: string, targetSize: number): Promise<boolean> {
    try {
      const cache = await window.caches.open(cacheName);
      const keys = await cache.keys();
      
      // Sort keys by accessing timestamp (least recently used first)
      const sortedKeys = await this.sortCacheKeysByAccess(keys);
      
      // Calculate how many items we need to remove
      const itemsToRemove = Math.ceil(keys.length * (1 - (targetSize / keys.length)));
      
      // Remove oldest items first
      for (let i = 0; i < itemsToRemove && i < sortedKeys.length; i++) {
        await cache.delete(sortedKeys[i]);
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to clean up cache ${cacheName}:`, error);
      return false;
    }
  }

  private async sortCacheKeysByAccess(keys: readonly Request[]): Promise<Request[]> {
    // Get cache access stats from local storage
    const accessStats = JSON.parse(localStorage.getItem('cacheAccessStats') || '{}');
    
    // Return a sorted copy of the keys array
    return [...keys].sort((a, b) => {
      const aStats = accessStats[a.url] || { lastAccessed: 0, accessCount: 0 };
      const bStats = accessStats[b.url] || { lastAccessed: 0, accessCount: 0 };
      
      // Sort by last accessed time (older items first to be removed)
      return aStats.lastAccessed - bStats.lastAccessed;
    });
  }

  // Track cache access to better optimize which items to keep
  recordCacheAccess(url: string) {
    try {
      const accessStats = JSON.parse(localStorage.getItem('cacheAccessStats') || '{}');
      
      accessStats[url] = {
        lastAccessed: Date.now(),
        accessCount: (accessStats[url]?.accessCount || 0) + 1
      };
      
      // Limit the size of the stats object to prevent it from growing too large
      const urls = Object.keys(accessStats);
      if (urls.length > 1000) {
        // Sort by last accessed time and keep only the 500 most recent
        const sortedUrls = urls.sort((a, b) => 
          accessStats[b].lastAccessed - accessStats[a].lastAccessed
        ).slice(0, 500);
        
        const prunedStats = {};
        sortedUrls.forEach(url => {
          prunedStats[url] = accessStats[url];
        });
        
        localStorage.setItem('cacheAccessStats', JSON.stringify(prunedStats));
      } else {
        localStorage.setItem('cacheAccessStats', JSON.stringify(accessStats));
      }
    } catch (error) {
      console.error('Failed to record cache access:', error);
    }
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
    // Track cache hit in analytics
    this.trackCacheEvent('hit', cacheName);
  }

  recordCacheMiss(cacheName: string) {
    if (!this.cacheMetrics[cacheName]) {
      this.cacheMetrics[cacheName] = { hits: 0, misses: 0, errors: 0 };
    }
    this.cacheMetrics[cacheName].misses++;
    // Track cache miss in analytics
    this.trackCacheEvent('miss', cacheName);
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

  // New method to track cache events for analytics
  private trackCacheEvent(eventType: 'hit' | 'miss' | 'error', cacheName: string) {
    try {
      const cacheEvents = JSON.parse(localStorage.getItem('cacheEvents') || '[]');
      
      // Add new event with timestamp
      cacheEvents.push({
        type: eventType,
        cache: cacheName,
        timestamp: Date.now()
      });
      
      // Keep only the last 100 events
      const prunedEvents = cacheEvents.slice(-100);
      
      localStorage.setItem('cacheEvents', JSON.stringify(prunedEvents));
    } catch (error) {
      console.error('Failed to track cache event:', error);
    }
  }
}

export const swMonitor = ServiceWorkerMonitor.getInstance();
