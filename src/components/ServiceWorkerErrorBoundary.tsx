import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ServiceWorkerErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Service Worker error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Service Worker Error</AlertTitle>
          <AlertDescription>
            There was an issue with the service worker. Some offline features may not work.
            Please refresh the page or clear your browser cache if the issue persists.
            Error: {this.state.error?.message}
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}