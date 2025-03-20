
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/utils/supabase';
import { toast } from './use-toast';

interface UserPreferences {
  id?: string;
  user_id: string;
  preferred_source?: string;
  subtitle_language?: string;
  audio_language?: string;
  created_at?: string;
  updated_at?: string;
}

interface UserPreferencesContextType {
  userPreferences: UserPreferences | null;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  isLoading: boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const UserPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch user preferences when user changes
  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (!user) {
        setUserPreferences(null);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
          throw error;
        }
        
        setUserPreferences(data || { user_id: user.id });
      } catch (error) {
        console.error('Error fetching user preferences:', error);
        toast({
          title: "Error loading preferences",
          description: "There was a problem loading your preferences.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserPreferences();
  }, [user]);
  
  // Update user preferences
  const updatePreferences = async (preferences: Partial<UserPreferences>) => {
    if (!user) return;
    
    try {
      const currentTime = new Date().toISOString();
      
      if (userPreferences?.id) {
        // Update existing preferences
        const { error } = await supabase
          .from('user_preferences')
          .update({
            ...preferences,
            updated_at: currentTime
          })
          .eq('id', userPreferences.id);
          
        if (error) {
          throw error;
        }
        
        setUserPreferences(prev => prev ? { ...prev, ...preferences, updated_at: currentTime } : null);
      } else {
        // Insert new preferences
        const { data, error } = await supabase
          .from('user_preferences')
          .insert([{
            user_id: user.id,
            ...preferences,
            created_at: currentTime,
            updated_at: currentTime
          }])
          .select();
          
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          setUserPreferences(data[0]);
        }
      }
      
      toast({
        title: "Preferences updated",
        description: "Your preferences have been saved successfully."
      });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      toast({
        title: "Error updating preferences",
        description: "There was a problem saving your preferences.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <UserPreferencesContext.Provider value={{
      userPreferences,
      updatePreferences,
      isLoading
    }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};
