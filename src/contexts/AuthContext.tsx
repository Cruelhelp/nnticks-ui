
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { UserDetailsType } from '@/types/UserTypes';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userDetails: UserDetailsType | null;
  loading: boolean;

  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;

  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: unknown }>;

  signOut: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  updateUserDetails: (details: Partial<UserDetailsType>) => Promise<void>;
  refreshUserDetails: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetailsType | null>(null);
  const [loading, setLoading] = useState(true);



  const fetchUserDetails = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users_extra')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Error fetching user details:', error);
        }
        setUserDetails(null);
      } else if (data) {
        setUserDetails({
          id: data.id,
          user_id: data.user_id,
          username: data.username,
          email: user?.email,
          avatarUrl: data.avatar_url,
          proStatus: data.pro_status,
          isAdmin: data.is_admin,
          lastLogin: data.last_login,
          createdAt: data.created_at,
          settings: data.settings,
          availableEpochs: data.available_epochs,
          totalEpochs: data.total_epochs
        });
        // Update last login time
        const { error: updateError } = await supabase
          .from('users_extra')
          .update({ last_login: new Date().toISOString() })
          .eq('user_id', userId);
        if (updateError) {
          console.error('Error updating last login time:', updateError);
        }
      }
    } catch (err) {
      console.error('Error in fetchUserDetails:', err);
    } finally {
      setLoading(false);
    }
  };


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

  }, []);

  const fetchUserDetails = async (userId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('users_extra')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is the error code for "no rows found"
          console.error('Error fetching user details:', error);
        }
        
        setUserDetails(null);
      } else if (data) {
        setUserDetails({
          id: data.id,
          user_id: data.user_id,
          username: data.username,
          email: user?.email,
          avatarUrl: data.avatar_url,
          proStatus: data.pro_status,
          isAdmin: data.is_admin,
          lastLogin: data.last_login,
          createdAt: data.created_at,
          settings: data.settings,
          availableEpochs: data.available_epochs,
          totalEpochs: data.total_epochs
        });
        
        // Update last login time
        const { error: updateError } = await supabase
          .from('users_extra')
          .update({ last_login: new Date().toISOString() })
          .eq('user_id', userId);
        
        if (updateError) {
          console.error('Error updating last login time:', updateError);
        }
      }
    } catch (err) {
      console.error('Error in fetchUserDetails:', err);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {

  }, [fetchUserDetails]);

  const signIn = async (email: string, password: string): Promise<{ error: unknown }> => {

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error };
    }
  };


  const signUp = async (email: string, password: string, username: string) => {

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
    } catch (error) {
      console.error('Error signing up:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
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
    } catch (error) {
      console.error('Error signing in with Google:', error);
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
    } catch (error) {
      console.error('Error signing in with GitHub:', error);
    }
  };

  const updateUserDetails = async (details: Partial<UserDetailsType>) => {
    if (!user) {
      throw new Error('No user is logged in');
    }
    
    try {
      // Format the data to match the database column names

      const formattedData: any = {};

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
    } catch (error) {
      console.error('Error updating user details:', error);
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
