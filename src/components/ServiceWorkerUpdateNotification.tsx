import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface ServiceWorkerUpdateNotificationProps {
  onAcceptUpdate: () => void;
  onDismiss: () => void;
}

export function ServiceWorkerUpdateNotification({ 
  onAcceptUpdate, 
  onDismiss 
}: ServiceWorkerUpdateNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <Card className="fixed bottom-4 left-4 p-4 space-y-4 w-auto max-w-[90vw] z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg">
      <div className="space-y-2">
        <h3 className="font-semibold">Update Available</h3>
        <p className="text-sm text-muted-foreground">
          A new version is available. Update now for the latest features and improvements?
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => {
          setIsVisible(false);
          onAcceptUpdate();
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