import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFirestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';

// Load Firebase configuration from environment variables with fallbacks
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC0TaRtjDOcQgtTB0UI2XBv4zYYbeTg3FU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "lets-stream-c09e3.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "lets-stream-c09e3",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "lets-stream-c09e3.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1080273996839",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1080273996839:web:2b42f26b59f4e22ff91202",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-691PPKTFXS"
};

// Initialize Firebase with specified config or get existing instance
let app: ReturnType<typeof initializeApp>;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  // If an app already exists, get that instance
  if (error instanceof Error && error.message.includes('duplicate-app')) {
    app = initializeApp();
  } else {
    throw error;
  }
}

export const auth = getAuth(app);

// Initialize analytics only if it's supported in the current environment
let analyticsInstance: ReturnType<typeof getAnalytics> | null = null;

export const initAnalytics = async () => {
  if (await isSupported()) {
    analyticsInstance = getAnalytics(app);
    return analyticsInstance;
  }
  return null;
};

// Get the analytics instance, initializing it if necessary
export const getAnalyticsInstance = async () => {
  if (!analyticsInstance) {
    return initAnalytics();
  }
  return analyticsInstance;
};

// Initialize Firestore with memory-only cache to disable persistence
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache()
});

// Log Firebase configuration for debugging
// console.log("Firebase config:", firebaseConfig);
// if (!firebaseConfig.apiKey) {
//   console.warn("Firebase API key: Missing");
// } else {
//   console.log("Firebase API key: Using provided key");
// }

export { app };
