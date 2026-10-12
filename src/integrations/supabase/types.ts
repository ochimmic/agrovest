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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      assetpay_plans: {
        Row: {
          cancel_reason: string | null
          created_at: string
          deposit_pct: number
          id: string
          installments: Json
          months: number
          purpose: Json
          refund_usd: number | null
          status: string
          total_usd: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_reason?: string | null
          created_at?: string
          deposit_pct: number
          id: string
          installments: Json
          months: number
          purpose: Json
          refund_usd?: number | null
          status?: string
          total_usd: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          cancel_reason?: string | null
          created_at?: string
          deposit_pct?: number
          id?: string
          installments?: Json
          months?: number
          purpose?: Json
          refund_usd?: number | null
          status?: string
          total_usd?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      broker_commissions: {
        Row: {
          amount_usd: number
          asset_name: string
          base_usd: number
          broker_id: string
          created_at: string
          id: string
          investor_id: string
          kind: string
          order_id: string
          pct: number
        }
        Insert: {
          amount_usd: number
          asset_name?: string
          base_usd: number
          broker_id: string
          created_at?: string
          id?: string
          investor_id: string
          kind: string
          order_id: string
          pct: number
        }
        Update: {
          amount_usd?: number
          asset_name?: string
          base_usd?: number
          broker_id?: string
          created_at?: string
          id?: string
          investor_id?: string
          kind?: string
          order_id?: string
          pct?: number
        }
        Relationships: []
      }
      holdings: {
        Row: {
          asset_id: string
          category: string
          id: string
          invested: number
          name: string
          order_id: string | null
          plan_id: string | null
          purchased_at: string
          unit: string
          units: number
          user_id: string
        }
        Insert: {
          asset_id: string
          category: string
          id?: string
          invested: number
          name: string
          order_id?: string | null
          plan_id?: string | null
          purchased_at?: string
          unit: string
          units: number
          user_id: string
        }
        Update: {
          asset_id?: string
          category?: string
          id?: string
          invested?: number
          name?: string
          order_id?: string | null
          plan_id?: string | null
          purchased_at?: string
          unit?: string
          units?: number
          user_id?: string
        }
        Relationships: []
      }
      investor_documents: {
        Row: {
          created_at: string
          doc_type: string
          due_note: string | null
          file_path: string | null
          holding_id: string
          id: string
          issued_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          due_note?: string | null
          file_path?: string | null
          holding_id: string
          id?: string
          issued_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          due_note?: string | null
          file_path?: string | null
          holding_id?: string
          id?: string
          issued_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_documents_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "holdings"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_submissions: {
        Row: {
          address: string
          address_doc_path: string | null
          admin_note: string | null
          city: string
          created_at: string
          id: string
          id_doc_path: string
          id_number: string
          id_type: string
          postcode: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_path: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          address_doc_path?: string | null
          admin_note?: string | null
          city: string
          created_at?: string
          id?: string
          id_doc_path: string
          id_number: string
          id_type: string
          postcode?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_path: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          address?: string
          address_doc_path?: string | null
          admin_note?: string | null
          city?: string
          created_at?: string
          id?: string
          id_doc_path?: string
          id_number?: string
          id_type?: string
          postcode?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_path?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_messages: {
        Row: {
          attachment_path: string | null
          body: string
          created_at: string
          from_admin: boolean
          id: string
          order_id: string
          sender_id: string
        }
        Insert: {
          attachment_path?: string | null
          body?: string
          created_at?: string
          from_admin?: boolean
          id?: string
          order_id: string
          sender_id?: string
        }
        Update: {
          attachment_path?: string | null
          body?: string
          created_at?: string
          from_admin?: boolean
          id?: string
          order_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "pay_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pay_orders: {
        Row: {
          amount_usd: number
          created_at: string
          id: string
          network: string | null
          payer_name: string
          purpose: Json
          rail: string
          rate: number
          reason: string | null
          receipt_path: string | null
          reference: string
          reviewed_by: string | null
          status: string
          timeline: Json
          token: string
          tx_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_usd: number
          created_at?: string
          id: string
          network?: string | null
          payer_name?: string
          purpose: Json
          rail: string
          rate?: number
          reason?: string | null
          receipt_path?: string | null
          reference: string
          reviewed_by?: string | null
          status?: string
          timeline?: Json
          token: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount_usd?: number
          created_at?: string
          id?: string
          network?: string | null
          payer_name?: string
          purpose?: Json
          rail?: string
          rate?: number
          reason?: string | null
          receipt_path?: string | null
          reference?: string
          reviewed_by?: string | null
          status?: string
          timeline?: Json
          token?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          admin_note: string | null
          amount_usd: number
          created_at: string
          details: Json
          fee_usd: number
          id: string
          method: string
          net_usd: number | null
          reference: string
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount_usd: number
          created_at?: string
          details: Json
          fee_usd?: number
          id?: string
          method: string
          net_usd?: number | null
          reference?: string
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          admin_note?: string | null
          amount_usd?: number
          created_at?: string
          details?: Json
          fee_usd?: number
          id?: string
          method?: string
          net_usd?: number | null
          reference?: string
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_txs: {
        Row: {
          amount: number
          created_at: string
          hash: string | null
          id: string
          meta: string | null
          status: string
          token: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          hash?: string | null
          id?: string
          meta?: string | null
          status?: string
          token: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          hash?: string | null
          id?: string
          meta?: string | null
          status?: string
          token?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          kyc: Database["public"]["Enums"]["kyc_status"]
          payout_method: Json | null
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id: string
          kyc?: Database["public"]["Enums"]["kyc_status"]
          payout_method?: Json | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          kyc?: Database["public"]["Enums"]["kyc_status"]
          payout_method?: Json | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          category: string
          created_at: string
          description: string
          disclaimer: string
          id: string
          image_path: string | null
          inspection_date: string
          location: string
          market_price_ngn: number
          status: string
          structural_ok: boolean
          survey_ok: boolean
          title: string
          title_doc: string
          title_search_ok: boolean
          updated_at: string
          verified: boolean
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          disclaimer?: string
          id?: string
          image_path?: string | null
          inspection_date?: string
          location?: string
          market_price_ngn: number
          status?: string
          structural_ok?: boolean
          survey_ok?: boolean
          title: string
          title_doc?: string
          title_search_ok?: boolean
          updated_at?: string
          verified?: boolean
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          disclaimer?: string
          id?: string
          image_path?: string | null
          inspection_date?: string
          location?: string
          market_price_ngn?: number
          status?: string
          structural_ok?: boolean
          survey_ok?: boolean
          title?: string
          title_doc?: string
          title_search_ok?: boolean
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      _tl: { Args: { msg: string; tl: Json }; Returns: Json }
      admin_confirm_order: { Args: { p_id: string }; Returns: undefined }
      admin_reject_order: {
        Args: { p_id: string; p_reason: string }
        Returns: undefined
      }
      admin_request_info: {
        Args: { p_id: string; p_note: string }
        Returns: undefined
      }
      admin_review_kyc: {
        Args: { p_decision: string; p_id: string; p_note: string }
        Returns: undefined
      }
      gen_ref_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      my_commission_balance: {
        Args: never
        Returns: {
          available: number
          earned: number
          pending: number
          plots: number
          withdrawn: number
        }[]
      }
      my_referrals: {
        Args: never
        Returns: {
          full_name: string
          joined_at: string
          kyc: Database["public"]["Enums"]["kyc_status"]
          purchases: number
        }[]
      }
      order_mark_onchain: {
        Args: { p_id: string; p_network: string; p_tx_hash: string }
        Returns: undefined
      }
      order_mark_transfer: {
        Args: { p_id: string; p_receipt?: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "investor" | "broker" | "vendor" | "admin"
      kyc_status:
        | "none"
        | "pending"
        | "review"
        | "approved"
        | "rejected"
        | "more_info"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["investor", "broker", "vendor", "admin"],
      kyc_status: [
        "none",
        "pending",
        "review",
        "approved",
        "rejected",
        "more_info",
      ],
    },
  },
} as const
