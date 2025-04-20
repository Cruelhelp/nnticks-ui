import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { UserDetailsType } from '@/types/UserTypes';
import { toast } from 'sonner';
import { fetchUserDetails as fetchUserDetailsUtil } from './authUtils';
import { AuthContext } from './AuthContextObject';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetailsType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserDetails = useCallback((userId: string) => {
    return fetchUserDetailsUtil(userId, user, setUserDetails, setLoading);
  }, [user]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserDetails(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserDetails(session.user.id);
      } else {
        setUserDetails(null);
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => subscription.unsubscribe();

  }, [fetchUserDetails]);

  const signIn = async (email: string, password: string): Promise<{ error: unknown }> => {

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error: unknown) {
      let message = 'An error occurred';
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: string }).message === 'string'
      ) {
        message = (error as { message: string }).message;
      }
      console.error('Error signing in:', message);
      return { error };
    }
  };


  const signUp = async (email: string, password: string, username: string): Promise<{ error: unknown }> => {

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });
      
      return { error };
    } catch (error: unknown) {
      let message = 'An error occurred';
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: string }).message === 'string'
      ) {
        message = (error as { message: string }).message;
      }
      console.error('Error signing up:', message);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error: unknown) {
      let message = 'An error occurred';
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: string }).message === 'string'
      ) {
        message = (error as { message: string }).message;
      }
      console.error('Error signing out:', message);
    }
  };

  const loginWithGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/callback`
        }
      });
    } catch (error: unknown) {
      let message = 'An error occurred';
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: string }).message === 'string'
      ) {
        message = (error as { message: string }).message;
      }
      console.error('Error signing in with Google:', message);
    }
  };

  const loginWithGithub = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/callback`
        }
      });
    } catch (error: unknown) {
      let message = 'An error occurred';
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: string }).message === 'string'
      ) {
        message = (error as { message: string }).message;
      }
      console.error('Error signing in with GitHub:', message);
    }
  };

  const updateUserDetails = async (details: Partial<UserDetailsType>) => {
    if (!user) {
      throw new Error('No user is logged in');
    }
    
    try {
      // Format the data to match the database column names

      const formattedData: Record<string, unknown> = {};

      
      if (details.username !== undefined) formattedData.username = details.username;
      if (details.avatarUrl !== undefined) formattedData.avatar_url = details.avatarUrl;
      
      const { error } = await supabase
        .from('users_extra')
        .update(formattedData)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Refresh user details to see the changes
      await fetchUserDetails(user.id);
    } catch (error: unknown) {
      let message = 'An error occurred';
      if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof (error as { message?: string }).message === 'string'
      ) {
        message = (error as { message: string }).message;
      }
      console.error('Error updating user details:', message);
      throw error;
    }
  };

  const refreshUserDetails = async () => {
    if (user) {
      await fetchUserDetails(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userDetails,
      loading,
      signIn,
      signUp,
      signOut,
      loginWithGoogle,
      loginWithGithub,
      updateUserDetails,
      refreshUserDetails
    }}>
      {children}
    </AuthContext.Provider>
  );
};
