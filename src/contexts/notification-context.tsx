import React, { createContext, useCallback, useContext } from 'react';
import * as Toast from '@radix-ui/react-toast';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  title: string;
  description?: string;
  type: NotificationType;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { ...notification, id }]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      <Toast.Provider swipeDirection="right">
        {children}
        {notifications.map((notification) => (
          <Toast.Root
            key={notification.id}
            className={`notification-toast notification-${notification.type}`}
            duration={notification.duration || 5000}
            onOpenChange={(open) => {
              if (!open) removeNotification(notification.id);
            }}
          >
            <Toast.Title className="notification-title">{notification.title}</Toast.Title>
            {notification.description && (
              <Toast.Description className="notification-description">
                {notification.description}
              </Toast.Description>
            )}
          </Toast.Root>
        ))}
        <Toast.Viewport className="notification-viewport" />
      </Toast.Provider>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
