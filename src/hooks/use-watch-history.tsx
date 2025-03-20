
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAuth } from './use-auth';
import { getLocalData, saveLocalData, generateId } from '@/utils/supabase';
import { Media } from '@/utils/types';
import { toast } from './use-toast';

export interface WatchHistoryItem {
  id: string;
  user_id: string;
  media_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string;
  backdrop_path: string;
  overview?: string;
  rating?: number;
  season?: number;
  episode?: number;
  watch_position: number;
  duration: number;
  last_watched: string;
  created_at: string;
  preferred_source: string;
}

export interface FavoriteItem {
  id: string;
  user_id: string;
  media_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string;
  backdrop_path: string;
  overview?: string;
  rating?: number;
  added_at: string;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  media_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string;
  backdrop_path: string;
  overview?: string;
  rating?: number;
  added_at: string;
}

interface MediaBaseItem {
  media_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string;
  backdrop_path: string;
  overview?: string;
  rating?: number;
}

interface WatchHistoryContextType {
  watchHistory: WatchHistoryItem[];
  favorites: FavoriteItem[];
  watchlist: WatchlistItem[];
  addToWatchHistory: (media: Media, position: number, duration: number, season?: number, episode?: number, preferredSource?: string) => Promise<void>;
  updateWatchPosition: (mediaId: number, mediaType: 'movie' | 'tv', position: number, season?: number, episode?: number) => Promise<void>;
  clearWatchHistory: () => Promise<void>;
  addToFavorites: (item: MediaBaseItem) => Promise<void>;
  removeFromFavorites: (mediaId: number, mediaType: 'movie' | 'tv') => Promise<void>;
  isInFavorites: (mediaId: number, mediaType: 'movie' | 'tv') => boolean;
  addToWatchlist: (item: MediaBaseItem) => Promise<void>;
  removeFromWatchlist: (mediaId: number, mediaType: 'movie' | 'tv') => Promise<void>;
  isInWatchlist: (mediaId: number, mediaType: 'movie' | 'tv') => boolean;
  isLoading: boolean;
}

const WatchHistoryContext = createContext<WatchHistoryContextType | undefined>(undefined);

export const WatchHistoryProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch watch history from localStorage when user changes
  useEffect(() => {
    const fetchData = () => {
      if (!user) {
        setWatchHistory([]);
        setFavorites([]);
        setWatchlist([]);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        // Get watch history from localStorage
        const historyKey = `flicker-watch-history-${user.id}`;
        const storedHistory = getLocalData<WatchHistoryItem[]>(historyKey, []);
        
        // Get favorites from localStorage
        const favoritesKey = `flicker-favorites-${user.id}`;
        const storedFavorites = getLocalData<FavoriteItem[]>(favoritesKey, []);
        
        // Get watchlist from localStorage
        const watchlistKey = `flicker-watchlist-${user.id}`;
        const storedWatchlist = getLocalData<WatchlistItem[]>(watchlistKey, []);
        
        setWatchHistory(storedHistory);
        setFavorites(storedFavorites);
        setWatchlist(storedWatchlist);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: "Error loading data",
          description: "There was a problem loading your data.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  // Add a media item to watch history
  const addToWatchHistory = async (
    media: Media, 
    position: number, 
    duration: number, 
    season?: number, 
    episode?: number,
    preferredSource?: string
  ) => {
    if (!user) return;
    
    try {
      const mediaType = media.media_type;
      const mediaId = media.id;
      const title = media.title || media.name || '';
      const key = `flicker-watch-history-${user.id}`;
      
      // Check if this media already exists in watch history
      const existingItem = watchHistory.find(item => 
        item.media_id === mediaId && 
        item.media_type === mediaType && 
        (mediaType === 'movie' || (item.season === season && item.episode === episode))
      );
      
      if (existingItem) {
        // Update existing item
        await updateWatchPosition(mediaId, mediaType, position, season, episode, preferredSource);
      } else {
        // Add new item
        const newItem: WatchHistoryItem = {
          id: generateId(),
          user_id: user.id,
          media_id: mediaId,
          media_type: mediaType,
          title,
          poster_path: media.poster_path,
          backdrop_path: media.backdrop_path,
          overview: media.overview,
          rating: media.vote_average,
          season,
          episode,
          watch_position: position,
          duration,
          preferred_source: preferredSource || '',
          last_watched: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        
        // Add to local state
        const updatedHistory = [newItem, ...watchHistory];
        setWatchHistory(updatedHistory);
        
        // Save to localStorage
        saveLocalData(key, updatedHistory);
      }
    } catch (error) {
      console.error('Error adding to watch history:', error);
    }
  };
  
  // Update watch position for an existing item
  const updateWatchPosition = async (
    mediaId: number, 
    mediaType: 'movie' | 'tv', 
    position: number, 
    season?: number, 
    episode?: number,
    preferredSource?: string
  ) => {
    if (!user) return;
    
    try {
      const key = `flicker-watch-history-${user.id}`;
      
      // Update local state
      const updatedHistory = watchHistory.map(item => {
        if (
          item.media_id === mediaId && 
          item.media_type === mediaType && 
          (mediaType === 'movie' || (item.season === season && item.episode === episode))
        ) {
          return {
            ...item,
            watch_position: position,
            last_watched: new Date().toISOString(),
            ...(preferredSource ? { preferred_source: preferredSource } : {})
          };
        }
        return item;
      });
      
      // Sort by last_watched (most recent first)
      updatedHistory.sort((a, b) => 
        new Date(b.last_watched).getTime() - new Date(a.last_watched).getTime()
      );
      
      setWatchHistory(updatedHistory);
      
      // Save to localStorage
      saveLocalData(key, updatedHistory);
    } catch (error) {
      console.error('Error updating watch position:', error);
    }
  };
  
  // Clear watch history
  const clearWatchHistory = async () => {
    if (!user) return;
    
    try {
      const key = `flicker-watch-history-${user.id}`;
      
      // Clear local state
      setWatchHistory([]);
      
      // Clear from localStorage
      saveLocalData(key, []);
      
      toast({
        title: "Watch history cleared",
        description: "Your watch history has been successfully cleared."
      });
    } catch (error) {
      console.error('Error clearing watch history:', error);
      toast({
        title: "Error clearing watch history",
        description: "There was a problem clearing your watch history.",
        variant: "destructive"
      });
    }
  };

  // Add to favorites
  const addToFavorites = async (item: MediaBaseItem) => {
    if (!user) return;
    
    try {
      const key = `flicker-favorites-${user.id}`;
      
      // Check if already in favorites
      const existingItem = favorites.find(fav => 
        fav.media_id === item.media_id && fav.media_type === item.media_type
      );
      
      if (existingItem) {
        return; // Already in favorites
      }
      
      // Create new favorite item
      const newItem: FavoriteItem = {
        id: generateId(),
        user_id: user.id,
        media_id: item.media_id,
        media_type: item.media_type,
        title: item.title,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        overview: item.overview,
        rating: item.rating,
        added_at: new Date().toISOString()
      };
      
      // Add to local state
      const updatedFavorites = [newItem, ...favorites];
      setFavorites(updatedFavorites);
      
      // Save to localStorage
      saveLocalData(key, updatedFavorites);
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast({
        title: "Error adding to favorites",
        description: "There was a problem adding to your favorites.",
        variant: "destructive"
      });
    }
  };

  // Remove from favorites
  const removeFromFavorites = async (mediaId: number, mediaType: 'movie' | 'tv') => {
    if (!user) return;
    
    try {
      const key = `flicker-favorites-${user.id}`;
      
      // Filter out the item
      const updatedFavorites = favorites.filter(
        item => !(item.media_id === mediaId && item.media_type === mediaType)
      );
      
      // Update local state
      setFavorites(updatedFavorites);
      
      // Save to localStorage
      saveLocalData(key, updatedFavorites);
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast({
        title: "Error removing from favorites",
        description: "There was a problem removing from your favorites.",
        variant: "destructive"
      });
    }
  };

  // Check if item is in favorites
  const isInFavorites = (mediaId: number, mediaType: 'movie' | 'tv'): boolean => {
    return favorites.some(item => item.media_id === mediaId && item.media_type === mediaType);
  };

  // Add to watchlist
  const addToWatchlist = async (item: MediaBaseItem) => {
    if (!user) return;
    
    try {
      const key = `flicker-watchlist-${user.id}`;
      
      // Check if already in watchlist
      const existingItem = watchlist.find(watch => 
        watch.media_id === item.media_id && watch.media_type === item.media_type
      );
      
      if (existingItem) {
        return; // Already in watchlist
      }
      
      // Create new watchlist item
      const newItem: WatchlistItem = {
        id: generateId(),
        user_id: user.id,
        media_id: item.media_id,
        media_type: item.media_type,
        title: item.title,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        overview: item.overview,
        rating: item.rating,
        added_at: new Date().toISOString()
      };
      
      // Add to local state
      const updatedWatchlist = [newItem, ...watchlist];
      setWatchlist(updatedWatchlist);
      
      // Save to localStorage
      saveLocalData(key, updatedWatchlist);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast({
        title: "Error adding to watchlist",
        description: "There was a problem adding to your watchlist.",
        variant: "destructive"
      });
    }
  };

  // Remove from watchlist
  const removeFromWatchlist = async (mediaId: number, mediaType: 'movie' | 'tv') => {
    if (!user) return;
    
    try {
      const key = `flicker-watchlist-${user.id}`;
      
      // Filter out the item
      const updatedWatchlist = watchlist.filter(
        item => !(item.media_id === mediaId && item.media_type === mediaType)
      );
      
      // Update local state
      setWatchlist(updatedWatchlist);
      
      // Save to localStorage
      saveLocalData(key, updatedWatchlist);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast({
        title: "Error removing from watchlist",
        description: "There was a problem removing from your watchlist.",
        variant: "destructive"
      });
    }
  };

  // Check if item is in watchlist
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
};

export const useWatchHistory = () => {
  const context = useContext(WatchHistoryContext);
  if (context === undefined) {
    throw new Error('useWatchHistory must be used within a WatchHistoryProvider');
  }
  return context;
};
