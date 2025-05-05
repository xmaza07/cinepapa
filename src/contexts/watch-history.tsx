
import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from '@/hooks';
import { useUserPreferences } from '@/hooks/user-preferences';
import { useToast } from '@/hooks/use-toast';
import { getApp } from 'firebase/app';
import {
  getFirestore, collection, query, where, orderBy, limit, startAfter, getDocs, doc, setDoc, deleteDoc, writeBatch, QueryDocumentSnapshot, DocumentData, deleteField
} from 'firebase/firestore';
import { generateId } from '@/utils/supabase';
import { Media } from '@/utils/types';
import { WatchHistoryContext, WatchHistoryItem, FavoriteItem, WatchlistItem, MediaBaseItem } from './types/watch-history';
import { RateLimiter } from '@/utils/rate-limiter';
import { deduplicateWatchHistory, filterWatchHistoryDuplicates, isSignificantProgress } from '@/utils/watch-history-utils';
import {
  addToWatchHistoryHelper,
  updateWatchPositionHelper,
  clearWatchHistoryHelper,
  deleteWatchHistoryItemHelper,
  deleteSelectedWatchHistoryHelper
} from '@/utils/watch-history-crud';
import {
  addToFavoritesHelper,
  removeFromFavoritesHelper,
  isInFavoritesHelper,
  deleteFavoriteItemHelper,
  deleteSelectedFavoritesHelper
} from '@/utils/watch-history-favorites';
import {
  addToWatchlistHelper,
  removeFromWatchlistHelper,
  isInWatchlistHelper,
  deleteWatchlistItemHelper,
  deleteSelectedWatchlistHelper
} from '@/utils/watch-history-watchlist';

const LOCAL_STORAGE_HISTORY_KEY = 'fdf_watch_history';
const ITEMS_PER_PAGE = 20;
const MAX_LOCAL_HISTORY = 50;
const SIGNIFICANT_PROGRESS = 60; // 60 seconds
const MINIMUM_UPDATE_INTERVAL = 30000; // 30 seconds

const app = getApp();
const db = getFirestore(app);
const readRateLimiter = RateLimiter.getInstance(200, 300000);
const writeRateLimiter = RateLimiter.getInstance(100, 300000);
const deleteRateLimiter = RateLimiter.getInstance(50, 300000);


// Pending operations queue and watch position queue
const pendingOperations: Array<() => Promise<void>> = [];
const queueOperation = (operation: () => Promise<void>) => pendingOperations.push(operation);
const processPendingOperations = async () => {
  while (pendingOperations.length > 0) {
    const operation = pendingOperations.shift();
    if (operation) {
      try { await operation(); } catch (error) {
        console.error('Error processing pending operation:', error);
        pendingOperations.push(operation); break;
      }
    }
  }
};

interface QueuedUpdate {
  historyRef: ReturnType<typeof doc>;
  updatedItemData: Partial<WatchHistoryItem>;
}
const watchPositionQueue = new Map<string, { data: QueuedUpdate, timestamp: number }>();


// Main WatchHistoryProvider function
export function WatchHistoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { userPreferences } = useUserPreferences();
  const { toast } = useToast();
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const lastUpdateTimestamps = useRef(new Map<string, number>()).current;


  // Batched watch position updates
  const processWatchPositionQueue = useCallback(async () => {
    if (!navigator.onLine || watchPositionQueue.size === 0) return;
    try {
      const batch = writeBatch(db);
      let batchCount = 0;
      const now = Date.now();
      const processedKeys: string[] = [];
      for (const [key, { data, timestamp }] of watchPositionQueue.entries()) {
        if (now - timestamp < MINIMUM_UPDATE_INTERVAL) continue;
        if (!await writeRateLimiter.canExecute()) break;
        batch.set(data.historyRef, data.updatedItemData, { merge: true });
        processedKeys.push(key);
        if (++batchCount >= 500) { await batch.commit(); batchCount = 0; }
      }
      if (batchCount > 0) await batch.commit();
      processedKeys.forEach(key => watchPositionQueue.delete(key));
    } catch (error) { console.error('Error processing watch position queue:', error); }
  }, []);

  // Periodically process watch position queue
  useEffect(() => {
    const interval = setInterval(processWatchPositionQueue, MINIMUM_UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [processWatchPositionQueue]);

  // Online/offline event listeners for pending operations
  useEffect(() => {
    const handleOnline = async () => { await processPendingOperations(); };
    window.addEventListener('online', handleOnline);
    if (navigator.onLine) processPendingOperations();
    return () => { window.removeEventListener('online', handleOnline); };
  }, []);


  // Local storage helpers
  const loadLocalWatchHistory = useCallback(() => {
    try {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (!storedHistory) return [];
      return JSON.parse(storedHistory).slice(0, MAX_LOCAL_HISTORY);
    } catch { return []; }
  }, []);

  const saveLocalWatchHistory = useCallback((history: WatchHistoryItem[]) => {
    try { localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_LOCAL_HISTORY))); }
    catch (e) { /* ignore */ }
  }, []);

  // Fetch watch history (local or Firestore)
  const fetchWatchHistory = useCallback(async (isInitial: boolean = false) => {
    if (!user) {
      const localHistory = loadLocalWatchHistory();
      setWatchHistory(deduplicateWatchHistory(localHistory));
      setHasMore(false);
      if (isInitial) setInitialFetchDone(true);
      return;
    }
    try {
      setIsLoading(true);
      const historyRef = collection(db, 'watchHistory');
      let historyQuery;
      if (isInitial) historyQuery = query(historyRef, where('user_id', '==', user.uid), orderBy('created_at', 'desc'), limit(ITEMS_PER_PAGE));
      else if (lastVisible) historyQuery = query(historyRef, where('user_id', '==', user.uid), orderBy('created_at', 'desc'), startAfter(lastVisible), limit(ITEMS_PER_PAGE));
      else return;
      if (!await readRateLimiter.canExecute()) return;
      const historySnapshot = await getDocs(historyQuery);
      if (historySnapshot.empty) { setHasMore(false); if (isInitial) setInitialFetchDone(true); return; }
      setLastVisible(historySnapshot.docs[historySnapshot.docs.length - 1] as QueryDocumentSnapshot<DocumentData>);
      const historyData = historySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Omit<WatchHistoryItem, 'id'>, created_at: (doc.data() as { created_at?: string })?.created_at || new Date().toISOString() }));
      const deduped = isInitial ? deduplicateWatchHistory(historyData) : deduplicateWatchHistory([...watchHistory, ...historyData]);
      setWatchHistory(deduped);
      setHasMore(historySnapshot.docs.length === ITEMS_PER_PAGE);
      if (isInitial) setInitialFetchDone(true);
    } catch (error) {
      if (isInitial) setInitialFetchDone(true);
      setIsLoading(false);
    } finally { setIsLoading(false); }
  }, [user, lastVisible, loadLocalWatchHistory, watchHistory]);

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    try {
      const favoritesRef = collection(db, 'favorites');
      const favoritesQuery = query(favoritesRef, where('user_id', '==', user.uid), orderBy('added_at', 'desc'));
      if (!await readRateLimiter.canExecute()) return;
      const snapshot = await getDocs(favoritesQuery);
      setFavorites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FavoriteItem[]);
    } catch (e) { /* ignore */ }
  }, [user]);

  // Fetch watchlist
  const fetchWatchlist = useCallback(async () => {
    if (!user) return;
    try {
      const watchlistRef = collection(db, 'watchlist');
      const watchlistQuery = query(watchlistRef, where('user_id', '==', user.uid), orderBy('added_at', 'desc'));
      if (!await readRateLimiter.canExecute()) return;
      const snapshot = await getDocs(watchlistQuery);
      setWatchlist(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WatchlistItem[]);
    } catch (e) { /* ignore */ }
  }, [user]);
  // Initial data fetch
  useEffect(() => {
    const fetchAllData = async () => {
      if (!initialFetchDone || user) {
        setIsLoading(true);
        await Promise.all([fetchWatchHistory(true), fetchFavorites(), fetchWatchlist()]);
        setIsLoading(false);
      } else if (!user) {
        setWatchHistory([]); setFavorites([]); setWatchlist([]); setIsLoading(false);
      }
    };
    fetchAllData();
  }, [user, initialFetchDone, fetchFavorites, fetchWatchHistory, fetchWatchlist]);

  // Firestore migration (cleanup)
  useEffect(() => {
    if (!user || !initialFetchDone) return;
    (async () => {
      try {
        const historyRef = collection(db, 'watchHistory');
        const historyQuery = query(historyRef, where('user_id', '==', user.uid));
        if (!await readRateLimiter.canExecute()) return;
        const historySnapshot = await getDocs(historyQuery);
        await Promise.all(historySnapshot.docs.map(async (doc) => {
          if ('last_watched' in doc.data()) await setDoc(doc.ref, { last_watched: deleteField() }, { merge: true });
        }));
      } catch (e) { /* ignore */ }
    })();
  }, [user, initialFetchDone, fetchFavorites, fetchWatchHistory, fetchWatchlist]);

  // --- Provider methods (addToWatchHistory, updateWatchPosition, clearWatchHistory, etc.) ---
  const addToWatchHistory = async (
    media: Media,
    position: number,
    duration: number,
    season?: number,
    episode?: number,
    preferredSource?: string
  ) => {
    await addToWatchHistoryHelper({
      user,
      userPreferences,
      media,
      position,
      duration,
      season,
      episode,
      preferredSource,
      watchHistory,
      lastUpdateTimestamps,
      MINIMUM_UPDATE_INTERVAL,
      SIGNIFICANT_PROGRESS,
      db,
      toast,
      setWatchHistory,
      saveLocalWatchHistory,
      queueOperation,
      writeRateLimiter
    });
  };

  const updateWatchPosition = async (
    mediaId: number,
    mediaType: 'movie' | 'tv',
    position: number,
    season?: number,
    episode?: number,
    preferredSource?: string
  ) => {
    await updateWatchPositionHelper({
      user,
      mediaId,
      mediaType,
      position,
      season,
      episode,
      preferredSource,
      lastUpdateTimestamps,
      MINIMUM_UPDATE_INTERVAL,
      watchHistory,
      writeRateLimiter,
      watchPositionQueue,
      setWatchHistory,
      saveLocalWatchHistory,
      SIGNIFICANT_PROGRESS,
      db,
      toast
    });
  };
  
  const clearWatchHistory = async () => {
    await clearWatchHistoryHelper({
      user,
      db,
      deleteRateLimiter,
      setWatchHistory,
      saveLocalWatchHistory,
      toast
    });
  };

  const deleteWatchHistoryItem = async (id: string) => {
    await deleteWatchHistoryItemHelper({
      user,
      id,
      db,
      deleteRateLimiter,
      watchHistory,
      setWatchHistory,
      saveLocalWatchHistory,
      toast
    });
  };

  const deleteSelectedWatchHistory = async (ids: string[]) => {
    await deleteSelectedWatchHistoryHelper({
      user,
      ids,
      db,
      deleteRateLimiter,
      watchHistory,
      setWatchHistory,
      saveLocalWatchHistory,
      toast
    });
  };

  const addToFavorites = async (item: MediaBaseItem) => {
    if (!user) {
      toast({ title: "Authentication required", description: "Please log in to add items to your favorites.", variant: "destructive" });
      return;
    }
    try {
      await addToFavoritesHelper({ user, favorites, item, db, toast, setFavorites });
    } catch (error) {
      toast({ title: "Error adding to favorites", description: error instanceof Error ? error.message : "There was a problem adding to your favorites.", variant: "destructive" });
    }
  };

  const removeFromFavorites = async (mediaId: number, mediaType: 'movie' | 'tv') => {
    if (!user) return;
    try {
      await removeFromFavoritesHelper({ user, favorites, mediaId, mediaType, db, setFavorites });
    } catch (error) {
      toast({ title: "Error removing from favorites", description: "There was a problem removing from your favorites.", variant: "destructive" });
    }
  };

  const isInFavorites = (mediaId: number, mediaType: 'movie' | 'tv'): boolean => {
    return isInFavoritesHelper(favorites, mediaId, mediaType);
  };

  const deleteFavoriteItem = async (id: string) => {
    if (!user) return;
    try {
      await deleteFavoriteItemHelper({ user, favorites, id, db, setFavorites, toast });
    } catch (error) {
      toast({ title: "Error removing item", description: "There was a problem removing the item from your favorites.", variant: "destructive" });
    }
  };

  const deleteSelectedFavorites = async (ids: string[]) => {
    if (!user || ids.length === 0) return;
    try {
      await deleteSelectedFavoritesHelper({ user, favorites, ids, db, setFavorites, toast });
    } catch (error) {
      toast({ title: "Error removing items", description: "There was a problem removing the items from your favorites.", variant: "destructive" });
    }
  };

  const addToWatchlist = async (item: MediaBaseItem) => {
    if (!user) {
      toast({ title: "Authentication required", description: "Please log in to add items to your watchlist.", variant: "destructive" });
      return;
    }
    try {
      await addToWatchlistHelper({ user, watchlist, item, db, toast, setWatchlist });
    } catch (error) {
      toast({ title: "Error adding to watchlist", description: error instanceof Error ? error.message : "There was a problem adding to your watchlist.", variant: "destructive" });
    }
  };

  const removeFromWatchlist = async (mediaId: number, mediaType: 'movie' | 'tv') => {
    if (!user) return;
    try {
      await removeFromWatchlistHelper({ user, watchlist, mediaId, mediaType, db, setWatchlist });
    } catch (error) {
      toast({ title: "Error removing from watchlist", description: "There was a problem removing from your watchlist.", variant: "destructive" });
    }
  };

  const isInWatchlist = (mediaId: number, mediaType: 'movie' | 'tv'): boolean => {
    return isInWatchlistHelper(watchlist, mediaId, mediaType);
  };

  const deleteWatchlistItem = async (id: string) => {
    if (!user) return;
    try {
      await deleteWatchlistItemHelper({ user, watchlist, id, db, setWatchlist, toast });
    } catch (error) {
      toast({ title: "Error removing item", description: "There was a problem removing the item from your watchlist.", variant: "destructive" });
    }
  };

  const deleteSelectedWatchlist = async (ids: string[]) => {
    if (!user || ids.length === 0) return;
    try {
      await deleteSelectedWatchlistHelper({ user, watchlist, ids, db, setWatchlist, toast });
    } catch (error) {
      toast({ title: "Error removing items", description: "There was a problem removing the items from your watchlist.", variant: "destructive" });
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
