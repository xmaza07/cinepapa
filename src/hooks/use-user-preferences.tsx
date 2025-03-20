
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAuth } from './use-auth';
import { getLocalData, saveLocalData, generateId } from '@/utils/supabase';
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
  
  // Fetch user preferences from localStorage when user changes
  useEffect(() => {
    const fetchUserPreferences = () => {
      if (!user) {
        setUserPreferences(null);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        // Get preferences from localStorage
        const key = `flicker-preferences-${user.id}`;
        const storedPreferences = getLocalData<UserPreferences | null>(key, null);
        
        setUserPreferences(storedPreferences || { user_id: user.id });
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
  
  // Update user preferences in localStorage
  const updatePreferences = async (preferences: Partial<UserPreferences>) => {
    if (!user) return;
    
    try {
      const currentTime = new Date().toISOString();
      const key = `flicker-preferences-${user.id}`;
      
      if (userPreferences?.id) {
        // Update existing preferences
        const updatedPreferences = {
          ...userPreferences,
          ...preferences,
          updated_at: currentTime
        };
        
        saveLocalData(key, updatedPreferences);
        setUserPreferences(updatedPreferences);
      } else {
        // Create new preferences
        const newPreferences = {
          id: generateId(),
          user_id: user.id,
          ...preferences,
          created_at: currentTime,
          updated_at: currentTime
        };
        
        saveLocalData(key, newPreferences);
        setUserPreferences(newPreferences);
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
