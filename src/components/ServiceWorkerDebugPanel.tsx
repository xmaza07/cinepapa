import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp?: number;  // Make it optional since not all metrics might have it
}

export function ServiceWorkerDebugPanel() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [controllerState, setControllerState] = useState<string>('');
  const [webVitals, setWebVitals] = useState<WebVitalMetric[]>([]);

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

    // Listen for service worker state changes
    const handleServiceWorkerUpdate = (reg: ServiceWorkerRegistration) => {
      setWaiting(!!reg.waiting);
      setRegistration(reg);
    };

    if (registration) {
      registration.addEventListener('statechange', () => getRegistration());
      registration.addEventListener('controllerchange', () => {
        getRegistration();
        // Reload once the new service worker has taken control
        window.location.reload();
      });
    }

    // Listen for new service workers
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      setControllerState(navigator.serviceWorker.controller ? 'active' : 'none');
    });

    // Listen for messages from performance monitor
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'web-vital') {
        setWebVitals(prev => {
          // Find and update existing metric or add new one
          const exists = prev.findIndex(m => m.name === event.data.name);
          if (exists >= 0) {
            const updated = [...prev];
            updated[exists] = {
              ...updated[exists],
              value: event.data.value,
              timestamp: Date.now()
            };
            return updated;
          }
          return [...prev, { ...event.data, timestamp: Date.now() }];
        });
      }
    };

    window.addEventListener('message', handleMessage);

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
      if (registration) {
        registration.removeEventListener('statechange', () => getRegistration());
        registration.removeEventListener('controllerchange', () => getRegistration());
      }
    };
  }, [registration]);

  const handleSkipWaiting = async () => {
    if (registration?.waiting) {
      // Send skip waiting message to waiting service worker
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  // Return null in production or if no registration
  if (!import.meta.env.DEV || !registration) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 p-4 space-y-4 w-80 z-50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Tabs defaultValue="sw">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sw">Service Worker</TabsTrigger>
          <TabsTrigger value="vitals">Web Vitals</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sw" className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Service Worker Status</h3>
            <p className="text-sm text-muted-foreground">
              Controller: {controllerState}
              {waiting && ' (update available)'}
            </p>
            {registration.active && (
              <p className="text-sm text-muted-foreground">
                Active: {registration.active.state}
              </p>
            )}
            {registration.installing && (
              <p className="text-sm text-muted-foreground">
                Installing: {registration.installing.state}
              </p>
            )}
            {registration.waiting && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Waiting: {registration.waiting.state}
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSkipWaiting}
                >
                  Apply Update
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="vitals" className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Web Vitals</h3>
            {webVitals.map((metric) => (
              <div key={metric.name} className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{metric.name}:</span>
                <span className="text-sm font-medium">{metric.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
