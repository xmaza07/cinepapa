
import { swMonitor } from './sw-monitor';
import { swAnalytics } from './sw-analytics';
import { saveLocalData, getLocalData } from './supabase';

// Optimized cache size limits in bytes (reduced from previous values)
const DEFAULT_CACHE_LIMITS = {
  total: 30 * 1024 * 1024, // 30MB total (down from 50MB)
  images: 15 * 1024 * 1024, // 15MB for images (down from 30MB)
  static: 5 * 1024 * 1024,  // 5MB for static assets (down from 10MB)
  api: 2 * 1024 * 1024,     // 2MB for API responses (down from 5MB)
};

// More frequent cache cleanup (15 minutes instead of 30)
export async function initCacheCleanup(checkIntervalMs = 15 * 60 * 1000) {
  // Load previously saved cache metrics if available
  const savedMetrics = getLocalData('cacheMetrics', null);
  
  // Initial cleanup (more aggressive if we have previous metrics)
  await performCacheCleanup(savedMetrics ? 70 : 80);

  // Schedule periodic cleanup
  setInterval(performCacheCleanup, checkIntervalMs);
  
  // Add listener for low storage events
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    window.addEventListener('storage-low', async () => {
      console.log('Low storage event detected, performing emergency cleanup');
      await performCacheCleanup(50); // More aggressive threshold
    });
  }
}

// Added threshold parameter for more flexible cleanup policies
async function performCacheCleanup(quotaThresholdPercent = 80) {
  try {
    const metrics = await swMonitor.getStorageMetrics();
    if (!metrics) return;

    const initialUsage = metrics.usage;
    
    // Check total usage against quota
    const quotaPercentage = (metrics.usage / metrics.quota) * 100;
    
    // Save metrics for trend analysis
    saveLocalData('cacheMetrics', {
      timestamp: Date.now(),
      usage: metrics.usage,
      quota: metrics.quota,
      percentage: quotaPercentage,
    });
    
    if (quotaPercentage > quotaThresholdPercent) {
      console.log(`Storage usage high (${quotaPercentage.toFixed(2)}%), initiating cleanup...`);
      await swMonitor.cleanupCache(DEFAULT_CACHE_LIMITS.total * 0.7); // Clean more aggressively
    }

    // Always check individual cache sizes regardless of total usage
    const cacheNames = Object.keys(metrics.cacheSize || {});
    
    // Sort caches by size (largest first) for more efficient cleanup
    const sortedCaches = cacheNames.sort((a, b) => 
      (metrics.cacheSize[b] || 0) - (metrics.cacheSize[a] || 0)
    );
    
    for (const cacheName of sortedCaches) {
      const size = metrics.cacheSize[cacheName] || 0;
      let limit = DEFAULT_CACHE_LIMITS.api; // Default to API limit

      if (cacheName.includes('images') || cacheName.includes('tmdb-images')) {
        limit = DEFAULT_CACHE_LIMITS.images;
      } else if (cacheName.includes('static') || cacheName.includes('assets')) {
        limit = DEFAULT_CACHE_LIMITS.static;
      }

      if (size > limit) {
        console.log(`Cache ${cacheName} exceeds limit (${formatBytes(size)}/${formatBytes(limit)}), cleaning up...`);
        await swMonitor.cleanupSpecificCache(cacheName, limit * 0.8);
      }
    }

    // Calculate and report bytes freed
    const updatedMetrics = await swMonitor.getStorageMetrics();
    if (updatedMetrics) {
      const bytesFreed = initialUsage - updatedMetrics.usage;
      if (bytesFreed > 0) {
        console.log(`Freed ${formatBytes(bytesFreed)} of cache storage`);
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

  // Get historical usage data for better analysis
  const historicalMetrics = getLocalData('cacheMetricHistory', []);
  
  return {
    totalQuota: formatBytes(metrics.quota),
    usedSpace: formatBytes(metrics.usage),
    percentageUsed: ((metrics.usage / metrics.quota) * 100).toFixed(2) + '%',
    cacheDetails: Object.entries(metrics.cacheSize).map(([name, size]) => ({
      name,
      size: formatBytes(size),
      entries: size,
      limit: formatBytes(getCacheLimitForType(name)),
      utilizationPercent: ((size / getCacheLimitForType(name)) * 100).toFixed(2) + '%'
    })),
    historicalUsage: historicalMetrics.length > 0 ? {
      trend: calculateTrend(historicalMetrics),
      lastWeekAverage: formatBytes(calculateAverageUsage(historicalMetrics, 7))
    } : null
  };
}

// Helper function to calculate usage trend from historical data
function calculateTrend(metrics) {
  if (metrics.length < 2) return 'stable';
  
  const oldest = metrics[0];
  const newest = metrics[metrics.length - 1];
  
  const change = newest.usage - oldest.usage;
  const percentChange = (change / oldest.usage) * 100;
  
  if (percentChange > 10) return 'increasing';
  if (percentChange < -10) return 'decreasing';
  return 'stable';
}

// Helper function to calculate average usage over a period (days)
function calculateAverageUsage(metrics, days) {
  const now = Date.now();
  const cutoff = now - (days * 24 * 60 * 60 * 1000);
  
  const recentMetrics = metrics.filter(m => m.timestamp >= cutoff);
  if (recentMetrics.length === 0) return 0;
  
  return recentMetrics.reduce((sum, m) => sum + m.usage, 0) / recentMetrics.length;
}

function getCacheLimitForType(cacheName) {
  if (cacheName.includes('images') || cacheName.includes('tmdb-images')) {
    return DEFAULT_CACHE_LIMITS.images;
  } else if (cacheName.includes('static') || cacheName.includes('assets')) {
    return DEFAULT_CACHE_LIMITS.static;
  }
  return DEFAULT_CACHE_LIMITS.api;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// New utility function to prioritize cache items for retention
export function prioritizeCacheItems(items, maxItems) {
  // Sort by importance/recency
  return items.sort((a, b) => {
    // Priority 1: Recently accessed items
    const aLastAccessed = a.lastAccessed || 0;
    const bLastAccessed = b.lastAccessed || 0;
    
    // Priority 2: Frequently accessed items
    const aFrequency = a.accessCount || 0;
    const bFrequency = b.accessCount || 0;
    
    // Combined score (higher is better)
    const aScore = (aLastAccessed / 1000) + (aFrequency * 10000);
    const bScore = (bLastAccessed / 1000) + (bFrequency * 10000);
    
    return bScore - aScore;
  }).slice(0, maxItems);
}
