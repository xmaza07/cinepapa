
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

interface WatchHistoryContextType {
  watchHistory: WatchHistoryItem[];
  addToWatchHistory: (media: Media, position: number, duration: number, season?: number, episode?: number, preferredSource?: string) => Promise<void>;
  updateWatchPosition: (mediaId: number, mediaType: 'movie' | 'tv', position: number, season?: number, episode?: number) => Promise<void>;
  clearWatchHistory: () => Promise<void>;
  isLoading: boolean;
}

const WatchHistoryContext = createContext<WatchHistoryContextType | undefined>(undefined);

export const WatchHistoryProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch watch history from localStorage when user changes
  useEffect(() => {
    const fetchWatchHistory = () => {
      if (!user) {
        setWatchHistory([]);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        // Get watch history from localStorage
        const key = `flicker-watch-history-${user.id}`;
        const storedHistory = getLocalData<WatchHistoryItem[]>(key, []);
        
        setWatchHistory(storedHistory);
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
    };
    
    fetchWatchHistory();
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
  
  return (
    <WatchHistoryContext.Provider value={{
      watchHistory,
      addToWatchHistory,
      updateWatchPosition,
      clearWatchHistory,
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
