
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
console.log("Firebase API key loaded:", import.meta.env.VITE_FIREBASE_API_KEY ? "Yes" : "No");
console.log("Firebase config:", {
  apiKey: firebaseConfig.apiKey ? "Available" : "Missing", 
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
});

// Initialize Firebase only if we have an API key
if (!firebaseConfig.apiKey) {
  console.error("Firebase API key is missing. Authentication will not work properly.");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
// Initialize Firestore with memory-only cache to disable persistence
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache()
});

export default app;
