import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { toast } from './use-toast';

interface User {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const createGuestAccount = (): User => {
  return {
    id: `guest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    email: 'guest@example.com',
    user_metadata: {
      name: 'Guest'
    }
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = () => {
      try {
        setIsLoading(true);
        
        const storedUser = localStorage.getItem('flicker-user');
        
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          const guestUser = createGuestAccount();
          localStorage.setItem('flicker-user', JSON.stringify(guestUser));
          setUser(guestUser);
        }
      } catch (error) {
        console.error('Error checking user:', error);
        const guestUser = createGuestAccount();
        localStorage.setItem('flicker-user', JSON.stringify(guestUser));
        setUser(guestUser);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const newUser = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        email,
        user_metadata: {
          name: email.split('@')[0]
        }
      };
      
      localStorage.setItem('flicker-user', JSON.stringify(newUser));
      setUser(newUser);
      
      toast({
        title: "Signed in",
        description: `Welcome ${newUser.user_metadata?.name || 'User'}!`
      });
      
      return { data: { user: newUser }, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      toast({
        title: "Sign in failed",
        description: error instanceof Error ? error.message : "An error occurred during sign in",
        variant: "destructive"
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    return signIn(email, password);
  };

  const signOut = async () => {
    try {
      const guestUser = createGuestAccount();
      localStorage.setItem('flicker-user', JSON.stringify(guestUser));
      setUser(guestUser);
      
      toast({
        title: "Signed out",
        description: "You are now browsing as a guest"
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Sign out failed",
        description: "An error occurred while signing out",
        variant: "destructive"
      });
    }
  };

  const resetPassword = async (email: string) => {
    toast({
      title: "Password reset",
      description: "This is a guest account, no password reset needed"
    });
    
    return { data: {}, error: null };
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      signIn,
      signUp,
      signOut,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
