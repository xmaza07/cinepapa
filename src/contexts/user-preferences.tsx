import { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks';
import { getLocalData, saveLocalData, generateId } from '@/utils/supabase';
import { useToast } from '@/components/ui/use-toast';
import { UserPreferencesContext, UserPreferences, UserPreferencesContextType } from './types/user-preferences';

export { UserPreferencesContext };

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchUserPreferences = () => {
      if (!user) {
        setUserPreferences(null);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const key = `flicker-preferences-${user.uid}`;
        const storedPreferences = getLocalData<UserPreferences | null>(key, null);
        
        setUserPreferences(storedPreferences || { user_id: user.uid });
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
  }, [user, toast]);
  
  const updatePreferences = async (preferences: Partial<UserPreferences>) => {
    if (!user) return;
    
    try {
      const currentTime = new Date().toISOString();
      const key = `flicker-preferences-${user.uid}`;
      
      if (userPreferences?.id) {
        const updatedPreferences = {
          ...userPreferences,
          ...preferences,
          updated_at: currentTime
        };
        
        saveLocalData(key, updatedPreferences);
        setUserPreferences(updatedPreferences);
      } else {
        const newPreferences = {
          id: generateId(),
          user_id: user.uid,
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
}