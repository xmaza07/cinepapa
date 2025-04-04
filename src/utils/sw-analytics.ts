import { getServiceWorkerMetrics } from './sw-messaging';
import { getStorageUsageSummary } from './cache-cleanup';

// Avoid flooding analytics in development
const isDev = process.env.NODE_ENV === 'development';

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

interface PerformanceMetrics {
  cacheHitRate: number;
  networkSuccessRate: number;
  storageUtilization: number;
  timestamp: number;
}

class ServiceWorkerAnalytics {
  private static instance: ServiceWorkerAnalytics;
  private lastReportTime: number = 0;
  private REPORT_INTERVAL = 15 * 60 * 1000; // 15 minutes

  private constructor() {
    this.initializeAnalytics();
  }

  static getInstance(): ServiceWorkerAnalytics {
    if (!ServiceWorkerAnalytics.instance) {
      ServiceWorkerAnalytics.instance = new ServiceWorkerAnalytics();
    }
    return ServiceWorkerAnalytics.instance;
  }

  private initializeAnalytics() {
    if (!isDev) {
      // Start periodic reporting
      this.scheduleMetricsReport();
      
      // Listen for specific events
      window.addEventListener('online', () => this.trackEvent({
        category: 'Connectivity',
        action: 'Online'
      }));
      
      window.addEventListener('offline', () => this.trackEvent({
        category: 'Connectivity',
        action: 'Offline'
      }));
    }
  }

  private async calculatePerformanceMetrics(): Promise<PerformanceMetrics> {
    const [swMetrics, storageData] = await Promise.all([
      getServiceWorkerMetrics(),
      getStorageUsageSummary()
    ]);

    const totalCacheAttempts = Object.values(swMetrics.cacheMetrics).reduce((acc, curr) => {
      return acc + curr.hits + curr.misses;
    }, 0);

    const totalCacheHits = Object.values(swMetrics.cacheMetrics).reduce((acc, curr) => {
      return acc + curr.hits;
    }, 0);

    const totalNetworkRequests = 
      swMetrics.networkMetrics.successes + 
      swMetrics.networkMetrics.failures + 
      swMetrics.networkMetrics.timeouts;

    return {
      cacheHitRate: totalCacheAttempts ? (totalCacheHits / totalCacheAttempts) * 100 : 0,
      networkSuccessRate: totalNetworkRequests ? 
        (swMetrics.networkMetrics.successes / totalNetworkRequests) * 100 : 0,
      storageUtilization: storageData ? 
        parseFloat(storageData.percentageUsed.replace('%', '')) : 0,
      timestamp: Date.now()
    };
  }

  private async scheduleMetricsReport() {
    try {
      const metrics = await this.calculatePerformanceMetrics();
      
      // Report metrics
      this.trackEvent({
        category: 'Performance',
        action: 'CacheHitRate',
        value: Math.round(metrics.cacheHitRate)
      });

      this.trackEvent({
        category: 'Performance',
        action: 'NetworkSuccessRate',
        value: Math.round(metrics.networkSuccessRate)
      });

      this.trackEvent({
        category: 'Storage',
        action: 'Utilization',
        value: Math.round(metrics.storageUtilization)
      });

      // Schedule next report
      setTimeout(() => this.scheduleMetricsReport(), this.REPORT_INTERVAL);
      
    } catch (error) {
      console.error('Error reporting service worker metrics:', error);
    }
  }

  private trackEvent(event: AnalyticsEvent) {
    if (isDev) return;

    // Avoid flooding analytics
    const now = Date.now();
    if (now - this.lastReportTime < 1000) return; // Minimum 1 second between events
    this.lastReportTime = now;

    try {
      if ('gtag' in window) {
        (window as any).gtag('event', event.action, {
          event_category: event.category,
          event_label: event.label,
          value: event.value
        });
      }
    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }

  // Public methods for tracking specific events
  trackCacheEvent(success: boolean, cacheType: string) {
    this.trackEvent({
      category: 'Cache',
      action: success ? 'Hit' : 'Miss',
      label: cacheType
    });
  }

  trackNetworkEvent(success: boolean, url: string) {
    this.trackEvent({
      category: 'Network',
      action: success ? 'Success' : 'Failure',
      label: new URL(url).hostname
    });
  }

  trackStorageCleanup(bytesFreed: number) {
    this.trackEvent({
      category: 'Storage',
      action: 'Cleanup',
      value: Math.round(bytesFreed / 1024) // Convert to KB
    });
  }
}

export const swAnalytics = ServiceWorkerAnalytics.getInstance();