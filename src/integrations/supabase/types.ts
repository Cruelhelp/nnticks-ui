export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      epoch_ticks: {
        Row: {
          created_at: string
          epoch_id: string
          id: string
          ticks: Json
        }
        Insert: {
          created_at?: string
          epoch_id: string
          id?: string
          ticks: Json
        }
        Update: {
          created_at?: string
          epoch_id?: string
          id?: string
          ticks?: Json
        }
        Relationships: [
          {
            foreignKeyName: "epoch_ticks_epoch_id_fkey"
            columns: ["epoch_id"]
            isOneToOne: false
            referencedRelation: "epochs"
            referencedColumns: ["id"]
          },
        ]
      }
      epochs: {
        Row: {
          accuracy: number | null
          batch_size: number
          completed_at: string
          created_at: string
          epoch_number: number
          id: string
          loss: number | null
          model_state: Json | null
          session_id: string | null
          training_time: number | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          batch_size?: number
          completed_at?: string
          created_at?: string
          epoch_number: number
          id?: string
          loss?: number | null
          model_state?: Json | null
          session_id?: string | null
          training_time?: number | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          batch_size?: number
          completed_at?: string
          created_at?: string
          epoch_number?: number
          id?: string
          loss?: number | null
          model_state?: Json | null
          session_id?: string | null
          training_time?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "epochs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      tick_collection_settings: {
        Row: {
          batch_size: number
          enabled: boolean
          last_updated: string
          user_id: string
        }
        Insert: {
          batch_size?: number
          enabled?: boolean
          last_updated?: string
          user_id: string
        }
        Update: {
          batch_size?: number
          enabled?: boolean
          last_updated?: string
          user_id?: string
        }
        Relationships: []
      }
      ticks: {
        Row: {
          created_at: string
          id: string
          market: string
          timestamp: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          market: string
          timestamp: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          market?: string
          timestamp?: string
          value?: number
        }
        Relationships: []
      }
      trade_history: {
        Row: {
          confidence: number
          created_at: string
          id: string
          market: string
          outcome: string
          prediction: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          confidence: number
          created_at?: string
          id?: string
          market: string
          outcome: string
          prediction: string
          timestamp: string
          user_id?: string | null
        }
        Update: {
          confidence?: number
          created_at?: string
          id?: string
          market?: string
          outcome?: string
          prediction?: string
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      training_history: {
        Row: {
          accuracy: number
          created_at: string
          date: string
          id: string
          mission: string
          model_data: Json | null
          points: number
          user_id: string | null
        }
        Insert: {
          accuracy: number
          created_at?: string
          date: string
          id?: string
          mission: string
          model_data?: Json | null
          points: number
          user_id?: string | null
        }
        Update: {
          accuracy?: number
          created_at?: string
          date?: string
          id?: string
          mission?: string
          model_data?: Json | null
          points?: number
          user_id?: string | null
        }
        Relationships: []
      }
      training_sessions: {
        Row: {
          accuracy: number | null
          completed_at: string | null
          epochs: number
          id: string
          model: Json | null
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          completed_at?: string | null
          epochs: number
          id?: string
          model?: Json | null
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          accuracy?: number | null
          completed_at?: string | null
          epochs?: number
          id?: string
          model?: Json | null
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_epochs: {
        Row: {
          epochs: number
          last_updated: string
          user_id: string
        }
        Insert: {
          epochs?: number
          last_updated?: string
          user_id: string
        }
        Update: {
          epochs?: number
          last_updated?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
