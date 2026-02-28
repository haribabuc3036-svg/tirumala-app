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
          category_image: string | null;
          category_image_public_id: string | null;
          category_order: number;
          title: string;
          description: string;
          icon: string;
          image: string | null;
          image_public_id: string | null;
          url: string;
          tag: string | null;
          tag_color: string | null;
          sort_order: number;
          show_on_overview: boolean;
          overview_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          category_id: string;
          category_heading: string;
          category_icon: string;
          category_image?: string | null;
          category_image_public_id?: string | null;
          category_order?: number;
          title: string;
          description: string;
          icon: string;
          image?: string | null;
          image_public_id?: string | null;
          url: string;
          tag?: string | null;
          tag_color?: string | null;
          sort_order?: number;
          show_on_overview?: boolean;
          overview_order?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          category_id?: string;
          category_heading?: string;
          category_icon?: string;
          category_image?: string | null;
          category_image_public_id?: string | null;
          category_order?: number;
          title?: string;
          description?: string;
          icon?: string;
          image?: string | null;
          image_public_id?: string | null;
          url?: string;
          tag?: string | null;
          tag_color?: string | null;
          sort_order?: number;
          show_on_overview?: boolean;
          overview_order?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      service_images: {
        Row: {
          id: number;
          service_id: string;
          image_url: string;
          public_id: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: never;
          service_id: string;
          image_url: string;
          public_id?: string | null;
          sort_order?: number;
          created_at?: string | null;
        };
        Update: {
          id?: never;
          service_id?: string;
          image_url?: string;
          public_id?: string | null;
          sort_order?: number;
          created_at?: string | null;
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
      help_faqs: {
        Row: {
          id: number;
          question: string;
          answer: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          question: string;
          answer: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: never;
          question?: string;
          answer?: string;
          sort_order?: number;
          is_active?: boolean;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      help_dress_code: {
        Row: {
          id: number;
          section: 'men' | 'women' | 'general';
          content: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          section: 'men' | 'women' | 'general';
          content: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: never;
          section?: 'men' | 'women' | 'general';
          content?: string;
          sort_order?: number;
          is_active?: boolean;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      help_dos_donts: {
        Row: {
          id: number;
          type: 'do' | 'dont';
          content: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          type: 'do' | 'dont';
          content: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: never;
          type?: 'do' | 'dont';
          content?: string;
          sort_order?: number;
          is_active?: boolean;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      help_contact_support: {
        Row: {
          id: number;
          label: string;
          sub_label: string;
          icon: string;
          url: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          label: string;
          sub_label?: string;
          icon?: string;
          url: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: never;
          label?: string;
          sub_label?: string;
          icon?: string;
          url?: string;
          sort_order?: number;
          is_active?: boolean;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      ssd_locations: {
        Row: {
          id: number;
          name: string;
          area: string;
          timings: string;
          note: string | null;
          image_url: string | null;
          image_public_id: string | null;
          maps_url: string;
          tag: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          name: string;
          area: string;
          timings: string;
          note?: string | null;
          image_url?: string | null;
          image_public_id?: string | null;
          maps_url: string;
          tag?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: never;
          name?: string;
          area?: string;
          timings?: string;
          note?: string | null;
          image_url?: string | null;
          image_public_id?: string | null;
          maps_url?: string;
          tag?: string | null;
          sort_order?: number;
          is_active?: boolean;
          updated_at?: string | null;
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
