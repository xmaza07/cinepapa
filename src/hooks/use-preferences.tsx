
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export interface UserPreferences {
  preferred_video_source: string | null;
}

export const usePreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    preferred_video_source: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setPreferences({ preferred_video_source: null });
      setIsLoading(false);
      return;
    }

    const fetchPreferences = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setPreferences({
            preferred_video_source: data.preferred_video_source,
          });
        }
      } catch (error: any) {
        console.error('Error fetching user preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();

    // Set up realtime subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_preferences',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchPreferences();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Update user preferences
  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_preferences')
        .update(newPreferences)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setPreferences(prev => ({
        ...prev,
        ...newPreferences,
      }));
      
      toast({
        title: 'Preferences updated',
        description: 'Your preferences have been saved.',
      });
    } catch (error: any) {
      console.error('Error updating user preferences:', error);
      toast({
        title: 'Error updating preferences',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return {
    preferences,
    isLoading,
    updatePreferences,
  };
};
