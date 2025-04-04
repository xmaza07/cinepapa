import { swMonitor } from './sw-monitor';
import { swAnalytics } from './sw-analytics';

// Default cache size limits in bytes
const DEFAULT_CACHE_LIMITS = {
  total: 50 * 1024 * 1024, // 50MB total
  images: 30 * 1024 * 1024, // 30MB for images
  static: 10 * 1024 * 1024, // 10MB for static assets
  api: 5 * 1024 * 1024, // 5MB for API responses
};

export async function initCacheCleanup(checkIntervalMs = 30 * 60 * 1000) { // Every 30 minutes
  // Initial cleanup
  await performCacheCleanup();

  // Schedule periodic cleanup
  setInterval(performCacheCleanup, checkIntervalMs);
}

async function performCacheCleanup() {
  try {
    const metrics = await swMonitor.getStorageMetrics();
    if (!metrics) return;

    const initialUsage = metrics.usage;
    
    // Check total usage against quota
    const quotaPercentage = (metrics.usage / metrics.quota) * 100;
    
    if (quotaPercentage > 80) { // If using more than 80% of quota
      console.log(`Storage usage high (${quotaPercentage.toFixed(2)}%), initiating cleanup...`);
      await swMonitor.cleanupCache(DEFAULT_CACHE_LIMITS.total);
    }

    // Check individual cache sizes
    for (const [cacheName, size] of Object.entries(metrics.cacheSize)) {
      let limit = DEFAULT_CACHE_LIMITS.api; // Default to API limit

      if (cacheName.includes('images')) {
        limit = DEFAULT_CACHE_LIMITS.images;
      } else if (cacheName.includes('static')) {
        limit = DEFAULT_CACHE_LIMITS.static;
      }

      if (size > limit) {
        console.log(`Cache ${cacheName} exceeds limit, cleaning up...`);
        await swMonitor.cleanupCache(limit);
      }
    }

    // Calculate and report bytes freed
    const updatedMetrics = await swMonitor.getStorageMetrics();
    if (updatedMetrics) {
      const bytesFreed = initialUsage - updatedMetrics.usage;
      if (bytesFreed > 0) {
        swAnalytics.trackStorageCleanup(bytesFreed);
      }
    }
  } catch (error) {
    console.error('Error during cache cleanup:', error);
  }
}

// Function to get current storage usage summary
export async function getStorageUsageSummary() {
  const metrics = await swMonitor.getStorageMetrics();
  if (!metrics) return null;

  return {
    totalQuota: formatBytes(metrics.quota),
    usedSpace: formatBytes(metrics.usage),
    percentageUsed: ((metrics.usage / metrics.quota) * 100).toFixed(2) + '%',
    cacheDetails: Object.entries(metrics.cacheSize).map(([name, size]) => ({
      name,
      entries: size,
      limit: formatBytes(getCacheLimitForType(name))
    }))
  };
}

function getCacheLimitForType(cacheName: string): number {
  if (cacheName.includes('images')) {
    return DEFAULT_CACHE_LIMITS.images;
  } else if (cacheName.includes('static')) {
    return DEFAULT_CACHE_LIMITS.static;
  }
  return DEFAULT_CACHE_LIMITS.api;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}