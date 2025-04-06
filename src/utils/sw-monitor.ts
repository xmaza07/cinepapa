interface NetworkMetrics {
  successes: number;
  failures: number;
  timeouts: number;
}

interface ServiceWorkerDebugMessage {
  type: string;
  clientId: string;
  payload: unknown;
}

class ServiceWorkerMonitor {
  private static instance: ServiceWorkerMonitor;
  private networkMetrics: {
    successes: number;
    failures: number;
    timeouts: number;
  } = {
    successes: 0,
    failures: 0,
    timeouts: 0
  };

  private constructor() {}

  static getInstance(): ServiceWorkerMonitor {
    if (!ServiceWorkerMonitor.instance) {
      ServiceWorkerMonitor.instance = new ServiceWorkerMonitor();
    }
    return ServiceWorkerMonitor.instance;
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
    if (!navigator.serviceWorker.controller) return;

    try {
      await navigator.serviceWorker.controller.postMessage({
        type: 'DEBUG',
        payload: message
      });
    } catch (error) {
      console.error('Failed to send debug message to service worker:', error);
    }
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

  getNetworkMetrics() {
    return { ...this.networkMetrics };
  }
}

export const swMonitor = ServiceWorkerMonitor.getInstance();