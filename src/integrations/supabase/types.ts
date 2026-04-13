export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_logs: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_logs_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      announcements: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          message: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          message: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          message?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      category_discounts: {
        Row: {
          active: boolean
          category: string
          created_at: string
          discount_percent: number
          id: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          discount_percent?: number
          id?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          discount_percent?: number
          id?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          expires_at: string | null
          id: string
          max_uses: number | null
          min_purchase: number | null
          type: string
          used_count: number
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_purchase?: number | null
          type?: string
          used_count?: number
          value?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          min_purchase?: number | null
          type?: string
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      events: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          start_date: string | null
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          start_date?: string | null
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          start_date?: string | null
          title?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          admin_reply: string | null
          content: string
          created_at: string
          escalated: boolean | null
          id: string
          replied_at: string | null
          sender: string
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          content: string
          created_at?: string
          escalated?: boolean | null
          id?: string
          replied_at?: string | null
          sender?: string
          user_id: string
        }
        Update: {
          admin_reply?: string | null
          content?: string
          created_at?: string
          escalated?: boolean | null
          id?: string
          replied_at?: string | null
          sender?: string
          user_id?: string
        }
        Relationships: []
      }
      negotiations: {
        Row: {
          admin_response: string | null
          created_at: string
          id: string
          offered_price: number
          original_price: number
          product_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          id?: string
          offered_price: number
          original_price: number
          product_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          id?: string
          offered_price?: number
          original_price?: number
          product_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "negotiations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          items: Json | null
          status: string
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json | null
          status?: string
          total?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json | null
          status?: string
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          notes: string | null
          order_id: string | null
          proof_url: string | null
          reference: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          notes?: string | null
          order_id?: string | null
          proof_url?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          notes?: string | null
          order_id?: string | null
          proof_url?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      popup_ads: {
        Row: {
          active: boolean
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          link_url: string | null
          show_on_pages: string[] | null
          title: string
        }
        Insert: {
          active?: boolean
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          show_on_pages?: string[] | null
          title: string
        }
        Update: {
          active?: boolean
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          link_url?: string | null
          show_on_pages?: string[] | null
          title?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          original_price: number | null
          price: number
          stock: number | null
          vault: boolean | null
          visible: boolean | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          original_price?: number | null
          price?: number
          stock?: number | null
          vault?: boolean | null
          visible?: boolean | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          original_price?: number | null
          price?: number
          stock?: number | null
          vault?: boolean | null
          visible?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_amount: number
          discount_percent: number
          expires_at: string | null
          id: string
          max_uses: number | null
          used_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_amount?: number
          discount_percent?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          used_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_amount?: number
          discount_percent?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          used_count?: number
        }
        Relationships: []
      }
      refunds: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          order_id: string | null
          reason: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          order_id?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          order_id?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      spin_wheels: {
        Row: {
          active: boolean
          created_at: string
          id: string
          label: string
          prize_type: string
          prize_value: string
          probability: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          label: string
          prize_type?: string
          prize_value?: string
          probability?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          label?: string
          prize_type?: string
          prize_value?: string
          probability?: number
        }
        Relationships: []
      }
      tracking: {
        Row: {
          carrier: string | null
          created_at: string
          estimated_delivery: string | null
          id: string
          notes: string | null
          order_id: string | null
          status: string
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          estimated_delivery?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          carrier?: string | null
          created_at?: string
          estimated_delivery?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
