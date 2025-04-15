
import { getApp, getApps } from 'firebase/app';
import app from '@/lib/firebase';

/**
 * Utility function to ensure the Firebase app is initialized
 * Returns the initialized Firebase app instance
 */
export const ensureFirebaseInitialized = () => {
  if (!getApps().length) {
    console.error('Firebase app not initialized! This should not happen.');
    // We're importing the default app which should initialize Firebase
    return app;
  }
  return getApp();
};
