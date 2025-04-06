// Avoid flooding analytics in development
const isDev = process.env.NODE_ENV === 'development';

interface ServiceWorkerMessage {
  type: string;
  timestamp?: number;
}

interface ServiceWorkerMetrics {
  networkSuccess: number;
  networkFailure: number;
  networkTimeout: number;
}

class ServiceWorkerMessaging {
  private static instance: ServiceWorkerMessaging;
  private metrics: ServiceWorkerMetrics = {
    networkSuccess: 0,
    networkFailure: 0,
    networkTimeout: 0
  };

  private constructor() {}

  static getInstance(): ServiceWorkerMessaging {
    if (!ServiceWorkerMessaging.instance) {
      ServiceWorkerMessaging.instance = new ServiceWorkerMessaging();
    }
    return ServiceWorkerMessaging.instance;
  }

  recordNetworkSuccess() {
    this.metrics.networkSuccess++;
    console.debug('[SW] Network request successful');
  }

  recordNetworkFailure() {
    this.metrics.networkFailure++;
    console.error('[SW] Network request failed');
  }

  recordNetworkTimeout() {
    this.metrics.networkTimeout++;
    console.warn('[SW] Network request timed out');
  }

  getMetrics(): ServiceWorkerMetrics {
    return { ...this.metrics };
  }

  initializeMessaging() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event: MessageEvent<ServiceWorkerMessage>) => {
        const { type } = event.data;

        switch (type) {
          case 'NETWORK_SUCCESS':
            this.recordNetworkSuccess();
            break;
          case 'NETWORK_FAILURE':
            this.recordNetworkFailure();
            break;
          case 'NETWORK_TIMEOUT':
            this.recordNetworkTimeout();
            break;
        }
      });
    }
  }
}

export const swMessaging = ServiceWorkerMessaging.getInstance();
export const getServiceWorkerMetrics = () => swMessaging.getMetrics();
export const initServiceWorkerMessaging = () => swMessaging.initializeMessaging();