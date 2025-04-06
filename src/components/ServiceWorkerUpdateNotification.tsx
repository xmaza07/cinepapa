import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface ServiceWorkerUpdateNotificationProps {
  onAcceptUpdate: () => Promise<void>;
  onDismiss: () => void;
}

export function ServiceWorkerUpdateNotification({ 
  onAcceptUpdate, 
  onDismiss 
}: ServiceWorkerUpdateNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isVisible) return null;

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await onAcceptUpdate();
    } catch (error) {
      console.error('Failed to update service worker:', error);
    } finally {
      setIsUpdating(false);
      setIsVisible(false);
    }
  };

  return (
    <Card className="fixed bottom-4 left-4 p-4 space-y-4 w-auto max-w-[90vw] z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg">
      <div className="space-y-2">
        <h3 className="font-semibold">Update Available</h3>
        <p className="text-sm text-muted-foreground">
          A new version is available. Update now for the latest features and improvements?
        </p>
      </div>
      <div className="flex gap-2">
        <Button 
          size="sm" 
          onClick={handleUpdate}
          disabled={isUpdating}
        >
          {isUpdating ? 'Updating...' : 'Update Now'}
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => {
            setIsVisible(false);
            onDismiss();
          }}
          disabled={isUpdating}
        >
          Later
        </Button>
      </div>
    </Card>
  );
}