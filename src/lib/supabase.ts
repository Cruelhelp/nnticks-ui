
import { createClient } from '@supabase/supabase-js';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      ticks: {
        Row: {
          id: number
          timestamp: string
          value: number
          market: string
        }
        Insert: {
          id?: number
          timestamp: string
          value: number
          market: string
        }
        Update: {
          id?: number
          timestamp?: string
          value?: number
          market?: string
        }
      }
      trade_history: {
        Row: {
          id: number
          user_id: string
          timestamp: string
          market: string
          prediction: string
          confidence: number
          outcome: string
        }
        Insert: {
          id?: number
          user_id: string
          timestamp: string
          market: string
          prediction: string
          confidence: number
          outcome: string
        }
        Update: {
          id?: number
          user_id?: string
          timestamp?: string
          market?: string
          prediction?: string
          confidence?: number
          outcome?: string
        }
      }
      training_history: {
        Row: {
          id: number
          user_id: string
          mission: string
          date: string
          points: number
          accuracy: number
        }
        Insert: {
          id?: number
          user_id: string
          mission: string
          date: string
          points: number
          accuracy: number
        }
        Update: {
          id?: number
          user_id?: string
          mission?: string
          date?: string
          points?: number
          accuracy?: number
        }
      }
      admin_settings: {
        Row: {
          id: number
          paypal_email: string
        }
        Insert: {
          id?: number
          paypal_email: string
        }
        Update: {
          id?: number
          paypal_email?: string
        }
      }
      subscriptions: {
        Row: {
          id: number
          user_id: string
          status: string
          renewal_date: string
        }
        Insert: {
          id?: number
          user_id: string
          status: string
          renewal_date: string
        }
        Update: {
          id?: number
          user_id?: string
          status?: string
          renewal_date?: string
        }
      }
      referrals: {
        Row: {
          id: number
          user_id: string
          referral_code: string
          redeemed: boolean
        }
        Insert: {
          id?: number
          user_id: string
          referral_code: string
          redeemed: boolean
        }
        Update: {
          id?: number
          user_id?: string
          referral_code?: string
          redeemed?: boolean
        }
      }
      users_extra: {
        Row: {
          user_id: string
          is_admin: boolean
          is_banned: boolean
          pro_status: boolean
          username: string
        }
        Insert: {
          user_id: string
          is_admin: boolean
          is_banned: boolean
          pro_status: boolean
          username: string
        }
        Update: {
          user_id?: string
          is_admin?: boolean
          is_banned?: boolean
          pro_status?: boolean
          username?: string
        }
      }
      user_settings: {
        Row: {
          user_id: string
          theme: string
          accent: string
          font: string
          chart_style: string
          terminal_height: number
          sidebar_width: number
        }
        Insert: {
          user_id: string
          theme: string
          accent: string
          font: string
          chart_style: string
          terminal_height: number
          sidebar_width: number
        }
        Update: {
          user_id?: string
          theme?: string
          accent?: string
          font?: string
          chart_style?: string
          terminal_height?: number
          sidebar_width?: number
        }
      }
      leaderboard: {
        Row: {
          user_id: string
          username: string
          accuracy: number
          level: number
        }
        Insert: {
          user_id: string
          username: string
          accuracy: number
          level: number
        }
        Update: {
          user_id?: string
          username?: string
          accuracy?: number
          level?: number
        }
      }
    }
  }
}

const supabaseUrl = 'https://hsuaodgnofwagsvsbnjw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdWFvZGdub2Z3YWdzdnNibmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NDM3NzIsImV4cCI6MjA1OTAxOTc3Mn0.cqCay9zShrybHQqf8QWmn02IIQuRuW8r2efFjyXmmnc';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
