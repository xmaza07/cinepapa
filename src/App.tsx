
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/toaster';
import { Toaster as Sonner } from './components/ui/sonner';
import { ThemeProvider } from './contexts/theme';
import { UserPreferencesProvider } from './contexts/user-preferences';
import { WatchHistoryProvider } from './contexts/watch-history';
import { ServiceWorkerErrorBoundary } from './components/ServiceWorkerErrorBoundary';
import { ServiceWorkerUpdateNotification } from './components/ServiceWorkerUpdateNotification';
import { AuthProvider } from './hooks/auth-context';
import { ChatbotProvider } from './contexts/chatbot-context';
import ChatbotButton from './components/chatbot/ChatbotButton';
import ChatbotWindow from './components/chatbot/ChatbotWindow';
import AppRoutes from './routes.tsx';
import { initializeProxySystem } from './utils/proxy-sw-registration';
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

function App() {
  const isDevelopment = import.meta.env.DEV;
  const [swUpdateAvailable, setSwUpdateAvailable] = React.useState(false);

  React.useEffect(() => {
    // Initialize the proxy system with error handling
    initializeProxySystem()
      .then(registered => {
        console.log(`Proxy system ${registered ? 'registered successfully' : 'not registered or using fallback'}`);
      })
      .catch(error => {
        // Enhanced error handling: show user-friendly message
        console.error('Failed to initialize proxy system:', error);
        if (window && 'Notification' in window) {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('Proxy System Error', {
                body: 'Failed to initialize proxy system. Some features may not work offline.',
              });
            }
          });
        }
      });

    // Listen for service worker updates
    const handleSwUpdate = () => {
      try {
        console.log('Service worker update detected');
        setSwUpdateAvailable(true);
      } catch (err) {
        console.error('Error handling service worker update:', err);
      }
    };

    window.addEventListener('sw-update-available', handleSwUpdate);

    // Enhanced error handling for event listener
    return () => {
      try {
        window.removeEventListener('sw-update-available', handleSwUpdate);
      } catch (err) {
        console.error('Error removing sw-update-available event listener:', err);
      }
    };
  }, []);


  /**
   * Handles acceptance of a service worker update.
   * Sends a message to the waiting service worker to skip waiting,
   * and reloads the page when the new service worker takes control.
   * Enhanced with error handling and user notification.
   */
  const handleSwUpdateAccept = () => {
    try {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }
      // Listen for controllerchange and reload when new SW takes control
      const reloadOnControllerChange = () => {
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener('controllerchange', reloadOnControllerChange, { once: true });
    } catch (err) {
      console.error('Error during service worker update acceptance:', err);
      if (window && 'Notification' in window) {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Update Error', {
              body: 'Failed to apply the update. Please refresh the page manually.',
            });
          }
        });
      }
    }
  };
/**
 * App component for the Flicker Dreams Factory PWA.
 *
 * Handles service worker update notifications, error boundaries, and context providers.
 *
 * - Shows a notification when a new service worker is available.
 * - Handles update acceptance and reloads the app when the new service worker takes control.
 * - Provides enhanced error handling and user notifications for critical failures.
 */

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ServiceWorkerErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <UserPreferencesProvider>
                <WatchHistoryProvider>
                  <ChatbotProvider>
                    <AppRoutes />
                    <Toaster />
                    <Sonner />
                    {isDevelopment && (
                      <div id="service-worker-debug" className="hidden"></div>
                    )}
                    {swUpdateAvailable && (
                      <ServiceWorkerUpdateNotification 
                        onAcceptUpdate={handleSwUpdateAccept}
                        onDismiss={() => setSwUpdateAvailable(false)}
                      />
                    )}
                    <ChatbotButton />
                    <ChatbotWindow />
                  </ChatbotProvider>
                </WatchHistoryProvider>
              </UserPreferencesProvider>
            </AuthProvider>
          </ThemeProvider>
        </ServiceWorkerErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
