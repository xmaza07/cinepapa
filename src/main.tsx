
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

// Wait for DOM to be ready before initializing the proxy system
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the proxy system
  initializeProxySystem().then(registered => {
    console.log(`Proxy system ${registered ? 'registered successfully' : 'not registered or using fallback'}`);
  }).catch(error => {
    console.error('Failed to initialize proxy system:', error);
    // Continue with the app even if the proxy system fails
  });
});

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
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
  </React.StrictMode>
);
