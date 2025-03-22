import { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks';
import { getLocalData, saveLocalData, generateId } from '@/utils/supabase';
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

export { WatchHistoryContext };

export function WatchHistoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
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
        const historyKey = `flicker-watch-history-${user.uid}`;
        const favoritesKey = `flicker-favorites-${user.uid}`;
        const watchlistKey = `flicker-watchlist-${user.uid}`;
        
        const storedHistory = getLocalData<WatchHistoryItem[]>(historyKey, []);
        const storedFavorites = getLocalData<FavoriteItem[]>(favoritesKey, []);
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
  }, [user, toast]);
  
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
      const key = `flicker-watch-history-${user.uid}`;
      
      const existingItem = watchHistory.find(item => 
        item.media_id === mediaId && 
        item.media_type === mediaType && 
        (mediaType === 'movie' || (item.season === season && item.episode === episode))
      );
      
      if (existingItem) {
        await updateWatchPosition(mediaId, mediaType, position, season, episode, preferredSource);
      } else {
        const newItem: WatchHistoryItem = {
          id: generateId(),
          user_id: user.uid,
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
        
        const updatedHistory = [newItem, ...watchHistory];
        setWatchHistory(updatedHistory);
        saveLocalData(key, updatedHistory);
      }
    } catch (error) {
      console.error('Error adding to watch history:', error);
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
    
    try {
      const key = `flicker-watch-history-${user.uid}`;
      
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
      
      updatedHistory.sort((a, b) => 
        new Date(b.last_watched).getTime() - new Date(a.last_watched).getTime()
      );
      
      setWatchHistory(updatedHistory);
      saveLocalData(key, updatedHistory);
    } catch (error) {
      console.error('Error updating watch position:', error);
    }
  };
  
  const clearWatchHistory = async () => {
    if (!user) return;
    
    try {
      const key = `flicker-watch-history-${user.uid}`;
      setWatchHistory([]);
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

  const addToFavorites = async (item: MediaBaseItem) => {
    if (!user) return;
    
    try {
      const key = `flicker-favorites-${user.uid}`;
      
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
      
      const updatedFavorites = [newItem, ...favorites];
      setFavorites(updatedFavorites);
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

  const removeFromFavorites = async (mediaId: number, mediaType: 'movie' | 'tv') => {
    if (!user) return;
    
    try {
      const key = `flicker-favorites-${user.uid}`;
      
      const updatedFavorites = favorites.filter(
        item => !(item.media_id === mediaId && item.media_type === mediaType)
      );
      
      setFavorites(updatedFavorites);
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

  const isInFavorites = (mediaId: number, mediaType: 'movie' | 'tv'): boolean => {
    return favorites.some(item => item.media_id === mediaId && item.media_type === mediaType);
  };

  const addToWatchlist = async (item: MediaBaseItem) => {
    if (!user) return;
    
    try {
      const key = `flicker-watchlist-${user.uid}`;
      
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
      
      const updatedWatchlist = [newItem, ...watchlist];
      setWatchlist(updatedWatchlist);
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

  const removeFromWatchlist = async (mediaId: number, mediaType: 'movie' | 'tv') => {
    if (!user) return;
    
    try {
      const key = `flicker-watchlist-${user.uid}`;
      
      const updatedWatchlist = watchlist.filter(
        item => !(item.media_id === mediaId && item.media_type === mediaType)
      );
      
      setWatchlist(updatedWatchlist);
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