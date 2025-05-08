
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './contexts/theme';
import { UserPreferencesProvider } from './contexts/user-preferences';
import { WatchHistoryProvider } from './contexts/watch-history';
import { AuthProvider } from './hooks/auth-context';
import { Toaster } from './components/ui/toaster';
import { Toaster as Sonner } from './components/ui/sonner';
import './index.css';

// Import the proxy system
import { initializeProxySystem } from './utils/proxy-sw-registration';
import { ServiceWorkerErrorBoundary } from './components/ServiceWorkerErrorBoundary';

// Wait for DOM content to be fully loaded
const initApp = () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('Root element not found!');
    return;
  }
  
  // Initialize the proxy system with error handling
  initializeProxySystem()
    .then(registered => {
      console.log(`Proxy system ${registered ? 'registered successfully' : 'not registered or using fallback'}`);
    })
    .catch(error => {
      console.error('Failed to initialize proxy system:', error);
      // Continue with the app even if the proxy system fails
    });

  // Render the app
  createRoot(rootElement).render(
    <React.StrictMode>
      <ServiceWorkerErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <ThemeProvider>
              <UserPreferencesProvider>
                <WatchHistoryProvider>
                  <App />
                  <Toaster />
                  <Sonner />
                </WatchHistoryProvider>
              </UserPreferencesProvider>
            </ThemeProvider>
          </AuthProvider>
        </BrowserRouter>
      </ServiceWorkerErrorBoundary>
    </React.StrictMode>
  );
};

// If the DOM is already loaded, run immediately, otherwise wait for the load event
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
