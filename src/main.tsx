// Type for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}
// Re-enable iframe proxy service worker registration (does not affect main SW)
import { registerIframeProxySW } from './utils/iframe-proxy-sw';
// Store the event on the window so React components can access it
window.addEventListener('beforeinstallprompt', (e) => {
  window.__deferredPWAInstallPrompt = e as BeforeInstallPromptEvent;
});

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize the app after DOM is fully loaded
const initApp = () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('Root element not found!');
    return;
  }
  
  // Create a root and render the app
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Register the iframe proxy service worker (does not affect main SW)
  registerIframeProxySW();
};

// If the DOM is already loaded, run immediately, otherwise wait for the load event
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
