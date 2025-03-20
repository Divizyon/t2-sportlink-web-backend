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
      users: {
        Row: {
          id: string
          created_at: string
          email: string
          name: string | null
          avatar_url: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          name?: string | null
          avatar_url?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          updated_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          user_id: string
          full_name: string | null
          avatar_url: string | null
          website: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          updated_at?: string | null
        }
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
  }
} 