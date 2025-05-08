
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
        console.error('Failed to initialize proxy system:', error);
        // Continue with the app even if the proxy system fails
      });

    // Listen for service worker updates
    const handleSwUpdate = () => {
      console.log('Service worker update detected');
      setSwUpdateAvailable(true);
    };

    window.addEventListener('sw-update-available', handleSwUpdate);

    return () => {
      window.removeEventListener('sw-update-available', handleSwUpdate);
    };
  }, []);

  const handleSwUpdateAccept = () => {
    // Send message to skip waiting
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
  };

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
