import { swAnalytics } from './sw-analytics';

interface PerformanceMarks {
  [key: string]: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

interface FirstInputEntry extends PerformanceEntry {
  processingStart: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private marks: PerformanceMarks = {};
  private isEnabled: boolean;

  private constructor() {
    this.isEnabled = 'performance' in window && process.env.NODE_ENV === 'production';
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMeasurement(name: string) {
    if (!this.isEnabled) return;
    this.marks[name] = performance.now();
  }

  endMeasurement(name: string, category: string) {
    if (!this.isEnabled || !this.marks[name]) return;
    
    const duration = performance.now() - this.marks[name];
    delete this.marks[name];

    // Report to analytics if duration is significant (> 100ms)
    if (duration > 100) {
      swAnalytics.trackCacheEvent(true, `${category}_${name}_${Math.round(duration)}`);
    }

    return duration;
  }

  measurePageLoad() {
    if (!this.isEnabled) return;

    // Listen for page load metrics
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          swAnalytics.trackCacheEvent(true, `Performance_LCP_${Math.round(entry.startTime)}`);
        }
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Measure FID (First Input Delay)
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.entryType === 'first-input') {
          const firstInput = entry as FirstInputEntry;
          swAnalytics.trackCacheEvent(
            true, 
            `Performance_FID_${Math.round(firstInput.processingStart - firstInput.startTime)}`
          );
        }
      }
    }).observe({ entryTypes: ['first-input'] });

    // Measure CLS (Cumulative Layout Shift)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const layoutShift = entry as LayoutShiftEntry;
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value;
        }
      }
      // Report CLS when it changes significantly
      swAnalytics.trackCacheEvent(
        true,
        `Performance_CLS_${Math.round(clsValue * 1000) / 1000}`
      );
    }).observe({ entryTypes: ['layout-shift'] });
  }

  measureResourceTiming() {
    if (!this.isEnabled) return;

    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        // Only measure resources that took longer than 1 second
        if (entry.duration > 1000) {
          swAnalytics.trackNetworkEvent(
            true,
            entry.name
          );
        }
      }
    }).observe({ entryTypes: ['resource'] });
  }

  measureNavigationTiming() {
    if (!this.isEnabled) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      // Time to First Byte (TTFB)
      swAnalytics.trackNetworkEvent(
        true,
        `TTFB_${Math.round(navigation.responseStart - navigation.requestStart)}`
      );

      // DOM Interactive
      swAnalytics.trackNetworkEvent(
        true,
        `DOMInteractive_${Math.round(navigation.domInteractive)}`
      );

      // DOM Complete
      swAnalytics.trackNetworkEvent(
        true,
        `DOMComplete_${Math.round(navigation.domComplete)}`
      );
    }
  }

  initializeMonitoring() {
    if (!this.isEnabled) return;

    this.measurePageLoad();
    this.measureResourceTiming();
    this.measureNavigationTiming();

    // Report service worker activation time
    if ('serviceWorker' in navigator) {
      this.startMeasurement('swActivation');
      navigator.serviceWorker.ready.then(() => {
        this.endMeasurement('swActivation', 'ServiceWorker');
      });
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();