
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export interface WatchHistoryItem {
  id: string;
  media_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  season?: number;
  episode?: number;
  watch_position: number;
  duration: number;
  last_watched: string;
  preferred_source?: string;
}

export const useWatchHistory = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch watch history
  useEffect(() => {
    if (!user) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    const fetchWatchHistory = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('watch_history')
          .select('*')
          .order('last_watched', { ascending: false })
          .limit(20);

        if (error) throw error;
        
        setHistory(data || []);
      } catch (error: any) {
        console.error('Error fetching watch history:', error);
        toast({
          title: 'Error fetching watch history',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWatchHistory();

    // Set up realtime subscription for watch history updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'watch_history',
        },
        () => {
          fetchWatchHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  // Update or add to watch history
  const updateWatchHistory = async (item: Omit<WatchHistoryItem, 'id' | 'last_watched'>) => {
    if (!user) return null;
    
    try {
      // First check if we already have this item
      const { data: existingData } = await supabase
        .from('watch_history')
        .select('id')
        .match({
          user_id: user.id,
          media_id: item.media_id,
          media_type: item.media_type,
          ...(item.season !== undefined ? { season: item.season } : {}),
          ...(item.episode !== undefined ? { episode: item.episode } : {}),
        })
        .single();

      let result;
      
      if (existingData) {
        // Update existing record
        result = await supabase
          .from('watch_history')
          .update({
            watch_position: item.watch_position,
            duration: item.duration,
            last_watched: new Date().toISOString(),
            preferred_source: item.preferred_source,
          })
          .match({ id: existingData.id })
          .select()
          .single();
      } else {
        // Insert new record
        result = await supabase
          .from('watch_history')
          .insert({
            user_id: user.id,
            ...item,
            last_watched: new Date().toISOString(),
          })
          .select()
          .single();
      }

      if (result.error) throw result.error;
      
      // Invalidate any relevant queries
      queryClient.invalidateQueries({ queryKey: ['watchHistory'] });
      
      return result.data;
      
    } catch (error: any) {
      console.error('Error updating watch history:', error);
      toast({
        title: 'Error updating watch history',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  // Get a specific watch history item
  const getWatchHistoryItem = async (
    mediaId: number, 
    mediaType: 'movie' | 'tv', 
    season?: number, 
    episode?: number
  ) => {
    if (!user) return null;
    
    try {
      const query = supabase
        .from('watch_history')
        .select('*')
        .match({
          user_id: user.id,
          media_id: mediaId,
          media_type: mediaType,
        });
        
      // Add season and episode filters if provided (for TV shows)
      if (season !== undefined) {
        query.eq('season', season);
      }
      
      if (episode !== undefined) {
        query.eq('episode', episode);
      }
      
      const { data, error } = await query.maybeSingle();
      
      if (error) throw error;
      
      return data;
    } catch (error: any) {
      console.error('Error fetching watch history item:', error);
      return null;
    }
  };

  // Get in-progress items (for Continue Watching section)
  const getContinueWatching = async () => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('watch_history')
        .select('*')
        .lt('watch_position', 'duration') // Only items that haven't finished
        .gt('watch_position', 0) // Only items that have started
        .order('last_watched', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      return data || [];
    } catch (error: any) {
      console.error('Error fetching continue watching:', error);
      return [];
    }
  };

  return {
    history,
    isLoading,
    updateWatchHistory,
    getWatchHistoryItem,
    getContinueWatching,
  };
};
