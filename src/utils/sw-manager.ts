import { swMonitor } from './sw-monitor';

interface CacheCleanupOptions {
  cacheName?: string;
  ignoreSearch?: boolean;
  ignoreMethod?: boolean;
}

class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  
  private constructor() {}

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  async cleanupRouteCache(url: string, options: CacheCleanupOptions = {}): Promise<void> {
    if (!('caches' in window)) return;

    const {
      cacheName,
      ignoreSearch = true,
      ignoreMethod = true
    } = options;

    try {
      if (cacheName) {
        // Clean specific cache
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        const urlObj = new URL(url, window.location.origin);
        
        for (const request of requests) {
          const reqUrl = new URL(request.url);
          
          // Check if URLs match based on options
          if (this.urlsMatch(reqUrl, urlObj, { ignoreSearch, ignoreMethod })) {
            await cache.delete(request);
            console.debug(`[SW] Cleaned up cache for: ${request.url}`);
          }
        }
      } else {
        // Clean all caches
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          const cache = await caches.open(name);
          const requests = await cache.keys();
          const urlObj = new URL(url, window.location.origin);
          
          for (const request of requests) {
            const reqUrl = new URL(request.url);
            if (this.urlsMatch(reqUrl, urlObj, { ignoreSearch, ignoreMethod })) {
              await cache.delete(request);
              console.debug(`[SW] Cleaned up cache for: ${request.url} in cache: ${name}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('[SW] Cache cleanup failed:', error);
    }
  }

  private urlsMatch(url1: URL, url2: URL, options: { ignoreSearch: boolean; ignoreMethod: boolean }): boolean {
    if (options.ignoreSearch) {
      return url1.origin + url1.pathname === url2.origin + url2.pathname;
    }
    return url1.href === url2.href;
  }

  async cleanupExpiredCaches(): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      const timestamp = Date.now();
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const headers = response.headers;
            const expires = headers.get('expires');
            const maxAge = headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1];
            
            if (expires) {
              const expiryDate = new Date(expires).getTime();
              if (timestamp > expiryDate) {
                await cache.delete(request);
                console.debug(`[SW] Cleaned up expired cache for: ${request.url}`);
              }
            } else if (maxAge) {
              const maxAgeMs = parseInt(maxAge) * 1000;
              const dateHeader = headers.get('date');
              if (dateHeader) {
                const responseDate = new Date(dateHeader).getTime();
                if (timestamp > responseDate + maxAgeMs) {
                  await cache.delete(request);
                  console.debug(`[SW] Cleaned up expired cache for: ${request.url}`);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[SW] Expired cache cleanup failed:', error);
    }
  }

  async refreshCache(url: string): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const response = await fetch(url);
      if (!response.ok) return;

      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        await cache.put(url, response.clone());
      }
      console.debug(`[SW] Cache refreshed for: ${url}`);
    } catch (error) {
      console.error('[SW] Cache refresh failed:', error);
    }
  }
}

export const swManager = ServiceWorkerManager.getInstance();