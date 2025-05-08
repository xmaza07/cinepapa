
// Utility for iframe proxy service worker management

/**
 * Register the iframe proxy service worker
 */
export async function registerIframeProxySW(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker is not supported in this browser');
    return false;
  }
  
  try {
    // Register the service worker with appropriate scope
    const registration = await navigator.serviceWorker.register('/iframe-proxy-sw.js', {
      scope: '/',
      type: 'classic',
      updateViaCache: 'none'
    });
    
    console.log('Iframe Proxy Service Worker registered with scope:', registration.scope);
    
    // Check if service worker is active
    if (registration.active) {
      console.log('Iframe Proxy Service Worker is active');
    } else {
      console.log('Iframe Proxy Service Worker is installing/waiting');
      
      // Wait for the service worker to be activated
      if (registration.installing) {
        registration.installing.addEventListener('statechange', (event) => {
          if ((event.target as ServiceWorker).state === 'activated') {
            console.log('Iframe Proxy Service Worker now active');
          }
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('Iframe Proxy Service Worker registration failed:', error);
    return false;
  }
}

/**
 * Register an iframe origin with the service worker
 * Call this when creating iframes to help the service worker identify iframe origins
 */
export function registerIframeOrigin(iframeUrl: string): void {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    return;
  }
  
  try {
    const url = new URL(iframeUrl);
    navigator.serviceWorker.controller.postMessage({
      type: 'REGISTER_IFRAME_ORIGIN',
      origin: url.origin
    });
    
    console.log('Registered iframe origin with service worker:', url.origin);
  } catch (error) {
    console.error('Failed to register iframe origin:', error);
  }
}

/**
 * Set custom headers for a specific domain to be used by the proxy
 */
export function setProxyHeaders(domain: string, headers: Record<string, string>): void {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    return;
  }
  
  try {
    navigator.serviceWorker.controller.postMessage({
      type: 'SET_PROXY_HEADERS',
      domain,
      headers
    });
    
    console.log('Set proxy headers for domain:', domain);
  } catch (error) {
    console.error('Failed to set proxy headers:', error);
  }
}

/**
 * Create a Cloudflare worker proxy URL for a given URL
 */
export function createProxyUrl(url: string, headers?: Record<string, string>): string {
  const params = new URLSearchParams();
  params.append('url', url);
  
  if (headers) {
    params.append('headers', JSON.stringify(headers));
  }
  
  return `/worker-proxy?${params.toString()}`;
}

/**
 * Reset all stored data in the service worker
 * Useful for debugging or when changing iframe contexts
 */
export function resetServiceWorkerData(): void {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    return;
  }
  
  try {
    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_DATA'
    });
    
    console.log('Reset service worker stored data');
  } catch (error) {
    console.error('Failed to reset service worker data:', error);
  }
}

/**
 * Check if the iframe proxy service worker is active
 */
export function isProxyServiceWorkerActive(): boolean {
  return !!(navigator.serviceWorker && navigator.serviceWorker.controller);
}
