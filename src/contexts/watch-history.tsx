
import { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks';
import { useUserPreferences } from '@/hooks/user-preferences';
import { getApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, query, where, deleteField } from 'firebase/firestore';
import { generateId } from '@/utils/supabase';
import { Media } from '@/utils/types';
import { useToast } from '@/components/ui/use-toast';
import { 
  WatchHistoryContext,
  WatchHistoryItem,
  FavoriteItem,
  WatchlistItem,
  MediaBaseItem,
  WatchHistoryContextType 
} from './types/watch-history';
import RateLimiter from '@/utils/rate-limiter';

const LOCAL_STORAGE_HISTORY_KEY = 'fdf_watch_history';

export { WatchHistoryContext };

// Initialize Firestore
const app = getApp();
const db = getFirestore(app);

// Initialize rate limiter (5 minutes interval in milliseconds)
const rateLimiter = new RateLimiter(100, 300000); // 100 requests per 5 minutes

const loadLocalWatchHistory = (): WatchHistoryItem[] => {
  try {
    const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
    return storedHistory ? JSON.parse(storedHistory) : [];
  } catch (error) {
    console.error('Error loading local watch history:', error);
    return [];
  }
};

const saveLocalWatchHistory = (history: WatchHistoryItem[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving local watch history:', error);
  }
};

export function WatchHistoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { userPreferences } = useUserPreferences();
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>(loadLocalWatchHistory()); // Initialize from local storage
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setWatchHistory(loadLocalWatchHistory()); // Load from local storage if no user
        setFavorites([]);
        setWatchlist([]);
        setIsLoading(false);
        return;
      }
      
      if (!navigator.onLine) {
        setWatchHistory(loadLocalWatchHistory()); // Load from local storage if offline
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch watch history from Firestore
        const historyRef = collection(db, 'watchHistory');
        const historyQuery = query(historyRef, where('user_id', '==', user.uid));
        const historySnapshot = await getDocs(historyQuery);
        const historyData = historySnapshot.docs.map(doc => {
          const data = doc.data();
          // Ensure created_at is a valid ISO string
          if (!data.created_at || typeof data.created_at !== 'string') {
            data.created_at = new Date().toISOString();
          }
          return {
            id: doc.id,
            ...data
          };
        }) as WatchHistoryItem[];
        
        // Fetch favorites and ensure added_at is valid
        const favoritesRef = collection(db, 'favorites');
        const favoritesQuery = query(favoritesRef, where('user_id', '==', user.uid));
        const favoritesSnapshot = await getDocs(favoritesQuery);
        const favoritesData = favoritesSnapshot.docs.map(doc => {
          const data = doc.data();
          if (!data.added_at || typeof data.added_at !== 'string') {
            data.added_at = new Date().toISOString();
          }
          return {
            id: doc.id,
            ...data
          };
        }) as FavoriteItem[];
        
        // Fetch watchlist and ensure added_at is valid
        const watchlistRef = collection(db, 'watchlist');
        const watchlistQuery = query(watchlistRef, where('user_id', '==', user.uid));
        const watchlistSnapshot = await getDocs(watchlistQuery);
        const watchlistData = watchlistSnapshot.docs.map(doc => {
          const data = doc.data();
          if (!data.added_at || typeof data.added_at !== 'string') {
            data.added_at = new Date().toISOString();
          }
          return {
            id: doc.id,
            ...data
          };
        }) as WatchlistItem[];

        // Update any invalid timestamps in Firestore
        const updatePromises = [
          ...historySnapshot.docs.map(doc => {
            const data = doc.data();
            if (!data.created_at || typeof data.created_at !== 'string') {
              return setDoc(doc.ref, { created_at: new Date().toISOString() }, { merge: true });
            }
            return Promise.resolve();
          }),
          ...favoritesSnapshot.docs.map(doc => {
            const data = doc.data();
            if (!data.added_at || typeof data.added_at !== 'string') {
              return setDoc(doc.ref, { added_at: new Date().toISOString() }, { merge: true });
            }
            return Promise.resolve();
          }),
          ...watchlistSnapshot.docs.map(doc => {
            const data = doc.data();
            if (!data.added_at || typeof data.added_at !== 'string') {
              return setDoc(doc.ref, { added_at: new Date().toISOString() }, { merge: true });
            }
            return Promise.resolve();
          })
        ];
        
        // Wait for all updates to complete
        await Promise.all(updatePromises);
        
        setWatchHistory(historyData);
        setFavorites(favoritesData);
        setWatchlist(watchlistData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: "Error loading watch data",
          description: "Please make sure you're signed in and try again. If the problem persists, try signing out and back in.",
          variant: "destructive"
        });
        // Set empty arrays as fallback
        setWatchHistory([]);
        setFavorites([]);
        setWatchlist([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user, toast]);

  useEffect(() => {
    const migrateWatchHistory = async () => {
      if (!user) return;
      
      try {
        const historyRef = collection(db, 'watchHistory');
        const historyQuery = query(historyRef, where('user_id', '==', user.uid));
        const historySnapshot = await getDocs(historyQuery);
        
        const migrationPromises = historySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          if ('last_watched' in data) {
            // Remove last_watched field using field delete
            await setDoc(doc.ref, { last_watched: deleteField() }, { merge: true });
          }
        });
        
        await Promise.all(migrationPromises);
      } catch (error) {
        console.error('Error migrating watch history:', error);
      }
    };
    
    migrateWatchHistory();
  }, [user]);
  
  const addToWatchHistory = async (
    media: Media, 
    position: number, 
    duration: number, 
    season?: number, 
    episode?: number,
    preferredSource?: string
  ) => {
    if (!user || !userPreferences?.isWatchHistoryEnabled) return;
    
    const mediaType = media.media_type;
    const mediaId = media.id;
    const title = media.title || media.name || '';
    const newItem: WatchHistoryItem = {
      id: generateId(),
      user_id: user.uid || 'offline_user', // Use a default user ID for offline mode
      media_id: mediaId,
      media_type: mediaType,
      title,
      poster_path: media.poster_path,
      backdrop_path: media.backdrop_path,
      overview: media.overview || null,
      rating: media.vote_average || 0,
      watch_position: position,
      duration,
      created_at: new Date().toISOString(),
      preferred_source: preferredSource || '',
      // Only include season and episode if they are numbers
      ...(typeof season === 'number' ? { season } : {}),
      ...(typeof episode === 'number' ? { episode } : {})
    };

    if (!navigator.onLine) {
      // Offline mode: Save to local storage
      const currentHistory = loadLocalWatchHistory();
      const updatedHistory = [newItem, ...currentHistory];
      setWatchHistory(updatedHistory);
      saveLocalWatchHistory(updatedHistory);
      return;
    }

    try {
      const existingItem = watchHistory.find(item => 
        item.media_id === mediaId && 
        item.media_type === mediaType && 
        (mediaType === 'movie' || (item.season === season && item.episode === episode))
      );
      
      if (existingItem) {
        await updateWatchPosition(mediaId, mediaType, position, season, episode, preferredSource);
      } else {
        
        // Save to Firestore
        const historyRef = doc(db, 'watchHistory', newItem.id);
        await setDoc(historyRef, newItem);
        
        const updatedHistory = [newItem, ...watchHistory];
        setWatchHistory(updatedHistory);
        saveLocalWatchHistory(updatedHistory); // Also save to local storage for offline access
      }
    } catch (error) {
      console.error('Error adding to watch history:', error);
      toast({
        title: "Error updating watch history",
        description: "There was a problem updating your watch history.",
        variant: "destructive"
      });
    }
  };
  
  const updateWatchPosition = async (
    mediaId: number, 
    mediaType: 'movie' | 'tv', 
    position: number, 
    season?: number, 
    episode?: number,
    preferredSource?: string
  ) => {
    if (!user) return;

    const updatedItemData = {
      watch_position: position,
      // Only include these fields if they are valid numbers
      ...(typeof season === 'number' ? { season } : {}),
      ...(typeof episode === 'number' ? { episode } : {}),
      ...(preferredSource && preferredSource !== preferredSource ? { preferred_source: preferredSource } : {})
    };
    
    if (!navigator.onLine) {
      // Offline mode: Update in local storage
      const currentHistory = loadLocalWatchHistory();
      const itemIndex = currentHistory.findIndex(item => 
        item.media_id === mediaId && 
        item.media_type === mediaType && 
        (mediaType === 'movie' || (item.season === season && item.episode === episode))
      );
      if (itemIndex > -1) {
        const updatedHistory = [...currentHistory];
        updatedHistory[itemIndex] = { ...updatedHistory[itemIndex], ...updatedItemData };
        setWatchHistory(updatedHistory);
        saveLocalWatchHistory(updatedHistory);
      }
      return;
    }
    
    try {
      const item = watchHistory.find(item => 
        item.media_id === mediaId && 
        item.media_type === mediaType && 
        (mediaType === 'movie' || (item.season === season && item.episode === episode))
      );
      
      if (item) {
        // Only update if the position has changed by more than 20 minutes (1200 seconds)
        const TWENTY_MINUTES = 1200;
        if (Math.abs(item.watch_position - position) < TWENTY_MINUTES) {
          return;
        }

        // Check rate limiter before updating Firestore
        if (!rateLimiter.canExecute()) {
          console.log('Rate limit exceeded. Skipping Firestore update.');
          return;
        }
        
        // Update in Firestore using merge to only update changed fields
        const historyRef = doc(db, 'watchHistory', item.id);
        await setDoc(historyRef, updatedItemData, { merge: true });
        
        const updatedHistory = watchHistory.map(h => 
          h.id === item.id ? { ...h, ...updatedItemData } : h
        );
        
        setWatchHistory(updatedHistory);
        saveLocalWatchHistory(updatedHistory); // Also update local storage
      }
    } catch (error) {
      console.error('Error updating watch position:', error);
      toast({
        title: "Error updating progress",
        description: "There was a problem updating your watch progress.",
        variant: "destructive"
      });
    }
  };
  
  const clearWatchHistory = async () => {
    if (!user) return;
    
    if (!navigator.onLine) {
      // Offline mode: Clear local storage
      setWatchHistory([]);
      saveLocalWatchHistory([]);
      toast({
        title: "Watch history cleared",
        description: "Your watch history has been successfully cleared."
      });
      return;
    }

    try {
      // Delete all watch history documents for the user
      const historyRef = collection(db, 'watchHistory');
      const historyQuery = query(historyRef, where('user_id', '==', user.uid));
      const historySnapshot = await getDocs(historyQuery);
      
      const deletePromises = historySnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      setWatchHistory([]);
      saveLocalWatchHistory([]); // Clear local storage as well
      
      toast({
        title: "Watch history cleared",
        description: "Your watch history has been successfully cleared."
      });
    } catch (error) {
      console.error('Error clearing watch history:', error);
      toast({
        title: "Error clearing history",
        description: "There was a problem clearing your watch history.",
        variant: "destructive"
      });
    }
  };

  const addToFavorites = async (item: MediaBaseItem) => {
    if (!user) return;
    
    try {
      const existingItem = favorites.find(fav => 
        fav.media_id === item.media_id && fav.media_type === item.media_type
      );
      
      if (existingItem) return;
      
      const newItem: FavoriteItem = {
        id: generateId(),
        user_id: user.uid,
        media_id: item.media_id,
        media_type: item.media_type,
        title: item.title,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        overview: item.overview,
        rating: item.rating,
        added_at: new Date().toISOString()
      };
      
      // Save to Firestore
      const favoriteRef = doc(db, 'favorites', newItem.id);
      await setDoc(favoriteRef, newItem);
      
      const updatedFavorites = [newItem, ...favorites];
      setFavorites(updatedFavorites);
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast({
        title: "Error adding to favorites",
        description: "There was a problem adding to your favorites.",
        variant: "destructive"
      });
    }
  };

  const removeFromFavorites = async (mediaId: number, mediaType: 'movie' | 'tv') => {
    if (!user) return;
    
    try {
      const itemToRemove = favorites.find(
        item => item.media_id === mediaId && item.media_type === mediaType
      );

      if (itemToRemove) {
        // Remove from Firestore
        const favoriteRef = doc(db, 'favorites', itemToRemove.id);
        await deleteDoc(favoriteRef);
        
        const updatedFavorites = favorites.filter(
          item => !(item.media_id === mediaId && item.media_type === mediaType)
        );
        setFavorites(updatedFavorites);
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast({
        title: "Error removing from favorites",
        description: "There was a problem removing from your favorites.",
        variant: "destructive"
      });
    }
  };

  const isInFavorites = (mediaId: number, mediaType: 'movie' | 'tv'): boolean => {
    return favorites.some(item => item.media_id === mediaId && item.media_type === mediaType);
  };

  const addToWatchlist = async (item: MediaBaseItem) => {
    if (!user) return;
    
    try {
      const existingItem = watchlist.find(watch => 
        watch.media_id === item.media_id && watch.media_type === item.media_type
      );
      
      if (existingItem) return;
      
      const newItem: WatchlistItem = {
        id: generateId(),
        user_id: user.uid,
        media_id: item.media_id,
        media_type: item.media_type,
        title: item.title,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        overview: item.overview,
        rating: item.rating,
        added_at: new Date().toISOString()
      };
      
      // Save to Firestore
      const watchlistRef = doc(db, 'watchlist', newItem.id);
      await setDoc(watchlistRef, newItem);
      
      const updatedWatchlist = [newItem, ...watchlist];
      setWatchlist(updatedWatchlist);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast({
        title: "Error adding to watchlist",
        description: "There was a problem adding to your watchlist.",
        variant: "destructive"
      });
    }
  };

  const removeFromWatchlist = async (mediaId: number, mediaType: 'movie' | 'tv') => {
    if (!user) return;
    
    try {
      const itemToRemove = watchlist.find(
        item => item.media_id === mediaId && item.media_type === mediaType
      );

      if (itemToRemove) {
        // Remove from Firestore
        const watchlistRef = doc(db, 'watchlist', itemToRemove.id);
        await deleteDoc(watchlistRef);
        
        const updatedWatchlist = watchlist.filter(
          item => !(item.media_id === mediaId && item.media_type === mediaType)
        );
        setWatchlist(updatedWatchlist);
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast({
        title: "Error removing from watchlist",
        description: "There was a problem removing from your watchlist.",
        variant: "destructive"
      });
    }
  };

  const isInWatchlist = (mediaId: number, mediaType: 'movie' | 'tv'): boolean => {
    return watchlist.some(item => item.media_id === mediaId && item.media_type === mediaType);
  };
  
  return (
    <WatchHistoryContext.Provider value={{
      watchHistory,
      favorites,
      watchlist,
      addToWatchHistory,
      updateWatchPosition,
      clearWatchHistory,
      addToFavorites,
      removeFromFavorites,
      isInFavorites,
      addToWatchlist,
      removeFromWatchlist,
      isInWatchlist,
      isLoading
    }}>
      {children}
    </WatchHistoryContext.Provider>
  );
}
