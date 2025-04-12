import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { initServiceWorkerMessaging } from './utils/sw-messaging';
import { performanceMonitor } from './utils/performance-monitor';

// Start performance monitoring as early as possible
performanceMonitor.initializeMonitoring();

// Service Worker Registration with retry mechanism
const registerServiceWorker = async () => {
  try {
    if ('serviceWorker' in navigator) {
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          // Handled by ServiceWorkerUpdateNotification component
        },
        onRegistered(swRegistration) {
          if (swRegistration) {
            console.log('Service Worker registered successfully');
            
            // Initialize SW monitoring systems
            initServiceWorkerMessaging();
            
            // Check for updates every hour
            setInterval(() => {
              swRegistration.update();
            }, 60 * 60 * 1000);
          }
        },
        onRegisterError(error) {
          console.error('Service Worker registration failed:', error);
          // Retry registration after 5 seconds
          setTimeout(registerServiceWorker, 5000);
        }
      });
    }
  } catch (error) {
    console.error('Service Worker registration error:', error);
    // Retry registration after 5 seconds
    setTimeout(registerServiceWorker, 5000);
  }
};

// Initialize service worker
registerServiceWorker();

// Mount React app
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
