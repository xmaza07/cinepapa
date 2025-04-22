
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from './ui/use-toast';

interface ServiceWorkerUpdateNotificationProps {
  onAcceptUpdate: () => void;
  onDismiss: () => void;
}

export function ServiceWorkerUpdateNotification({ 
  onAcceptUpdate, 
  onDismiss 
}: ServiceWorkerUpdateNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Show a toast notification about the service worker error on mount
    toast({
      title: "Service Worker Issue Detected",
      description: "There might be issues with offline functionality. Updating might help resolve the problem.",
      variant: "destructive",
      duration: 5000,
    });
  }, []);

  if (!isVisible) return null;

  return (
    <Card className="fixed bottom-4 left-4 p-4 space-y-4 w-auto max-w-[90vw] z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg">
      <div className="space-y-2">
        <h3 className="font-semibold">Update Available</h3>
        <p className="text-sm text-muted-foreground">
          A new version is available. Update now to fix service worker issues and get the latest features.
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => {
          setIsVisible(false);
          onAcceptUpdate();
          window.location.reload(); // Force reload to apply the service worker update
        }}>
          Update Now
        </Button>
        <Button size="sm" variant="outline" onClick={() => {
          setIsVisible(false);
          onDismiss();
        }}>
          Later
        </Button>
      </div>
    </Card>
  );
}
