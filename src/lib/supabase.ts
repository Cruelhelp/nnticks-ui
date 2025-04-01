
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
          open?: number
          high?: number
          low?: number
          close?: number
        }
        Insert: {
          id?: number
          timestamp: string
          value: number
          market: string
          open?: number
          high?: number
          low?: number
          close?: number
        }
        Update: {
          id?: number
          timestamp?: string
          value?: number
          market?: string
          open?: number
          high?: number
          low?: number
          close?: number
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
          start_price?: number
          end_price?: number
          time_period?: number
        }
        Insert: {
          id?: number
          user_id: string
          timestamp: string
          market: string
          prediction: string
          confidence: number
          outcome: string
          start_price?: number
          end_price?: number
          time_period?: number
        }
        Update: {
          id?: number
          user_id?: string
          timestamp?: string
          market?: string
          prediction?: string
          confidence?: number
          outcome?: string
          start_price?: number
          end_price?: number
          time_period?: number
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
          model_params?: Json
          training_data_size?: number
        }
        Insert: {
          id?: number
          user_id: string
          mission: string
          date: string
          points: number
          accuracy: number
          model_params?: Json
          training_data_size?: number
        }
        Update: {
          id?: number
          user_id?: string
          mission?: string
          date?: string
          points?: number
          accuracy?: number
          model_params?: Json
          training_data_size?: number
        }
      }
      admin_settings: {
        Row: {
          id: number
          paypal_email: string
          subscription_price?: number
          trial_period_days?: number
        }
        Insert: {
          id?: number
          paypal_email: string
          subscription_price?: number
          trial_period_days?: number
        }
        Update: {
          id?: number
          paypal_email?: string
          subscription_price?: number
          trial_period_days?: number
        }
      }
      subscriptions: {
        Row: {
          id: number
          user_id: string
          status: string
          renewal_date: string
          subscription_type?: string
          payment_method?: string
          amount?: number
        }
        Insert: {
          id?: number
          user_id: string
          status: string
          renewal_date: string
          subscription_type?: string
          payment_method?: string
          amount?: number
        }
        Update: {
          id?: number
          user_id?: string
          status?: string
          renewal_date?: string
          subscription_type?: string
          payment_method?: string
          amount?: number
        }
      }
      referrals: {
        Row: {
          id: number
          user_id: string
          referral_code: string
          redeemed: boolean
          referred_user_id?: string
          date_created?: string
          date_redeemed?: string
        }
        Insert: {
          id?: number
          user_id: string
          referral_code: string
          redeemed: boolean
          referred_user_id?: string
          date_created?: string
          date_redeemed?: string
        }
        Update: {
          id?: number
          user_id?: string
          referral_code?: string
          redeemed?: boolean
          referred_user_id?: string
          date_created?: string
          date_redeemed?: string
        }
      }
      users_extra: {
        Row: {
          user_id: string
          is_admin: boolean
          is_banned: boolean
          pro_status: boolean
          username: string
          avatar_url?: string
          created_at?: string
          last_login?: string
          prediction_count?: number
          prediction_accuracy?: number
        }
        Insert: {
          user_id: string
          is_admin: boolean
          is_banned: boolean
          pro_status: boolean
          username: string
          avatar_url?: string
          created_at?: string
          last_login?: string
          prediction_count?: number
          prediction_accuracy?: number
        }
        Update: {
          user_id?: string
          is_admin?: boolean
          is_banned?: boolean
          pro_status?: boolean
          username?: string
          avatar_url?: string
          created_at?: string
          last_login?: string
          prediction_count?: number
          prediction_accuracy?: number
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
          ranking?: number
          points?: number
          predictions_count?: number
          wins_count?: number
        }
        Insert: {
          user_id: string
          username: string
          accuracy: number
          level: number
          ranking?: number
          points?: number
          predictions_count?: number
          wins_count?: number
        }
        Update: {
          user_id?: string
          username?: string
          accuracy?: number
          level?: number
          ranking?: number
          points?: number
          predictions_count?: number
          wins_count?: number
        }
      }
      user_sessions: {
        Row: {
          id: number
          user_id: string
          start_time: string
          end_time?: string
          device_info?: string
          status: string
          ip_address?: string
        }
        Insert: {
          id?: number
          user_id: string
          start_time: string
          end_time?: string
          device_info?: string
          status: string
          ip_address?: string
        }
        Update: {
          id?: number
          user_id?: string
          start_time?: string
          end_time?: string
          device_info?: string
          status?: string
          ip_address?: string
        }
      }
      ml_models: {
        Row: {
          id: number
          user_id: string
          name: string
          created_at: string
          updated_at: string
          model_type: string
          accuracy: number
          parameters: Json
          is_public: boolean
        }
        Insert: {
          id?: number
          user_id: string
          name: string
          created_at: string
          updated_at?: string
          model_type: string
          accuracy: number
          parameters: Json
          is_public: boolean
        }
        Update: {
          id?: number
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
          model_type?: string
          accuracy?: number
          parameters?: Json
          is_public?: boolean
        }
      }
    }
  }
}

const supabaseUrl = 'https://hsuaodgnofwagsvsbnjw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdWFvZGdub2Z3YWdzdnNibmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NDM3NzIsImV4cCI6MjA1OTAxOTc3Mn0.cqCay9zShrybHQqf8QWmn02IIQuRuW8r2efFjyXmmnc';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
