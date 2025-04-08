
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUserId } from './supabase';

// This utility helps migrate existing localStorage data to Firestore
export const migrateLocalStorageToFirestore = async () => {
  try {
    console.log('Starting migration of localStorage data to Firestore...');
    const userId = await getUserId();
    let migratedItems = 0;
    
    // Process all localStorage items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // Skip certain keys that shouldn't be migrated
      if (!key || 
          key === 'anonymous_user_id' || 
          key.startsWith('firebase:') || 
          key.startsWith('sentry') ||
          key.startsWith('_')) {
        continue;
      }
      
      try {
        // Get the item data
        const value = localStorage.getItem(key);
        if (!value) continue;
        
        let parsedValue;
        let expires;
        
        // If it's a stringified object, parse it
        if (value.startsWith('{') || value.startsWith('[')) {
          try {
            parsedValue = JSON.parse(value);
            
            // If it has an expires property, use it
            if (parsedValue && typeof parsedValue === 'object' && parsedValue.expires) {
              expires = Timestamp.fromMillis(parsedValue.expires);
              parsedValue = parsedValue.data || parsedValue;
            } else {
              // Set default expiration (30 days)
              expires = Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000);
            }
          } catch (e) {
            // If parsing fails, store as string
            parsedValue = value;
            expires = Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000);
          }
        } else {
          // Store as string
          parsedValue = value;
          expires = Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
        
        // Prepare data for Firestore
        const dataSize = new Blob([JSON.stringify(parsedValue)]).size;
        const firestoreKey = `${userId}_${key}`;
        
        // Save to Firestore
        const cacheDocRef = doc(db, 'cache', firestoreKey);
        await setDoc(cacheDocRef, {
          key,
          value: parsedValue,
          expires,
          lastAccessed: Timestamp.now(),
          size: dataSize,
          migrated: true,
          migratedAt: Timestamp.now()
        });
        
        migratedItems++;
      } catch (error) {
        console.error(`Error migrating item ${key}:`, error);
      }
    }
    
    console.log(`Migration complete! Migrated ${migratedItems} items to Firestore.`);
    
    // Mark migration as complete
    localStorage.setItem('firestore_migration_complete', 'true');
    
    return migratedItems;
  } catch (error) {
    console.error('Migration failed:', error);
    return 0;
  }
};

// Check if migration is needed and perform it
export const checkAndPerformMigration = async () => {
  // Skip if migration already done
  if (localStorage.getItem('firestore_migration_complete') === 'true') {
    return false;
  }
  
  // Only migrate if we're online
  if (!navigator.onLine) {
    return false;
  }
  
  const migratedItems = await migrateLocalStorageToFirestore();
  return migratedItems > 0;
};
