
import { createClient } from '@supabase/supabase-js';

// Use either environment variables or fallback to hardcoded values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hsuaodgnofwagsvsbnjw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdWFvZGdub2Z3YWdzdnNibmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NDM3NzIsImV4cCI6MjA1OTAxOTc3Mn0.cqCay9zShrybHQqf8QWmn02IIQuRuW8r2efFjyXmmnc';

// Create supabase client with proper storage handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'supabase.auth.token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});
