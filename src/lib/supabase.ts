
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hsuaodgnofwagsvsbnjw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdWFvZGdub2Z3YWdzdnNibmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NDM3NzIsImV4cCI6MjA1OTAxOTc3Mn0.cqCay9zShrybHQqf8QWmn02IIQuRuW8r2efFjyXmmnc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
