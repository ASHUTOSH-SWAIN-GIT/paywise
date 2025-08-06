'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { syncUserWithDatabase, getCurrentUser, updateUserProfile } from '@/lib/supabase/user-sync';
import type { User } from '@supabase/supabase-js';
// import type { User as PrismaUser } from '@prisma/client';

// Alternative: Use any type to avoid import issues
type PrismaUser = any;

interface UserContextType {
  user: PrismaUser | null;
  authUser: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<Pick<PrismaUser, 'name' | 'phoneNumber' | 'emailVerified' | 'phoneVerified'>>) => Promise<PrismaUser | null>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PrismaUser | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const customUser = await getCurrentUser();
      setUser(customUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    }
  };

  const updateProfile = async (data: Partial<Pick<PrismaUser, 'name' | 'phoneNumber' | 'emailVerified' | 'phoneVerified'>>) => {
    if (!user) return null;
    
    try {
      const updatedUser = await updateUserProfile(user.id, data);
      if (updatedUser) {
        setUser(updatedUser);
      }
      return updatedUser;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setAuthUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    // Get initial user
    const getInitialUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setAuthUser(authUser);
        
        if (authUser) {
          const customUser = await getCurrentUser();
          setUser(customUser);
        }
      } catch (error) {
        console.error('Error getting initial user:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          try {
            // Sync user with database
            await syncUserWithDatabase(session.user);
            // Get updated user data
            const customUser = await getCurrentUser();
            setUser(customUser);
          } catch (error) {
            console.error('Error syncing user on auth change:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, authUser, loading, signOut, refreshUser, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
