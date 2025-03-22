import { createContext } from 'react';

export interface UserPreferences {
  id?: string;
  user_id: string;
  preferred_source?: string;
  subtitle_language?: string;
  audio_language?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferencesContextType {
  userPreferences: UserPreferences | null;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  isLoading: boolean;
}

export const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);