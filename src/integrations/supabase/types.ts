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
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      RemovedMedia: {
        Row: {
          additions: string[] | null
          aniId: string | null
          id: string
        }
        Insert: {
          additions?: string[] | null
          aniId?: string | null
          id: string
        }
        Update: {
          additions?: string[] | null
          aniId?: string | null
          id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          preferred_video_source: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferred_video_source?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferred_video_source?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      UserProfile: {
        Row: {
          id: string
          name: string
          setting: Json | null
        }
        Insert: {
          id: string
          name: string
          setting?: Json | null
        }
        Update: {
          id?: string
          name?: string
          setting?: Json | null
        }
        Relationships: []
      }
      watch_history: {
        Row: {
          backdrop_path: string | null
          created_at: string
          duration: number | null
          episode: number | null
          id: string
          last_watched: string
          media_id: number
          media_type: string
          poster_path: string | null
          preferred_source: string | null
          season: number | null
          title: string
          updated_at: string
          user_id: string
          watch_position: number | null
        }
        Insert: {
          backdrop_path?: string | null
          created_at?: string
          duration?: number | null
          episode?: number | null
          id?: string
          last_watched?: string
          media_id: number
          media_type: string
          poster_path?: string | null
          preferred_source?: string | null
          season?: number | null
          title: string
          updated_at?: string
          user_id: string
          watch_position?: number | null
        }
        Update: {
          backdrop_path?: string | null
          created_at?: string
          duration?: number | null
          episode?: number | null
          id?: string
          last_watched?: string
          media_id?: number
          media_type?: string
          poster_path?: string | null
          preferred_source?: string | null
          season?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          watch_position?: number | null
        }
        Relationships: []
      }
      WatchListEpisode: {
        Row: {
          aniId: string | null
          aniTitle: string | null
          createdDate: string | null
          dub: boolean | null
          duration: number | null
          episode: number | null
          id: string
          image: string | null
          nextId: string | null
          nextNumber: number | null
          provider: string | null
          timeWatched: number | null
          title: string | null
          userProfileId: string
          watchId: string
        }
        Insert: {
          aniId?: string | null
          aniTitle?: string | null
          createdDate?: string | null
          dub?: boolean | null
          duration?: number | null
          episode?: number | null
          id: string
          image?: string | null
          nextId?: string | null
          nextNumber?: number | null
          provider?: string | null
          timeWatched?: number | null
          title?: string | null
          userProfileId: string
          watchId: string
        }
        Update: {
          aniId?: string | null
          aniTitle?: string | null
          createdDate?: string | null
          dub?: boolean | null
          duration?: number | null
          episode?: number | null
          id?: string
          image?: string | null
          nextId?: string | null
          nextNumber?: number | null
          provider?: string | null
          timeWatched?: number | null
          title?: string | null
          userProfileId?: string
          watchId?: string
        }
        Relationships: [
          {
            foreignKeyName: "WatchListEpisode_userProfileId_fkey"
            columns: ["userProfileId"]
            isOneToOne: false
            referencedRelation: "UserProfile"
            referencedColumns: ["name"]
          },
        ]
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
