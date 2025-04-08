// This file now provides Firestore-based data caching utilities

import { db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  Timestamp, 
  updateDoc
} from 'firebase/firestore';
import { auth } from '@/lib/firebase';

// Cache expiration durations (in milliseconds)
const CACHE_EXPIRY = {
  SHORT: 15 * 60 * 1000, // 15 minutes
  MEDIUM: 60 * 60 * 1000, // 1 hour
  LONG: 24 * 60 * 60 * 1000, // 1 day
  EXTENDED: 7 * 24 * 60 * 60 * 1000 // 1 week
};

// Storage size limits for metadata tracking
const STORAGE_LIMITS = {
  MAX_ITEM_SIZE: 100 * 1024, // 100KB per item (for tracking purposes)
  MAX_TOTAL_SIZE: 5 * 1024 * 1024 // 5MB total (for tracking purposes)
};

// Get the current user ID or generate an anonymous one for offline use
export const getUserId = () => {
  const user = auth.currentUser;
  if (user) return user.uid;
  
  // For offline or not logged in users, use a consistent local ID
  let anonymousId = localStorage.getItem('anonymous_user_id');
  if (!anonymousId) {
    anonymousId = `anonymous-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('anonymous_user_id', anonymousId);
  }
  return anonymousId;
};

// Create cache collection reference
const getCacheCollectionRef = () => collection(db, 'cache');

// Generic function to get data from Firestore with expiration check
export const getLocalData = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const userId = getUserId();
    const cacheDocRef = doc(db, 'cache', `${userId}_${key}`);
    
    // Check if we have network connection
    if (!navigator.onLine) {
      // If offline, try to get from localStorage as fallback
      const localData = localStorage.getItem(`cache_${key}`);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (parsed.expires > Date.now()) {
            return parsed.data;
          }
        } catch (e) {
          console.error('Error parsing local cache:', e);
        }
      }
      return defaultValue;
    }
    
    const docSnap = await getDoc(cacheDocRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Check if data hasn't expired
      if (data.expires.toMillis() > Date.now()) {
        // Update last accessed time
        await updateDoc(cacheDocRef, {
          lastAccessed: Timestamp.now()
        });
        
        // Also update localStorage for offline access
        localStorage.setItem(`cache_${key}`, JSON.stringify({
          data: data.value,
          expires: data.expires.toMillis()
        }));
        
        return data.value;
      }
      
      // Remove expired item
      await deleteDoc(cacheDocRef);
      localStorage.removeItem(`cache_${key}`);
    }
    
    return defaultValue;
  } catch (error) {
    console.error(`Error retrieving ${key} from Firestore:`, error);
    
    // Try localStorage as fallback
    try {
      const localData = localStorage.getItem(`cache_${key}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed.expires > Date.now()) {
          return parsed.data;
        }
      }
    } catch (e) {
      console.error('Error retrieving from local cache:', e);
    }
    
    return defaultValue;
  }
};

// Generic function to save data to Firestore with expiration
export const saveLocalData = async <T>(
  key: string, 
  data: T, 
  expiryTime: number = CACHE_EXPIRY.MEDIUM
): Promise<void> => {
  try {
    const userId = getUserId();
    const cacheDocRef = doc(db, 'cache', `${userId}_${key}`);
    
    // Calculate expiration timestamp
    const expires = Timestamp.fromMillis(Date.now() + expiryTime);
    
    // Convert data to string to estimate size
    const jsonData = JSON.stringify(data);
    const dataSize = new Blob([jsonData]).size;
    
    // Check if data is too large for a single item
    if (dataSize > STORAGE_LIMITS.MAX_ITEM_SIZE) {
      console.warn(`Data for ${key} exceeds size limit (${dataSize} bytes), not caching`);
      return;
    }
    
    // Save to Firestore
    await setDoc(cacheDocRef, {
      value: data,
      expires: expires,
      lastAccessed: Timestamp.now(),
      size: dataSize,
      key: key
    });
    
    // Also save to localStorage for offline access
    localStorage.setItem(`cache_${key}`, JSON.stringify({
      data: data,
      expires: Date.now() + expiryTime
    }));
    
    // Clean up old cache entries if we're online
    if (navigator.onLine) {
      cleanupCache();
    }
  } catch (error) {
    console.error(`Error saving ${key} to Firestore:`, error);
    
    // Fallback to localStorage if Firestore fails
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify({
        data: data,
        expires: Date.now() + expiryTime
      }));
    } catch (e) {
      console.error('Error saving to local cache:', e);
    }
  }
};

// Remove a specific key from Firestore cache
export const removeLocalData = async (key: string): Promise<void> => {
  try {
    const userId = getUserId();
    const cacheDocRef = doc(db, 'cache', `${userId}_${key}`);
    
    await deleteDoc(cacheDocRef);
    localStorage.removeItem(`cache_${key}`);
  } catch (error) {
    console.error(`Error removing ${key} from Firestore:`, error);
  }
};

// Clean up Firestore cache by removing least recently accessed items
export const cleanupCache = async (bytesToFree: number = 0): Promise<void> => {
  if (!navigator.onLine) return;
  
  try {
    const userId = getUserId();
    const cacheCollectionRef = getCacheCollectionRef();
    
    // Query for expired items first
    const expiredQuery = query(
      cacheCollectionRef,
      where('expires', '<', Timestamp.now()),
      where('key', '>=', userId),
      where('key', '<=', userId + '\uf8ff')
    );
    
    const expiredSnapshot = await getDocs(expiredQuery);
    let freedBytes = 0;
    
    // Delete expired items
    const expiredPromises = expiredSnapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      freedBytes += data.size || 0;
      await deleteDoc(docSnap.ref);
      
      // Also remove from localStorage
      const key = data.key.replace(`${userId}_`, '');
      localStorage.removeItem(`cache_${key}`);
    });
    
    await Promise.all(expiredPromises);
    
    // If we need to free more space, delete older items by access time
    if (bytesToFree > 0 && bytesToFree > freedBytes) {
      const oldestQuery = query(
        cacheCollectionRef,
        where('key', '>=', userId),
        where('key', '<=', userId + '\uf8ff'),
        orderBy('lastAccessed', 'asc'),
        limit(10)
      );
      
      const oldestSnapshot = await getDocs(oldestQuery);
      
      const oldestPromises = oldestSnapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        freedBytes += data.size || 0;
        await deleteDoc(docSnap.ref);
        
        // Also remove from localStorage
        const key = data.key.replace(`${userId}_`, '');
        localStorage.removeItem(`cache_${key}`);
      });
      
      await Promise.all(oldestPromises);
    }
    
    console.log(`Freed ${freedBytes} bytes from cache`);
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  }
};

// Function to generate unique IDs 
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// Get storage usage statistics
export const getStorageStats = async (): Promise<{ used: number, total: number, items: number }> => {
  try {
    const userId = getUserId();
    const cacheCollectionRef = getCacheCollectionRef();
    
    const userCacheQuery = query(
      cacheCollectionRef,
      where('key', '>=', userId),
      where('key', '<=', userId + '\uf8ff')
    );
    
    const snapshot = await getDocs(userCacheQuery);
    let totalSize = 0;
    
    snapshot.docs.forEach(doc => {
      totalSize += doc.data().size || 0;
    });
    
    return {
      used: totalSize,
      total: STORAGE_LIMITS.MAX_TOTAL_SIZE,
      items: snapshot.docs.length
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return { used: 0, total: STORAGE_LIMITS.MAX_TOTAL_SIZE, items: 0 };
  }
};

// Sync offline cache to Firestore when coming back online
export const syncOfflineCache = async (): Promise<void> => {
  if (!navigator.onLine) return;
  
  try {
    const keysToSync = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cache_')) {
        keysToSync.push(key.replace('cache_', ''));
      }
    }
    
    for (const key of keysToSync) {
      const localData = localStorage.getItem(`cache_${key}`);
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (parsed.expires > Date.now()) {
            // Save to Firestore without updating localStorage again
            const userId = getUserId();
            const cacheDocRef = doc(db, 'cache', `${userId}_${key}`);
            
            const expires = Timestamp.fromMillis(parsed.expires);
            const dataSize = new Blob([JSON.stringify(parsed.data)]).size;
            
            await setDoc(cacheDocRef, {
              value: parsed.data,
              expires: expires,
              lastAccessed: Timestamp.now(),
              size: dataSize,
              key: key
            });
          } else {
            // Remove expired data
            localStorage.removeItem(`cache_${key}`);
          }
        } catch (e) {
          console.error(`Error syncing key ${key}:`, e);
        }
      }
    }
    
    console.log('Offline cache synced to Firestore');
  } catch (error) {
    console.error('Error syncing offline cache:', error);
  }
};

// Initialize online/offline event listeners for syncing
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Back online, syncing cache...');
    syncOfflineCache();
  });
}
