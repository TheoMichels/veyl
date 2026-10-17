export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  veyl: {
    Tables: {
      digests: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          title: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          title: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: string;
          title?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sources: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          url: string;
          category: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          url: string;
          category: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          url?: string;
          category?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          user_id: string;
          gemini_prompt_ia: string;
          gemini_prompt_lux: string;
          gemini_prompt_tech: string;
          cron_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          gemini_prompt_ia: string;
          gemini_prompt_lux: string;
          gemini_prompt_tech: string;
          cron_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          gemini_prompt_ia?: string;
          gemini_prompt_lux?: string;
          gemini_prompt_tech?: string;
          cron_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type DigestRow = Database['veyl']['Tables']['digests']['Row'];
export type DigestInsert = Database['veyl']['Tables']['digests']['Insert'];
export type DigestUpdate = Database['veyl']['Tables']['digests']['Update'];

export type SourceRow = Database['veyl']['Tables']['sources']['Row'];
export type SourceInsert = Database['veyl']['Tables']['sources']['Insert'];
export type SourceUpdate = Database['veyl']['Tables']['sources']['Update'];

export type UserSettingsRow = Database['veyl']['Tables']['user_settings']['Row'];
export type UserSettingsInsert = Database['veyl']['Tables']['user_settings']['Insert'];
export type UserSettingsUpdate = Database['veyl']['Tables']['user_settings']['Update'];
