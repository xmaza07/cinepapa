
import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { ThemeProvider } from './contexts/theme';
import { UserPreferencesProvider } from './contexts/user-preferences';
import { WatchHistoryProvider } from './contexts/watch-history';
import { ServiceWorkerErrorBoundary } from './components/ServiceWorkerErrorBoundary';
import { ServiceWorkerDebugPanel } from './components/ServiceWorkerDebugPanel';
import { ServiceWorkerUpdateNotification } from './components/ServiceWorkerUpdateNotification';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks';
import { ChatbotProvider } from './contexts/chatbot-context';
import ChatbotButton from './components/chatbot/ChatbotButton';
import ChatbotWindow from './components/chatbot/ChatbotWindow';
import AppRoutes from './routes.tsx';
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
  const [swUpdateAvailable, setSwUpdateAvailable] = useState(false);

  useEffect(() => {
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
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <UserPreferencesProvider>
              <WatchHistoryProvider>
                <ChatbotProvider>
                  <ServiceWorkerErrorBoundary>
                    <BrowserRouter>
                      <AppRoutes />
                      <Toaster />
                      {isDevelopment && <ServiceWorkerDebugPanel />}
                      {swUpdateAvailable && (
                        <ServiceWorkerUpdateNotification 
                          onAcceptUpdate={handleSwUpdateAccept}
                          onDismiss={() => setSwUpdateAvailable(false)}
                        />
                      )}
                      <ChatbotButton />
                      <ChatbotWindow />
                    </BrowserRouter>
                  </ServiceWorkerErrorBoundary>
                </ChatbotProvider>
              </WatchHistoryProvider>
            </UserPreferencesProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

export default App;
