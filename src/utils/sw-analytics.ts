// Avoid flooding analytics in development
const isDev = process.env.NODE_ENV === 'development';

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

interface CustomWindow extends Window {
  gtag?: (command: string, action: string, params: {
    event_category?: string;
    event_label?: string;
    value?: number;
    [key: string]: unknown;
  }) => void;
}

declare let window: CustomWindow;

class ServiceWorkerAnalytics {
  private static instance: ServiceWorkerAnalytics;
  private lastReportTime: number = 0;
  private readonly REPORT_INTERVAL = 15 * 60 * 1000; // 15 minutes

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

  // Public methods for tracking specific events
  trackNetworkEvent(success: boolean, url: string) {
    try {
      // Check if the URL is valid first
      let hostname = '';
      if (url.startsWith('http')) {
        hostname = new URL(url).hostname;
      } else if (url.includes('_')) {
        // Handle metric names that use underscores
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
}

export const swAnalytics = ServiceWorkerAnalytics.getInstance();