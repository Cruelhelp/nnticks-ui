import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { UserDetailsType } from '@/types/UserTypes';

export const fetchUserDetails = async (
  userId: string,
  user: User | null,
  setUserDetails: (details: UserDetailsType | null) => void,
  setLoading: (loading: boolean) => void
) => {
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
