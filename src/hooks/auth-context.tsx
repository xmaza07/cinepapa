
import { useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';
import { AuthContext, AuthContextType } from '@/contexts/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if Firebase auth is properly initialized
    if (!auth) {
      console.error("Firebase auth is not initialized");
      setAuthError("Firebase authentication is not available");
      setLoading(false);
      return () => {};
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      }, (error) => {
        console.error("Auth state change error:", error);
        setAuthError(error.message);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up auth listener:", error);
      setAuthError(error instanceof Error ? error.message : "Authentication error");
      setLoading(false);
      return () => {};
    }
  }, []);

  // Show toast for authentication errors
  useEffect(() => {
    if (authError) {
      toast({
        title: "Authentication Error",
        description: authError,
        variant: "destructive",
      });
    }
  }, [authError, toast]);

  const handleAuthError = (error: FirebaseError) => {
    console.error("Auth operation error:", error);
    setAuthError(error.message);
    toast({
      title: "Authentication Error",
      description: error.message,
      variant: "destructive",
    });
    throw error;
  };

  const signIn = async (email: string, password: string) => {
    try {
      if (!auth) throw new Error("Firebase auth is not initialized");
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    } catch (error) {
      if (error instanceof FirebaseError) {
        handleAuthError(error);
      }
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      if (!auth) throw new Error("Firebase auth is not initialized");
      await createUserWithEmailAndPassword(auth, email, password);
      toast({
        title: "Account created",
        description: "Your account has been created successfully.",
      });
    } catch (error) {
      if (error instanceof FirebaseError) {
        handleAuthError(error);
      }
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (!auth) throw new Error("Firebase auth is not initialized");
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast({
        title: "Welcome!",
        description: "You have successfully signed in with Google.",
      });
    } catch (error) {
      if (error instanceof FirebaseError) {
        handleAuthError(error);
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (!auth) throw new Error("Firebase auth is not initialized");
      await signOut(auth);
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      if (error instanceof FirebaseError) {
        handleAuthError(error);
      }
      throw error;
    }
  };

  // If there's an authentication error, return an error state
  if (authError && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="glass p-6 rounded-lg max-w-md w-full">
          <h2 className="text-xl font-bold text-white mb-4">Authentication Error</h2>
          <p className="text-white/70 mb-4">{authError}</p>
          <p className="text-white/70">
            Please check your Firebase configuration and ensure you have the correct API keys.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      logout,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
