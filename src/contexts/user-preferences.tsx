
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
          const prefs = userPrefsDoc.data() as UserPreferences;
          setUserPreferences(prefs);
          
          // Apply accent color if it exists
          if (prefs.accentColor) {
            applyAccentColor(prefs.accentColor);
          }
        } else {
          // Initialize with default preferences
          const defaultPreferences: UserPreferences = {
            user_id: user.uid,
            isWatchHistoryEnabled: true,
            accentColor: '#E63462', // Default accent color
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          try {
            await setDoc(userPrefsRef, defaultPreferences);
            setUserPreferences(defaultPreferences);
            
            // Apply default accent color
            applyAccentColor(defaultPreferences.accentColor);
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
          accentColor: '#E63462',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [user, toast]);

  // Function to map hex color to HSL
  const getHSLFromHex = (hex: string): string => {
    // Default HSL values for common accent colors
    const colorMap: Record<string, string> = {
      '#E63462': '347 80% 55%',  // Pink
      '#9b87f5': '250 85% 75%',  // Purple
      '#0EA5E9': '199 89% 48%',  // Blue
      '#10B981': '160 84% 39%',  // Green
      '#F59E0B': '38 92% 50%',   // Yellow
      '#F97316': '24 94% 53%',   // Orange
      '#EF4444': '0 84% 60%',    // Red
    };
    
    return colorMap[hex] || '347 80% 55%'; // Default to pink if unknown
  };

  // Apply accent color to CSS variables
  const applyAccentColor = (colorHex: string) => {
    const hsl = getHSLFromHex(colorHex);
    document.documentElement.style.setProperty('--accent', hsl);
  };

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

  const setAccentColor = async (color: string) => {
    if (!user || !userPreferences) return;

    try {
      await updatePreferences({
        accentColor: color
      });

      // Apply the color
      applyAccentColor(color);

      toast({
        title: "Accent Color Updated",
        description: "Your accent color preference has been saved."
      });
    } catch (error) {
      console.error('Error setting accent color:', error);
    }
  };

  return (
    <UserPreferencesContext.Provider value={{
      userPreferences,
      updatePreferences,
      isLoading,
      toggleWatchHistory,
      setAccentColor
    }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}
