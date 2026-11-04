import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  subscribeAuthState,
  loginUser,
  registerUser,
  logoutUser,
  getAuthErrorMessage,
} from '../services/authService';
import { getUserProfile } from '../services/userService';
import { setupPresence } from '../services/presenceService';
import { UserProfile } from '../types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  currentUser: UserProfile | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthProvider = (): AuthContextType => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async (uid: string, fbUser?: FirebaseUser | null) => {
    try {
      const profile = await getUserProfile(uid);
      if (profile) {
        setCurrentUser(profile);
      } else {
        setCurrentUser({
          uid,
          name: fbUser?.displayName || fbUser?.email?.split('@')[0] || 'User',
          email: fbUser?.email || '',
        });
      }
    } catch (e) {
      console.warn('Failed to fetch user profile:', e);
    }
  }, []);

  useEffect(() => {
    const unsubscribeAuth = subscribeAuthState(async user => {
      setFirebaseUser(user);
      if (user) {
        await fetchProfile(user.uid, user);
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribeAuth();
  }, [fetchProfile]);

  // Setup presence when authenticated
  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const cleanupPresence = setupPresence(firebaseUser.uid);
    return () => {
      cleanupPresence();
    };
  }, [firebaseUser?.uid]);

  const login = useCallback(async (email: string, pass: string) => {
    try {
      setIsLoading(true);
      const user = await loginUser(email, pass);
      await fetchProfile(user.uid, user);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: getAuthErrorMessage(error) };
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  const register = useCallback(
    async (name: string, email: string, pass: string) => {
      try {
        setIsLoading(true);
        const profile = await registerUser(name, email, pass);
        setCurrentUser(profile);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: getAuthErrorMessage(error) };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await logoutUser();
      setCurrentUser(null);
      setFirebaseUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (firebaseUser?.uid) {
      await fetchProfile(firebaseUser.uid, firebaseUser);
    }
  }, [fetchProfile, firebaseUser]);

  return {
    firebaseUser,
    currentUser,
    isLoading,
    login,
    register,
    logout,
    refreshProfile,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authValue = useAuthProvider();
  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

