/**
 * Auto-generated Supabase types.
 *
 * To regenerate: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
 *
 * For now this is a placeholder. Replace with the generated output.
 */
export type Database = {
  public: {
    Tables: {
      darshan_updates: {
        Row: {
          id: number;
          date: string;
          pilgrims: string;
          tonsures: string;
          hundi: string;
          waiting: string;
          darshan_time: string;
          created_at: string;
        };
        Insert: {
          id?: never;
          date: string;
          pilgrims: string;
          tonsures: string;
          hundi: string;
          waiting: string;
          darshan_time: string;
          created_at?: string | null;
        };
        Update: {
          id?: never;
          date?: string;
          pilgrims?: string;
          tonsures?: string;
          hundi?: string;
          waiting?: string;
          darshan_time?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      ssd_status: {
        Row: {
          id: number;
          running_slot: string;
          balance_tickets: string;
          date: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          running_slot: string;
          balance_tickets: string;
          date: string;
          updated_at?: string | null;
        };
        Update: {
          id?: never;
          running_slot?: string;
          balance_tickets?: string;
          date?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      services_catalog: {
        Row: {
          id: string;
          category_id: string;
          category_heading: string;
          category_icon: string;
          category_order: number;
          title: string;
          description: string;
          icon: string;
          url: string;
          tag: string | null;
          tag_color: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          category_id: string;
          category_heading: string;
          category_icon: string;
          category_order?: number;
          title: string;
          description: string;
          icon: string;
          url: string;
          tag?: string | null;
          tag_color?: string | null;
          sort_order?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          category_id?: string;
          category_heading?: string;
          category_icon?: string;
          category_order?: number;
          title?: string;
          description?: string;
          icon?: string;
          url?: string;
          tag?: string | null;
          tag_color?: string | null;
          sort_order?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      wallpapers: {
        Row: {
          id: string;
          title: string;
          image_url: string;
          public_id: string;
          width: number | null;
          height: number | null;
          format: string | null;
          bytes: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          image_url: string;
          public_id: string;
          width?: number | null;
          height?: number | null;
          format?: string | null;
          bytes?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          image_url?: string;
          public_id?: string;
          width?: number | null;
          height?: number | null;
          format?: string | null;
          bytes?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      place_regions: {
        Row: {
          id: string;
          title: string;
          subtitle: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id: string;
          title: string;
          subtitle?: string | null;
          sort_order?: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          subtitle?: string | null;
          sort_order?: number;
          created_at?: string | null;
        };
        Relationships: [];
      };
      places: {
        Row: {
          id: string;
          region_id: string;
          name: string;
          distance_from_tirumala_km: number;
          description: string;
          maps_url: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id: string;
          region_id: string;
          name: string;
          distance_from_tirumala_km: number;
          description: string;
          maps_url: string;
          sort_order?: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          region_id?: string;
          name?: string;
          distance_from_tirumala_km?: number;
          description?: string;
          maps_url?: string;
          sort_order?: number;
          created_at?: string | null;
        };
        Relationships: [];
      };
      place_photos: {
        Row: {
          id: number;
          place_id: string;
          image_url: string;
          public_id: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: never;
          place_id: string;
          image_url: string;
          public_id?: string | null;
          sort_order?: number;
          created_at?: string | null;
        };
        Update: {
          id?: never;
          place_id?: string;
          image_url?: string;
          public_id?: string | null;
          sort_order?: number;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
