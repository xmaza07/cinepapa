
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/utils/supabase';
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
  
  // Fetch watch history when user changes
  useEffect(() => {
    const fetchWatchHistory = async () => {
      if (!user) {
        setWatchHistory([]);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('watch_history')
          .select('*')
          .eq('user_id', user.id)
          .order('last_watched', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        // Type assertion to ensure media_type is 'movie' | 'tv'
        const typedData = data.map(item => ({
          ...item,
          media_type: item.media_type as 'movie' | 'tv'
        }));
        
        setWatchHistory(typedData);
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
        const { data, error } = await supabase
          .from('watch_history')
          .insert([{
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
            preferred_source: preferredSource || null,
            last_watched: new Date().toISOString()
          }])
          .select();
          
        if (error) {
          throw error;
        }
        
        // Add to local state
        if (data && data.length > 0) {
          // Type assertion to ensure media_type is 'movie' | 'tv'
          const newItem = {
            ...data[0],
            media_type: data[0].media_type as 'movie' | 'tv'
          };
          
          setWatchHistory(prev => [newItem, ...prev]);
        }
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
      // Build the query
      let query = supabase
        .from('watch_history')
        .update({ 
          watch_position: position,
          last_watched: new Date().toISOString(),
          ...(preferredSource ? { preferred_source: preferredSource } : {})
        })
        .eq('user_id', user.id)
        .eq('media_id', mediaId)
        .eq('media_type', mediaType);
      
      // Add season/episode filters for TV shows
      if (mediaType === 'tv' && season !== undefined && episode !== undefined) {
        query = query.eq('season', season).eq('episode', episode);
      }
      
      const { error } = await query.select();
      
      if (error) {
        throw error;
      }
      
      // Update local state
      setWatchHistory(prev => prev.map(item => {
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
      }));
    } catch (error) {
      console.error('Error updating watch position:', error);
    }
  };
  
  // Clear watch history
  const clearWatchHistory = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('watch_history')
        .delete()
        .eq('user_id', user.id);
        
      if (error) {
        throw error;
      }
      
      setWatchHistory([]);
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
