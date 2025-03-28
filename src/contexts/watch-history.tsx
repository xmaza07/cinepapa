import { useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/hooks';
import { useUserPreferences } from '@/hooks/user-preferences';
import { getApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, query, where, deleteField, limit, orderBy, startAfter, writeBatch } from 'firebase/firestore';
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
const ITEMS_PER_PAGE = 20;
const MAX_LOCAL_HISTORY = 10;
const DEBOUNCE_WINDOW = 300000; // 5 minutes in milliseconds
const SIGNIFICANT_PROGRESS = 120; // 2 minutes difference to consider significant progress
const MINIMUM_UPDATE_INTERVAL = 60000; // 1 minute in milliseconds
const lastUpdateTimestamps = new Map<string, number>();

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

interface QueryDocumentSnapshot {
  id: string;
  data: () => Record<string, unknown>;
}

export function WatchHistoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { userPreferences } = useUserPreferences();
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadLocalWatchHistory = useCallback(() => {
    try {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (!storedHistory) return [];
      const history = JSON.parse(storedHistory);
      // Only keep the most recent items for PWA
      return history.slice(0, MAX_LOCAL_HISTORY);
    } catch (error) {
      console.error('Error loading local watch history:', error);
      return [];
    }
  }, []);

  const saveLocalWatchHistory = useCallback((history: WatchHistoryItem[]) => {
    try {
      // Only store the most recent items for PWA
      const recentHistory = history.slice(0, MAX_LOCAL_HISTORY);
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(recentHistory));
    } catch (error) {
      console.error('Error saving local watch history:', error);
    }
  }, []);

  const fetchWatchHistory = useCallback(async (isInitial: boolean = false) => {
    if (!user) {
      setWatchHistory(loadLocalWatchHistory());
      setHasMore(false);
      return;
    }

    try {
      setIsLoading(true);
      const historyRef = collection(db, 'watchHistory');
      let historyQuery;

      if (isInitial) {
        historyQuery = query(
          historyRef,
          where('user_id', '==', user.uid),
          orderBy('created_at', 'desc'),
          limit(ITEMS_PER_PAGE)
        );
      } else if (lastVisible) {
        historyQuery = query(
          historyRef,
          where('user_id', '==', user.uid),
          orderBy('created_at', 'desc'),
          startAfter(lastVisible),
          limit(ITEMS_PER_PAGE)
        );
      } else {
        return;
      }

      const historySnapshot = await getDocs(historyQuery);
      
      if (historySnapshot.empty) {
        setHasMore(false);
        return;
      }

      setLastVisible(historySnapshot.docs[historySnapshot.docs.length - 1] as QueryDocumentSnapshot);
      
      const historyData = historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<WatchHistoryItem, 'id'>,
        created_at: (doc.data() as { created_at?: string })?.created_at || new Date().toISOString()
      }));

      setWatchHistory(prev => isInitial ? historyData : [...prev, ...historyData]);
      setHasMore(historySnapshot.docs.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching watch history:', error);
      toast({
        title: "Error loading watch history",
        description: "There was a problem loading your watch history.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, lastVisible, loadLocalWatchHistory, toast]);

  // Initial load
  useEffect(() => {
    fetchWatchHistory(true);
  }, [fetchWatchHistory]);

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

    // Generate unique key for this media item
    const mediaKey = `${mediaId}-${mediaType}-${season || ''}-${episode || ''}`;
    const now = Date.now();
    const lastUpdate = lastUpdateTimestamps.get(mediaKey) || 0;

    // Check if enough time has passed since last update
    if (now - lastUpdate < MINIMUM_UPDATE_INTERVAL) {
      return;
    }

    try {
      // Find existing entry for this media
      const existingItem = watchHistory.find(item => {
        if (mediaType === 'movie') {
          return item.media_id === mediaId && item.media_type === mediaType;
        } else {
          return item.media_id === mediaId && 
                 item.media_type === mediaType &&
                 item.season === season &&
                 item.episode === episode;
        }
      });

      if (existingItem) {
        // Check for significant progress change
        const progressDifference = Math.abs(existingItem.watch_position - position);
        if (progressDifference < SIGNIFICANT_PROGRESS) {
          return;
        }

        const updatedItemData = {
          watch_position: position,
          created_at: new Date().toISOString(),
          preferred_source: preferredSource || existingItem.preferred_source
        };

        // Update timestamp for rate limiting
        lastUpdateTimestamps.set(mediaKey, now);

        // Check rate limiter before Firestore operation
        if (!rateLimiter.canExecute()) {
          console.log('Rate limit exceeded. Updating local state only.');
          const updatedHistory = watchHistory.map(h => 
            h.id === existingItem.id ? { ...h, ...updatedItemData } : h
          );
          setWatchHistory(updatedHistory);
          saveLocalWatchHistory(updatedHistory);
          return;
        }

        // Update Firestore and local state
        const historyRef = doc(db, 'watchHistory', existingItem.id);
        await setDoc(historyRef, updatedItemData, { merge: true });
        
        const updatedHistory = watchHistory.map(h => 
          h.id === existingItem.id ? { ...h, ...updatedItemData } : h
        );
        setWatchHistory(updatedHistory);
        saveLocalWatchHistory(updatedHistory);
        return;
      }

      // Check rate limiter before creating new entry
      if (!rateLimiter.canExecute()) {
        console.log('Rate limit exceeded. New entry will be stored locally.');
        const newItem: WatchHistoryItem = {
          id: generateId(),
          user_id: user.uid,
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
          ...(typeof season === 'number' ? { season } : {}),
          ...(typeof episode === 'number' ? { episode } : {})
        };
        
        setWatchHistory(prev => [newItem, ...prev]);
        saveLocalWatchHistory([newItem, ...watchHistory]);
        return;
      }

      // Create new entry with rate limit check passed
      const newItem: WatchHistoryItem = {
        id: generateId(),
        user_id: user.uid,
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
        ...(typeof season === 'number' ? { season } : {}),
        ...(typeof episode === 'number' ? { episode } : {})
      };

      // Update timestamp for rate limiting
      lastUpdateTimestamps.set(mediaKey, now);

      // Save to Firestore
      const historyRef = doc(db, 'watchHistory', newItem.id);
      await setDoc(historyRef, newItem);

      // Update local state
      setWatchHistory(prev => [newItem, ...prev]);
      saveLocalWatchHistory([newItem, ...watchHistory]);
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

    // Generate unique key for this media item
    const mediaKey = `${mediaId}-${mediaType}-${season || ''}-${episode || ''}`;
    const now = Date.now();
    const lastUpdate = lastUpdateTimestamps.get(mediaKey) || 0;

    // Check if enough time has passed since last update
    if (now - lastUpdate < MINIMUM_UPDATE_INTERVAL) {
      return;
    }

    // Update timestamp
    lastUpdateTimestamps.set(mediaKey, now);

    const updatedItemData = {
      watch_position: position,
      created_at: new Date().toISOString(),
      ...(typeof season === 'number' ? { season } : {}),
      ...(typeof episode === 'number' ? { episode } : {}),
      ...(preferredSource ? { preferred_source: preferredSource } : {})
    };
    
    try {
      // Find existing item
      const existingItem = watchHistory.find(item => 
        item.media_id === mediaId && 
        item.media_type === mediaType &&
        item.season === season &&
        item.episode === episode
      );

      if (!rateLimiter.canExecute()) {
        console.log('Rate limit exceeded. Skipping Firestore update.');
        // Only update local state
        if (existingItem) {
          const updatedHistory = watchHistory.map(h => 
            h.id === existingItem.id ? { ...h, ...updatedItemData } : h
          );
          setWatchHistory(updatedHistory);
          saveLocalWatchHistory(updatedHistory);
        }
        return;
      }

      if (existingItem) {
        // Check if progress change is significant
        const progressDifference = Math.abs(existingItem.watch_position - position);
        if (progressDifference < SIGNIFICANT_PROGRESS) {
          return;
        }

        // Update in Firestore
        const historyRef = doc(db, 'watchHistory', existingItem.id);
        await setDoc(historyRef, updatedItemData, { merge: true });

        // Batch local state updates
        const updatedHistory = watchHistory.map(h => 
          h.id === existingItem.id ? { ...h, ...updatedItemData } : h
        );
        setWatchHistory(updatedHistory);
        saveLocalWatchHistory(updatedHistory);
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

  const deleteWatchHistoryItem = async (id: string) => {
    if (!user) return;
    
    try {
      // Delete from Firestore
      const historyRef = doc(db, 'watchHistory', id);
      await deleteDoc(historyRef);
      
      // Update local state
      const updatedHistory = watchHistory.filter(item => item.id !== id);
      setWatchHistory(updatedHistory);
      saveLocalWatchHistory(updatedHistory);
      
      toast({
        title: "Item removed",
        description: "The item has been removed from your watch history."
      });
    } catch (error) {
      console.error('Error deleting watch history item:', error);
      toast({
        title: "Error removing item",
        description: "There was a problem removing the item from your history.",
        variant: "destructive"
      });
    }
  };

  const deleteSelectedWatchHistory = async (ids: string[]) => {
    if (!user || ids.length === 0) return;
    
    try {
      // Check rate limiter for bulk operation
      if (!rateLimiter.canExecute()) {
        console.log('Rate limit exceeded. Please try again later.');
        toast({
          title: "Rate limit exceeded",
          description: "Too many operations in a short time. Please try again later.",
          variant: "destructive"
        });
        return;
      }

      // Use batched writes for better performance
      const batch = writeBatch(db);
      ids.forEach(id => {
        const historyRef = doc(db, 'watchHistory', id);
        batch.delete(historyRef);
      });
      
      await batch.commit();
      
      // Update local state
      const updatedHistory = watchHistory.filter(item => !ids.includes(item.id));
      setWatchHistory(updatedHistory);
      saveLocalWatchHistory(updatedHistory);
      
      toast({
        title: "Items removed",
        description: `${ids.length} ${ids.length === 1 ? 'item has' : 'items have'} been removed from your watch history.`
      });
    } catch (error) {
      console.error('Error deleting watch history items:', error);
      toast({
        title: "Error removing items",
        description: "There was a problem removing the items from your history.",
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

  const deleteFavoriteItem = async (id: string) => {
    if (!user) return;
    
    try {
      // Delete from Firestore
      const favoriteRef = doc(db, 'favorites', id);
      await deleteDoc(favoriteRef);
      
      // Update local state
      const updatedFavorites = favorites.filter(item => item.id !== id);
      setFavorites(updatedFavorites);
      
      toast({
        title: "Item removed",
        description: "The item has been removed from your favorites."
      });
    } catch (error) {
      console.error('Error deleting favorite item:', error);
      toast({
        title: "Error removing item",
        description: "There was a problem removing the item from your favorites.",
        variant: "destructive"
      });
    }
  };

  const deleteSelectedFavorites = async (ids: string[]) => {
    if (!user || ids.length === 0) return;
    
    try {
      // Check rate limiter for bulk operation
      if (!rateLimiter.canExecute()) {
        console.log('Rate limit exceeded. Please try again later.');
        toast({
          title: "Rate limit exceeded",
          description: "Too many operations in a short time. Please try again later.",
          variant: "destructive"
        });
        return;
      }

      // Use batched writes for better performance
      const batch = writeBatch(db);
      ids.forEach(id => {
        const favoriteRef = doc(db, 'favorites', id);
        batch.delete(favoriteRef);
      });
      
      await batch.commit();
      
      // Update local state
      const updatedFavorites = favorites.filter(item => !ids.includes(item.id));
      setFavorites(updatedFavorites);
      
      toast({
        title: "Items removed",
        description: `${ids.length} ${ids.length === 1 ? 'item has' : 'items have'} been removed from your favorites.`
      });
    } catch (error) {
      console.error('Error deleting favorite items:', error);
      toast({
        title: "Error removing items",
        description: "There was a problem removing the items from your favorites.",
        variant: "destructive"
      });
    }
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

  const deleteWatchlistItem = async (id: string) => {
    if (!user) return;
    
    try {
      // Delete from Firestore
      const watchlistRef = doc(db, 'watchlist', id);
      await deleteDoc(watchlistRef);
      
      // Update local state
      const updatedWatchlist = watchlist.filter(item => item.id !== id);
      setWatchlist(updatedWatchlist);
      
      toast({
        title: "Item removed",
        description: "The item has been removed from your watchlist."
      });
    } catch (error) {
      console.error('Error deleting watchlist item:', error);
      toast({
        title: "Error removing item",
        description: "There was a problem removing the item from your watchlist.",
        variant: "destructive"
      });
    }
  };

  const deleteSelectedWatchlist = async (ids: string[]) => {
    if (!user || ids.length === 0) return;
    
    try {
      // Check rate limiter for bulk operation
      if (!rateLimiter.canExecute()) {
        console.log('Rate limit exceeded. Please try again later.');
        toast({
          title: "Rate limit exceeded",
          description: "Too many operations in a short time. Please try again later.",
          variant: "destructive"
        });
        return;
      }

      // Use batched writes for better performance
      const batch = writeBatch(db);
      ids.forEach(id => {
        const watchlistRef = doc(db, 'watchlist', id);
        batch.delete(watchlistRef);
      });
      
      await batch.commit();
      
      // Update local state
      const updatedWatchlist = watchlist.filter(item => !ids.includes(item.id));
      setWatchlist(updatedWatchlist);
      
      toast({
        title: "Items removed",
        description: `${ids.length} ${ids.length === 1 ? 'item has' : 'items have'} been removed from your watchlist.`
      });
    } catch (error) {
      console.error('Error deleting watchlist items:', error);
      toast({
        title: "Error removing items",
        description: "There was a problem removing the items from your watchlist.",
        variant: "destructive"
      });
    }
  };

  return (
    <WatchHistoryContext.Provider value={{
      watchHistory,
      favorites,
      watchlist,
      hasMore,
      isLoading,
      loadMore: () => fetchWatchHistory(false),
      addToWatchHistory,
      updateWatchPosition,
      clearWatchHistory,
      deleteWatchHistoryItem,
      deleteSelectedWatchHistory,
      deleteFavoriteItem,
      deleteSelectedFavorites,
      deleteWatchlistItem,
      deleteSelectedWatchlist,
      addToFavorites,
      removeFromFavorites,
      isInFavorites,
      addToWatchlist,
      removeFromWatchlist,
      isInWatchlist
    }}>
      {children}
    </WatchHistoryContext.Provider>
  );
}
