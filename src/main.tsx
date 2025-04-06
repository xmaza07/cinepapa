import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { initServiceWorkerMessaging } from './utils/sw-messaging';
import { performanceMonitor } from './utils/performance-monitor';
import { ServiceWorkerUpdateNotification } from './components/ServiceWorkerUpdateNotification';
import { swManager } from './utils/sw-manager';

// Start performance monitoring as early as possible
performanceMonitor.initializeMonitoring();

// Service Worker Registration with retry mechanism
const registerServiceWorker = async () => {
  try {
    if ('serviceWorker' in navigator) {
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          const root = document.getElementById('sw-update-root');
          if (root) {
            ReactDOM.createRoot(root).render(
              <ServiceWorkerUpdateNotification 
                onAcceptUpdate={async () => {
                  // Clean up expired caches before update
                  await swManager.cleanupExpiredCaches();
                  await updateSW();
                }}
                onDismiss={() => {
                  // Optional: Schedule cleanup for later
                  setTimeout(() => swManager.cleanupExpiredCaches(), 60000);
                }}
              />
            );
          }
        },
        onRegistered(swRegistration) {
          if (swRegistration) {
            // Initialize service worker messaging
            initServiceWorkerMessaging();

            // Setup periodic cache cleanup
            setInterval(() => {
              swManager.cleanupExpiredCaches();
            }, 3600000); // Run every hour
          }
        },
        onRegisterError(error) {
          console.error('Service Worker registration error:', error);
        }
      });
    }
  } catch (error) {
    console.error('Service Worker registration error:', error);
  }
};

// Initialize service worker
registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
