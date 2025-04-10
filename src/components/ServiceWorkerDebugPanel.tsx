
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
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
              rating: getRating(event.data.name, event.data.value)
            };
            return updated;
          } else {
            return [...prev, {
              name: event.data.name,
              value: event.data.value,
              rating: getRating(event.data.name, event.data.value)
            }];
          }
        });
      }
    };

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }

    const interval = setInterval(getRegistration, 1000);
    return () => {
      clearInterval(interval);
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
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

  // Helper function to rate Web Vitals metrics
  const getRating = (name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
    switch (name) {
      case 'LCP':
        return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
      case 'FID':
        return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
      case 'CLS':
        return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
      case 'TTFB':
        return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
      case 'INP':
        return value <= 200 ? 'good' : value <= 500 ? 'needs-improvement' : 'poor';
      case 'FCP':
        return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
      default:
        return 'good';
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
            <h3 className="font-semibold">Service Worker Debug</h3>
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
        </TabsContent>
        
        <TabsContent value="vitals" className="space-y-2">
          <h3 className="font-semibold">Web Vitals</h3>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {webVitals.length > 0 ? (
              webVitals.map((metric) => (
                <div key={metric.name} className="flex justify-between items-center text-sm">
                  <span>{metric.name}</span>
                  <span className={
                    metric.rating === 'good' ? 'text-green-500' : 
                    metric.rating === 'needs-improvement' ? 'text-yellow-500' : 
                    'text-red-500'
                  }>
                    {metric.name === 'CLS' ? metric.value.toFixed(3) : `${metric.value}ms`}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No metrics available yet</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
