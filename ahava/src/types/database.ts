export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          updated_at?: string
        }
      }
      study_rooms: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          passage_reference: string | null
          is_public: boolean
          member_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id: string
          passage_reference?: string | null
          is_public?: boolean
          member_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          passage_reference?: string | null
          is_public?: boolean
          member_count?: number
          updated_at?: string
        }
      }
      room_members: {
        Row: {
          id: string
          room_id: string
          user_id: string
          role: 'owner' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          role?: 'owner' | 'member'
          joined_at?: string
        }
        Update: {
          role?: 'owner' | 'member'
        }
      }
      shared_notes: {
        Row: {
          id: string
          room_id: string | null
          user_id: string
          book: string
          chapter: number
          verse: number
          verse_end: number | null
          content: string
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id?: string | null
          user_id: string
          book: string
          chapter: number
          verse: number
          verse_end?: number | null
          content: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          content?: string
          is_public?: boolean
          room_id?: string | null
          verse_end?: number | null
          updated_at?: string
        }
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          book: string
          chapter: number
          verse: number
          label: string | null
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book: string
          chapter: number
          verse: number
          label?: string | null
          color?: string | null
          created_at?: string
        }
        Update: {
          label?: string | null
          color?: string | null
        }
      }
      highlights: {
        Row: {
          id: string
          user_id: string
          book: string
          chapter: number
          verse: number
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book: string
          chapter: number
          verse: number
          color: string
          created_at?: string
        }
        Update: {
          color?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          room_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: never
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type StudyRoom = Database['public']['Tables']['study_rooms']['Row']
export type RoomMember = Database['public']['Tables']['room_members']['Row']
export type SharedNote = Database['public']['Tables']['shared_notes']['Row']
export type Bookmark = Database['public']['Tables']['bookmarks']['Row']
export type Highlight = Database['public']['Tables']['highlights']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
