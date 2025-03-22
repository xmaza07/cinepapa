import { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks';
import { useToast } from '@/components/ui/use-toast';
import { UserPreferencesContext, UserPreferences, UserPreferencesContextType } from './types/user-preferences';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export { UserPreferencesContext };

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) {
        setUserPreferences(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const userPrefsRef = doc(db, 'userPreferences', user.uid);
        const userPrefsDoc = await getDoc(userPrefsRef);

        if (userPrefsDoc.exists()) {
          setUserPreferences(userPrefsDoc.data() as UserPreferences);
        } else {
          // Initialize with default preferences
          const defaultPreferences: UserPreferences = {
            user_id: user.uid,
            isWatchHistoryEnabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          try {
            await setDoc(userPrefsRef, defaultPreferences);
            setUserPreferences(defaultPreferences);
          } catch (error) {
            console.error('Error creating default preferences:', error);
            toast({
              title: "Error setting up preferences",
              description: "Please make sure you're signed in and try again. If the problem persists, try signing out and back in.",
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
        toast({
          title: "Error loading preferences",
          description: "Please make sure you're signed in and try again. If the problem persists, try signing out and back in.",
          variant: "destructive"
        });
        // Set default preferences in memory even if save fails
        setUserPreferences({
          user_id: user.uid,
          isWatchHistoryEnabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [user, toast]);

  const updatePreferences = async (preferences: Partial<UserPreferences>) => {
    if (!user || !userPreferences) return;

    try {
      const userPrefsRef = doc(db, 'userPreferences', user.uid);
      const updatedPreferences = {
        ...userPreferences,
        ...preferences,
        updated_at: new Date().toISOString()
      };

      await setDoc(userPrefsRef, updatedPreferences);
      setUserPreferences(updatedPreferences);

      toast({
        title: "Preferences updated",
        description: "Your preferences have been saved successfully."
      });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      toast({
        title: "Error saving preferences",
        description: "There was a problem saving your preferences.",
        variant: "destructive"
      });
    }
  };

  const toggleWatchHistory = async () => {
    if (!user || !userPreferences) return;

    try {
      await updatePreferences({
        isWatchHistoryEnabled: !userPreferences.isWatchHistoryEnabled
      });

      toast({
        title: userPreferences.isWatchHistoryEnabled ? "Watch History Disabled" : "Watch History Enabled",
        description: userPreferences.isWatchHistoryEnabled 
          ? "Your watch history will no longer be recorded" 
          : "Your watch history will now be recorded"
      });
    } catch (error) {
      console.error('Error toggling watch history:', error);
    }
  };

  return (
    <UserPreferencesContext.Provider value={{
      userPreferences,
      updatePreferences,
      isLoading,
      toggleWatchHistory
    }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}