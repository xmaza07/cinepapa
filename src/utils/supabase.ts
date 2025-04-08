
// This file now provides local storage utilities instead of Supabase

// Cache expiration durations (in milliseconds)
const CACHE_EXPIRY = {
  SHORT: 15 * 60 * 1000, // 15 minutes
  MEDIUM: 60 * 60 * 1000, // 1 hour
  LONG: 24 * 60 * 60 * 1000, // 1 day
  EXTENDED: 7 * 24 * 60 * 60 * 1000 // 1 week
};

// Storage size limits
const STORAGE_LIMITS = {
  MAX_ITEM_SIZE: 100 * 1024, // 100KB per item
  MAX_TOTAL_SIZE: 5 * 1024 * 1024 // 5MB total
};

// Track stored keys and their metadata
interface StorageMetadata {
  keys: {
    [key: string]: {
      size: number;
      expires: number;
      lastAccessed: number;
    }
  };
  totalSize: number;
}

// Initialize or get metadata
function getStorageMetadata(): StorageMetadata {
  try {
    const metadata = localStorage.getItem('storage_metadata');
    return metadata ? JSON.parse(metadata) : { keys: {}, totalSize: 0 };
  } catch (error) {
    console.error('Error reading storage metadata:', error);
    return { keys: {}, totalSize: 0 };
  }
}

// Update metadata
function updateStorageMetadata(metadata: StorageMetadata): void {
  try {
    localStorage.setItem('storage_metadata', JSON.stringify(metadata));
  } catch (error) {
    console.error('Error updating storage metadata:', error);
  }
}

// Generic function to get data from localStorage with expiration check
export const getLocalData = <T>(key: string, defaultValue: T): T => {
  try {
    const metadata = getStorageMetadata();
    const keyMetadata = metadata.keys[key];
    
    // Check if data exists and hasn't expired
    if (keyMetadata && keyMetadata.expires > Date.now()) {
      const data = localStorage.getItem(key);
      
      // Update last accessed time
      metadata.keys[key].lastAccessed = Date.now();
      updateStorageMetadata(metadata);
      
      return data ? JSON.parse(data) : defaultValue;
    }
    
    // Remove expired item if needed
    if (keyMetadata) {
      console.log(`Cache expired for ${key}, removing`);
      removeLocalData(key);
    }
    
    return defaultValue;
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Generic function to save data to localStorage with expiration
export const saveLocalData = <T>(
  key: string, 
  data: T, 
  expiryTime: number = CACHE_EXPIRY.MEDIUM
): void => {
  try {
    // Convert data to string and check size
    const jsonData = JSON.stringify(data);
    const dataSize = new Blob([jsonData]).size;
    
    // Check if data is too large for a single item
    if (dataSize > STORAGE_LIMITS.MAX_ITEM_SIZE) {
      console.warn(`Data for ${key} exceeds size limit (${dataSize} bytes), not caching`);
      return;
    }
    
    const metadata = getStorageMetadata();
    
    // Check if adding this would exceed our total storage limit
    const currentItemSize = metadata.keys[key]?.size || 0;
    const newTotalSize = metadata.totalSize - currentItemSize + dataSize;
    
    if (newTotalSize > STORAGE_LIMITS.MAX_TOTAL_SIZE) {
      // We need to free up space by removing least recently used items
      cleanupLocalStorage(newTotalSize - STORAGE_LIMITS.MAX_TOTAL_SIZE);
    }
    
    // Save the data
    localStorage.setItem(key, jsonData);
    
    // Update metadata
    metadata.keys[key] = {
      size: dataSize,
      expires: Date.now() + expiryTime,
      lastAccessed: Date.now()
    };
    
    metadata.totalSize = metadata.totalSize - currentItemSize + dataSize;
    updateStorageMetadata(metadata);
    
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Remove a specific key from localStorage
export const removeLocalData = (key: string): void => {
  try {
    const metadata = getStorageMetadata();
    
    if (metadata.keys[key]) {
      // Update total size before removing
      metadata.totalSize -= metadata.keys[key].size;
      delete metadata.keys[key];
      updateStorageMetadata(metadata);
    }
    
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
};

// Clean up localStorage by removing least recently accessed items
export const cleanupLocalStorage = (bytesToFree: number): void => {
  try {
    const metadata = getStorageMetadata();
    
    // Skip if nothing to clean
    if (metadata.totalSize === 0 || bytesToFree <= 0) {
      return;
    }
    
    // Get all keys and sort by last accessed time (oldest first)
    const sortedKeys = Object.keys(metadata.keys).sort(
      (a, b) => metadata.keys[a].lastAccessed - metadata.keys[b].lastAccessed
    );
    
    let freedBytes = 0;
    
    // Remove items until we've freed enough space
    for (const key of sortedKeys) {
      if (freedBytes >= bytesToFree) break;
      
      const itemSize = metadata.keys[key].size;
      removeLocalData(key);
      freedBytes += itemSize;
      
      console.log(`Removed ${key} from cache to free ${itemSize} bytes`);
    }
    
    console.log(`Freed ${freedBytes} bytes from localStorage`);
  } catch (error) {
    console.error('Error cleaning up localStorage:', error);
  }
};

// Function to generate unique IDs (to replace Supabase IDs)
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// Get storage usage statistics
export const getStorageStats = (): { used: number, total: number, items: number } => {
  try {
    const metadata = getStorageMetadata();
    return {
      used: metadata.totalSize,
      total: STORAGE_LIMITS.MAX_TOTAL_SIZE,
      items: Object.keys(metadata.keys).length
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return { used: 0, total: STORAGE_LIMITS.MAX_TOTAL_SIZE, items: 0 };
  }
};
