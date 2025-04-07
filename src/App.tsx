import { BrowserRouter } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { ThemeProvider } from './contexts/theme';
import { UserPreferencesProvider } from './contexts/user-preferences';
import { WatchHistoryProvider } from './contexts/watch-history';
import { ServiceWorkerErrorBoundary } from './components/ServiceWorkerErrorBoundary';
import { ServiceWorkerDebugPanel } from './components/ServiceWorkerDebugPanel';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks';
import AppRoutes from './routes.tsx';
import './App.css';

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

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <UserPreferencesProvider>
            <WatchHistoryProvider>
              <ServiceWorkerErrorBoundary>
                <BrowserRouter>
                  <AppRoutes />
                  <Toaster />
                  {isDevelopment && <ServiceWorkerDebugPanel />}
                </BrowserRouter>
              </ServiceWorkerErrorBoundary>
            </WatchHistoryProvider>
          </UserPreferencesProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
