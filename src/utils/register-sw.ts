
// Service worker registration and update handling
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // Use window load event to ensure page is fully loaded
      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
      
      // Listen for SW update events
      window.addEventListener('sw-update-available', () => {
        console.log('Service worker update available');
      });
      
      return true;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return false;
    }
  }
  return false;
}

function registerSW() {
  navigator.serviceWorker.register('/sw.js', {
    scope: '/',
    type: 'classic'
  })
  .then((registration) => {
    console.log('ServiceWorker registered with scope:', registration.scope);
    
    // Add message event listener to handle skipWaiting
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SKIP_WAITING') {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      }
    });

    // Handle service worker updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available, notify the UI if needed
          window.dispatchEvent(new CustomEvent('sw-update-available'));
        }
      });
    });
  })
  .catch((error) => {
    console.error('ServiceWorker registration failed:', error);
  });
}
