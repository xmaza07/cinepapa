
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';

// Load Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// For debugging purposes, directly check if the API key is being loaded correctly
console.log("Firebase API key:", import.meta.env.VITE_FIREBASE_API_KEY ? "Available" : "Missing");
console.log("Firebase config:", {
  apiKey: firebaseConfig.apiKey ? "API key exists" : "Missing API key", 
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
});

// Create a .env file if it doesn't exist with the values from the environment
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
// Initialize Firestore with memory-only cache to disable persistence
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache()
});

export default app;
