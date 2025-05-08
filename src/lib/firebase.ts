
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFirestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';

// Load Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC0TaRtjDOcQgtTB0UI2XBv4zYYbeTg3FU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "lets-stream-c09e3.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "lets-stream-c09e3",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "lets-stream-c09e3.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1080273996839",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1080273996839:web:2b42f26b59f4e22ff91202",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-691PPKTFXS"
};

// Create a .env file if it doesn't exist with the values from the environment
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize analytics only if it's supported in the current environment
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

// Initialize Firestore with memory-only cache to disable persistence
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache()
});

export default app;
