import { Session, User } from '@supabase/supabase-js';
import { UserDetailsType } from '@/types/UserTypes';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  userDetails: UserDetailsType | null;
  loading: boolean;

  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: unknown }>;

  signOut: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  updateUserDetails: (details: Partial<UserDetailsType>) => Promise<void>;
  refreshUserDetails: () => Promise<void>;
}
