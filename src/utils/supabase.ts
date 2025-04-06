// This file now provides storage utilities instead of Supabase

// Helper to check storage quota
const isStorageQuotaExceeded = (): boolean => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return false;
  } catch (e) {
    return true;
  }
};

// Function to estimate storage usage
const getStorageEstimate = async (): Promise<{ quota: number; usage: number }> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      quota: estimate.quota || 0,
      usage: estimate.usage || 0
    };
  }
  return { quota: 0, usage: 0 };
};

// Generic function to get data from localStorage with expiry check
export const getLocalData = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;

    const data = JSON.parse(item);
    // Check if data has expired
    if (data.expiry && Date.now() > data.expiry) {
      localStorage.removeItem(key);
      return defaultValue;
    }
    return data.value ?? defaultValue;
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Generic function to save data to localStorage with optional expiry
export const saveLocalData = <T>(
  key: string, 
  data: T, 
  expiryInMinutes?: number
): void => {
  try {
    // Check storage quota before saving
    if (isStorageQuotaExceeded()) {
      cleanupExpiredData();
      if (isStorageQuotaExceeded()) {
        throw new Error('Storage quota exceeded even after cleanup');
      }
    }

    const item = {
      value: data,
      timestamp: Date.now(),
      expiry: expiryInMinutes ? Date.now() + expiryInMinutes * 60 * 1000 : null
    };

    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Function to clean up expired data from localStorage
export const cleanupExpiredData = async (): Promise<void> => {
  try {
    // Clean localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const data = JSON.parse(item);
            if (data.expiry && Date.now() > data.expiry) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            // Skip if item can't be parsed
            continue;
          }
        }
      }
    }

    // Clean IndexedDB caches
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      const deletionPromises = cacheKeys.map(async (key) => {
        try {
          const cache = await caches.open(key);
          const requests = await cache.keys();
          const now = Date.now();

          // Delete cached requests older than 7 days
          const deletePromises = requests.map(async (request) => {
            const response = await cache.match(request);
            if (response) {
              const dateHeader = response.headers.get('date');
              if (dateHeader) {
                const cacheTime = new Date(dateHeader).getTime();
                if (now - cacheTime > 7 * 24 * 60 * 60 * 1000) {
                  await cache.delete(request);
                }
              }
            }
          });

          await Promise.all(deletePromises);
        } catch (e) {
          console.error(`Error cleaning cache ${key}:`, e);
        }
      });

      await Promise.all(deletionPromises);
    }

    // Perform storage cleanup if usage is high
    const { quota, usage } = await getStorageEstimate();
    if (quota > 0 && usage / quota > 0.9) {
      // If storage usage is over 90%, trigger a more aggressive cleanup
      if ('storage' in navigator && 'persist' in navigator.storage) {
        await navigator.storage.persist();
      }
    }
  } catch (error) {
    console.error('Error cleaning up storage:', error);
  }
};

// Function to completely clear all storage
export const clearAllStorage = async (): Promise<void> => {
  try {
    // Clear localStorage
    localStorage.clear();

    // Clear all caches
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
    }

    // Clear IndexedDB databases
    if ('indexedDB' in window) {
      const databases = await window.indexedDB.databases?.() || [];
      await Promise.all(
        databases.map(db => {
          return new Promise<void>((resolve, reject) => {
            if (db.name) {
              const request = window.indexedDB.deleteDatabase(db.name);
              request.onsuccess = () => resolve();
              request.onerror = () => reject(request.error);
            } else {
              resolve();
            }
          });
        })
      );
    }
  } catch (error) {
    console.error('Error clearing all storage:', error);
    throw error;
  }
};

// Function to generate unique IDs
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};
