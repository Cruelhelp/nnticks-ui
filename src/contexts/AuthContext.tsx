import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { webSocketService } from '@/services/WebSocketService';

export type UserDetailsType = {
  username: string;
  isAdmin: boolean;
  isBanned: boolean;
  proStatus: boolean;
  full_name?: string;
  avatar_url?: string;
  api_key?: string;
  notifications?: {
    email: boolean;
    app: boolean;
    training: boolean;
    predictions: boolean;
  };
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userDetails: UserDetailsType | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithProvider: (provider: 'google' | 'github') => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  updateUserDetails: (details: Partial<UserDetailsType>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetailsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setData = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error(error);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserDetails(session.user.id);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    try {
      const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Remove guest mode settings when user logs in
          localStorage.removeItem('guestMode');
          localStorage.removeItem('guestUsername');
          await fetchUserDetails(session.user.id);
        } else {
          setUserDetails(null);
        }
      });

      setData();

      return () => {
        if (listener?.subscription) {
          listener.subscription.unsubscribe();
        }
      };
    } catch (error) {
      console.error("Error setting up auth listener:", error);
      setLoading(false);
    }
  }, []);

  const fetchUserDetails = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users_extra')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setUserDetails({
          username: data.username,
          isAdmin: data.is_admin,
          isBanned: data.is_banned,
          proStatus: data.pro_status,
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          api_key: data.api_key,
          notifications: data.notifications
        });

        if (data.is_banned) {
          await supabase.auth.signOut();
        }
      } else {
        const username = user?.email?.split('@')[0] || `user_${Math.floor(Math.random() * 10000)}`;
        
        const { error: insertError } = await supabase
          .from('users_extra')
          .insert({
            user_id: userId,
            is_admin: false,
            is_banned: false,
            pro_status: false,
            username: username
          });
          
        if (insertError) {
          console.error('Error creating user details', insertError);
        } else {
          setUserDetails({
            username,
            isAdmin: false,
            isBanned: false,
            proStatus: false
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success('Signed in successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Error signing in');
      throw error;
    }
  };

  const signInWithProvider = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Error signing in with provider');
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.user) {
        const { error: detailsError } = await supabase
          .from('users_extra')
          .insert({
            user_id: data.user.id,
            username,
            is_admin: false,
            is_banned: false,
            pro_status: false
          });
          
        if (detailsError) throw detailsError;
      }
      
      toast.success('Account created! Please check your email for verification.');
    } catch (error: any) {
      toast.error(error.message || 'Error creating account');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear all local state
      localStorage.removeItem('guestMode');
      localStorage.removeItem('guestUsername');
      
      // No toast needed
    } catch (error: any) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      
      toast.success('Password reset email sent!');
    } catch (error: any) {
      toast.error(error.message || 'Error sending password reset email');
      throw error;
    }
  };

  const signInAsGuest = async () => {
    try {
      const guestUsername = `Guest_${Math.floor(Math.random() * 10000)}`;
      
      localStorage.setItem('guestMode', 'true');
      localStorage.setItem('guestUsername', guestUsername);
      
      setUserDetails({
        username: guestUsername,
        isAdmin: false,
        isBanned: false,
        proStatus: false
      });
    } catch (error: any) {
      console.error('Error signing in as guest:', error);
      throw error;
    }
  };

  const updateUserDetails = async (details: Partial<UserDetailsType>) => {
    if (!user) throw new Error('No user is logged in');

    try {
      const mappedDetails: any = {};
      
      if (details.username !== undefined) mappedDetails.username = details.username;
      if (details.full_name !== undefined) mappedDetails.full_name = details.full_name;
      if (details.avatar_url !== undefined) mappedDetails.avatar_url = details.avatar_url;
      if (details.api_key !== undefined) mappedDetails.api_key = details.api_key;
      if (details.notifications !== undefined) mappedDetails.notifications = details.notifications;

      const { error } = await supabase
        .from('users_extra')
        .update(mappedDetails)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Update local state immediately
      setUserDetails(prev => {
        if (!prev) return details as UserDetailsType;
        return { ...prev, ...details };
      });
      
      // Apply API key to WebSocket service if provided
      if (details.api_key) {
        webSocketService.updateConfig({ apiKey: details.api_key });
        console.log('API key updated in WebSocket service');
      }
      
      // No toast needed
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  const dummyContext: AuthContextType = {
    session: null,
    user: null,
    userDetails: null,
    loading: false,
    signIn: async () => {},
    signInWithProvider: async () => {},
    signUp: async () => {},
    signOut: async () => {},
    resetPassword: async () => {},
    signInAsGuest: async () => {},
    updateUserDetails: async () => {}
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        userDetails,
        loading,
        signIn,
        signInWithProvider,
        signUp,
        signOut,
        resetPassword,
        signInAsGuest,
        updateUserDetails,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
