
import { getServiceWorkerMetrics } from './sw-messaging';
import { getStorageUsageSummary } from './cache-cleanup';

// Avoid flooding analytics in development
const isDev = process.env.NODE_ENV === 'development';

// Add proper type definitions for Google Analytics
interface GtagParams {
  event_category?: string;
  event_label?: string;
  value?: number;
}

interface Gtag {
  (command: 'event', action: string, params: GtagParams): void;
}

interface CustomWindow extends Window {
  gtag?: Gtag;
}

declare let window: CustomWindow;

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

interface PerformanceEvent {
  name: string;
  value: number;
  type: 'web-vital' | 'custom' | 'resource' | 'navigation' | 'sw-status';
  url?: string;
}

interface PerformanceMetrics {
  cacheHitRate: number;
  networkSuccessRate: number;
  storageUtilization: number;
  webVitals: Record<string, number>;
  timestamp: number;
}

class ServiceWorkerAnalytics {
  private static instance: ServiceWorkerAnalytics;
  private lastReportTime: number = 0;
  private REPORT_INTERVAL = 15 * 60 * 1000; // 15 minutes
  private webVitalsMetrics: Record<string, number> = {};

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
    // Only initialize in browser environment and production
    if (!isDev && typeof window !== 'undefined') {
      // Start periodic reporting
      this.scheduleMetricsReport();
      
      // Listen for specific events - ensure window exists
      if ('addEventListener' in window) {
        // Bind the method to preserve this context
        const boundTrackEvent = this.trackEvent.bind(this);
        
        window.addEventListener('online', () => {
          boundTrackEvent({
            category: 'Connectivity',
            action: 'Online'
          });
        });
        
        window.addEventListener('offline', () => {
          boundTrackEvent({
            category: 'Connectivity',
            action: 'Offline'
          });
        });
      }
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
      webVitals: this.webVitalsMetrics,
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

      // Report web vitals metrics
      Object.entries(metrics.webVitals).forEach(([name, value]) => {
        this.trackEvent({
          category: 'WebVitals',
          action: name,
          value: Math.round(value)
        });
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
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', event.action, {
          event_category: event.category,
          event_label: event.label,
          value: event.value
        });
      }
    } catch (error) {
      console.warn('Error tracking analytics event:', error);
    }
  }

  // Public method for tracking performance events (Web Vitals and custom)
  trackPerformanceEvent(metric: PerformanceEvent) {
    if (isDev) return;

    // Store web vitals metrics for later reporting
    if (metric.type === 'web-vital') {
      this.webVitalsMetrics[metric.name] = metric.value;
    }

    // Track as regular analytics event
    this.trackEvent({
      category: metric.type === 'web-vital' ? 'WebVitals' : 
                metric.type === 'custom' ? 'CustomMetrics' :
                metric.type === 'resource' ? 'ResourceTiming' :
                metric.type === 'navigation' ? 'NavigationTiming' : 'ServiceWorker',
      action: metric.name,
      label: metric.url,
      value: metric.value
    });
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
    try {
      // Check if the URL is valid first
      let hostname = '';
      if (url.startsWith('http')) {
        hostname = new URL(url).hostname;
      } else if (url.includes('_')) {
        // Handle metric names that use underscores (like TTFB_123)
        hostname = url;
      } else {
        hostname = 'unknown';
      }

      this.trackEvent({
        category: 'Network',
        action: success ? 'Success' : 'Failure',
        label: hostname
      });
    } catch (error) {
      console.warn('Error tracking network event:', error);
    }
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
