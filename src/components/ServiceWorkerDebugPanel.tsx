import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';

export function ServiceWorkerDebugPanel() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [controllerState, setControllerState] = useState<string>('');

  useEffect(() => {
    // Don't run effect in production
    if (!import.meta.env.DEV) return;

    async function getRegistration() {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        setRegistration(reg || null);
        setWaiting(!!reg?.waiting);
        setControllerState(navigator.serviceWorker.controller ? 'active' : 'none');
      } catch (error) {
        console.error('Failed to get service worker registration:', error);
      }
    }

    getRegistration();

    const interval = setInterval(getRegistration, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSkipWaiting = async () => {
    if (!registration?.waiting) return;
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  };

  const handleUnregister = async () => {
    if (!registration) return;
    await registration.unregister();
    window.location.reload();
  };

  // Return null in production or if no registration
  if (!import.meta.env.DEV || !registration) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 p-4 space-y-4 w-80 z-50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="space-y-2">
        <h3 className="font-semibold">Service Worker Debug Panel</h3>
        <p className="text-sm text-muted-foreground">
          Controller: {controllerState}
          {waiting && ' (update available)'}
        </p>
      </div>
      <div className="flex gap-2">
        {waiting && (
          <Button size="sm" onClick={handleSkipWaiting}>
            Apply Update
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={handleUnregister}>
          Unregister
        </Button>
      </div>
    </Card>
  );
}