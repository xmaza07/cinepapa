
/**
 * Proxy Service Worker Registration
 * Handles registering and initializing the iframe proxy service worker
 */

import { registerIframeProxySW, isProxyServiceWorkerActive } from './iframe-proxy-sw';
// ...existing code...

// Initialize the proxy system
export async function initializeProxySystem(): Promise<boolean> {
  try {
    // Wait a brief moment to avoid conflicts with other initializations
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Try to register the service worker
    const registered = await registerIframeProxySW();
    
    // If service worker registration failed, add a fallback popup blocker
    if (!registered || !isProxyServiceWorkerActive()) {
      console.log('Using fallback popup blocker mechanism');
      // ...existing code...
    }
    
    return registered;
  } catch (error) {
    console.error('Failed to initialize proxy system:', error);
    
    // Always inject the fallback as a safety measure
    // ...existing code...
    
    return false;
  }
}

// Monitor the proxy system status
export function getProxySystemStatus(): { active: boolean; type: string } {
  // Safely check if service worker is active without throwing errors
  try {
    const swActive = isProxyServiceWorkerActive();
    
    return {
      active: swActive,
      type: swActive ? 'service-worker' : 'fallback-script'
    };
  } catch (error) {
    console.error('Error checking proxy system status:', error);
    return { 
      active: false, 
      type: 'error'
    };
  }
}
