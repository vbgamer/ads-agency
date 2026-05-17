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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      campaign_analytics: {
        Row: {
          campaign_id: string
          created_at: string | null
          event_type: string | null
          id: string
          location_city: string | null
          location_country: string | null
          location_state: string | null
          user_id: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          event_type?: string | null
          id?: string
          location_city?: string | null
          location_country?: string | null
          location_state?: string | null
          user_id?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          event_type?: string | null
          id?: string
          location_city?: string | null
          location_country?: string | null
          location_state?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_reactions: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          reaction: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          reaction: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          reaction?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_reactions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          ad_format: string | null
          cash_allotment: number
          category: string | null
          clicks: number | null
          code: string | null
          company_id: string
          conversions: number | null
          created_at: string | null
          description: string | null
          destination_url: string
          end_date: string
          id: string
          image_url: string | null
          reward_hold_days: number
          start_date: string
          status: string | null
          title: string
          video_url: string | null
        }
        Insert: {
          ad_format?: string | null
          cash_allotment: number
          category?: string | null
          clicks?: number | null
          code?: string | null
          company_id: string
          conversions?: number | null
          created_at?: string | null
          description?: string | null
          destination_url: string
          end_date: string
          id?: string
          image_url?: string | null
          reward_hold_days?: number
          start_date: string
          status?: string | null
          title: string
          video_url?: string | null
        }
        Update: {
          ad_format?: string | null
          cash_allotment?: number
          category?: string | null
          clicks?: number | null
          code?: string | null
          company_id?: string
          conversions?: number | null
          created_at?: string | null
          description?: string | null
          destination_url?: string
          end_date?: string
          id?: string
          image_url?: string | null
          reward_hold_days?: number
          start_date?: string
          status?: string | null
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cashback_disputes: {
        Row: {
          actual_amount: number
          assigned_to: string | null
          brand_name: string
          created_at: string
          description: string
          dispute_type: string
          expected_amount: number
          id: string
          order_id: string
          resolution_amount: number | null
          resolution_notes: string | null
          resolved_at: string | null
          screenshot_url: string | null
          status: string
          transaction_date: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_amount?: number
          assigned_to?: string | null
          brand_name: string
          created_at?: string
          description: string
          dispute_type: string
          expected_amount: number
          id?: string
          order_id: string
          resolution_amount?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          screenshot_url?: string | null
          status?: string
          transaction_date: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_amount?: number
          assigned_to?: string | null
          brand_name?: string
          created_at?: string
          description?: string
          dispute_type?: string
          expected_amount?: number
          id?: string
          order_id?: string
          resolution_amount?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          screenshot_url?: string | null
          status?: string
          transaction_date?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashback_disputes_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "cashback_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      cashback_transactions: {
        Row: {
          amount: number
          auto_verified: boolean | null
          campaign_id: string | null
          company_id: string | null
          created_at: string | null
          extended_hold_until: string | null
          fraud_flags_count: number | null
          hold_until: string | null
          id: string
          rejection_reason: string | null
          risk_score: number | null
          status: string | null
          tracking_click_id: string | null
          user_id: string
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          auto_verified?: boolean | null
          campaign_id?: string | null
          company_id?: string | null
          created_at?: string | null
          extended_hold_until?: string | null
          fraud_flags_count?: number | null
          hold_until?: string | null
          id?: string
          rejection_reason?: string | null
          risk_score?: number | null
          status?: string | null
          tracking_click_id?: string | null
          user_id: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          auto_verified?: boolean | null
          campaign_id?: string | null
          company_id?: string | null
          created_at?: string | null
          extended_hold_until?: string | null
          fraud_flags_count?: number | null
          hold_until?: string | null
          id?: string
          rejection_reason?: string | null
          risk_score?: number | null
          status?: string | null
          tracking_click_id?: string | null
          user_id?: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cashback_transactions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashback_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashback_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          bio: string | null
          category: string | null
          cover_url: string | null
          created_at: string | null
          email: string
          facebook: string | null
          gst_number: string | null
          id: string
          instagram: string | null
          is_verified: boolean | null
          linkedin: string | null
          logo_url: string | null
          name: string
          onboarding_completed: boolean | null
          twitter: string | null
          website: string | null
        }
        Insert: {
          bio?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string | null
          email: string
          facebook?: string | null
          gst_number?: string | null
          id: string
          instagram?: string | null
          is_verified?: boolean | null
          linkedin?: string | null
          logo_url?: string | null
          name: string
          onboarding_completed?: boolean | null
          twitter?: string | null
          website?: string | null
        }
        Update: {
          bio?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string | null
          email?: string
          facebook?: string | null
          gst_number?: string | null
          id?: string
          instagram?: string | null
          is_verified?: boolean | null
          linkedin?: string | null
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean | null
          twitter?: string | null
          website?: string | null
        }
        Relationships: []
      }
      company_wallets: {
        Row: {
          balance: number | null
          company_id: string
          id: string
          total_deposited: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          balance?: number | null
          company_id: string
          id?: string
          total_deposited?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          balance?: number | null
          company_id?: string
          id?: string
          total_deposited?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_wallets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_flags: {
        Row: {
          created_at: string | null
          details: Json | null
          flag_type: string
          id: string
          resolution_notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          rule_id: string | null
          severity: string
          transaction_id: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          flag_type: string
          id?: string
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          rule_id?: string | null
          severity?: string
          transaction_id: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          flag_type?: string
          id?: string
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          rule_id?: string | null
          severity?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_flags_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "fraud_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fraud_flags_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "cashback_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_notification_settings: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          id: string
          notify_critical_risk: boolean | null
          notify_high_risk: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          notify_critical_risk?: boolean | null
          notify_high_risk?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          notify_critical_risk?: boolean | null
          notify_high_risk?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fraud_rules: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          parameters: Json
          rule_type: string
          severity: string
          updated_at: string | null
        }
        Insert: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parameters?: Json
          rule_type: string
          severity?: string
          updated_at?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parameters?: Json
          rule_type?: string
          severity?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      fraud_settings: {
        Row: {
          auto_reject_risk_threshold: number | null
          auto_verify_risk_threshold: number | null
          company_id: string | null
          created_at: string | null
          critical_risk_hold_days: number
          default_hold_days: number
          high_risk_hold_days: number
          id: string
          max_conversions_per_user_per_campaign: number | null
          max_conversions_per_user_per_day: number | null
          updated_at: string | null
        }
        Insert: {
          auto_reject_risk_threshold?: number | null
          auto_verify_risk_threshold?: number | null
          company_id?: string | null
          created_at?: string | null
          critical_risk_hold_days?: number
          default_hold_days?: number
          high_risk_hold_days?: number
          id?: string
          max_conversions_per_user_per_campaign?: number | null
          max_conversions_per_user_per_day?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_reject_risk_threshold?: number | null
          auto_verify_risk_threshold?: number | null
          company_id?: string | null
          created_at?: string | null
          critical_risk_hold_days?: number
          default_hold_days?: number
          high_risk_hold_days?: number
          id?: string
          max_conversions_per_user_per_campaign?: number | null
          max_conversions_per_user_per_day?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fraud_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          card_last_four: string | null
          company_id: string | null
          created_at: string
          currency: string
          error_message: string | null
          id: string
          payment_type: string
          status: string
          user_id: string | null
        }
        Insert: {
          amount: number
          card_last_four?: string | null
          company_id?: string | null
          created_at?: string
          currency?: string
          error_message?: string | null
          id?: string
          payment_type: string
          status?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          card_last_four?: string | null
          company_id?: string | null
          created_at?: string
          currency?: string
          error_message?: string | null
          id?: string
          payment_type?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_webhook_events: {
        Row: {
          created_at: string
          event_hash: string
          event_type: string
          id: string
          processed_at: string
          source: string | null
          tracking_id: string
        }
        Insert: {
          created_at?: string
          event_hash: string
          event_type: string
          id?: string
          processed_at?: string
          source?: string | null
          tracking_id: string
        }
        Update: {
          created_at?: string
          event_hash?: string
          event_type?: string
          id?: string
          processed_at?: string
          source?: string | null
          tracking_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          gender: string | null
          id: string
          is_premium: boolean | null
          is_supporter: boolean | null
          name: string
          phone: string | null
          referral_code: string | null
          referral_discounts_available: number | null
          state: string | null
        }
        Insert: {
          age?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          gender?: string | null
          id: string
          is_premium?: boolean | null
          is_supporter?: boolean | null
          name: string
          phone?: string | null
          referral_code?: string | null
          referral_discounts_available?: number | null
          state?: string | null
        }
        Update: {
          age?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          is_premium?: boolean | null
          is_supporter?: boolean | null
          name?: string
          phone?: string | null
          referral_code?: string | null
          referral_discounts_available?: number | null
          state?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          converted_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referred_reward: number | null
          referrer_id: string
          rewarded_at: string | null
          status: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referred_reward?: number | null
          referrer_id: string
          rewarded_at?: string | null
          status?: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referred_reward?: number | null
          referrer_id?: string
          rewarded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_payment_methods: {
        Row: {
          card_brand: string | null
          card_expiry: string | null
          card_last_four: string | null
          company_id: string | null
          created_at: string
          display_name: string
          id: string
          is_default: boolean
          method_type: string
          upi_id: string | null
          user_id: string | null
        }
        Insert: {
          card_brand?: string | null
          card_expiry?: string | null
          card_last_four?: string | null
          company_id?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_default?: boolean
          method_type: string
          upi_id?: string | null
          user_id?: string | null
        }
        Update: {
          card_brand?: string | null
          card_expiry?: string | null
          card_last_four?: string | null
          company_id?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_default?: boolean
          method_type?: string
          upi_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_payment_methods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end: string
          current_period_start?: string
          id?: string
          plan_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          id: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tracking_clicks: {
        Row: {
          campaign_id: string
          click_url: string | null
          company_id: string
          conversion_data: Json | null
          conversion_type: string | null
          converted_at: string | null
          created_at: string
          expires_at: string
          id: string
          status: string
          tracking_id: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          click_url?: string | null
          company_id: string
          conversion_data?: Json | null
          conversion_type?: string | null
          converted_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          status?: string
          tracking_id: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          click_url?: string | null
          company_id?: string
          conversion_data?: Json | null
          conversion_type?: string | null
          converted_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          status?: string
          tracking_id?: string
          user_id?: string
        }
        Relationships: []
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
      user_wallets: {
        Row: {
          balance: number | null
          id: string
          pending: number | null
          total_withdrawn: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          id?: string
          pending?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          id?: string
          pending?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          type: string | null
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          type?: string | null
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string
          endpoint: string
          error_message: string | null
          headers: Json | null
          id: string
          payload: Json | null
          processed: boolean | null
          signature_valid: boolean | null
          source: string
          tracking_id: string | null
        }
        Insert: {
          created_at?: string
          endpoint: string
          error_message?: string | null
          headers?: Json | null
          id?: string
          payload?: Json | null
          processed?: boolean | null
          signature_valid?: boolean | null
          source: string
          tracking_id?: string | null
        }
        Update: {
          created_at?: string
          endpoint?: string
          error_message?: string | null
          headers?: Json | null
          id?: string
          payload?: Json | null
          processed?: boolean | null
          signature_valid?: boolean | null
          source?: string
          tracking_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_funds_to_wallet: {
        Args: { p_amount: number; p_company_id: string }
        Returns: {
          balance: number | null
          company_id: string
          id: string
          total_deposited: number | null
          total_spent: number | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "company_wallets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      apply_fraud_actions: {
        Args: { p_risk_score: number; p_transaction_id: string }
        Returns: Json
      }
      apply_referral_discount: { Args: { p_user_id: string }; Returns: number }
      calculate_fraud_risk: {
        Args: { p_transaction_id: string }
        Returns: number
      }
      check_subscription_status: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      create_cashback_transaction: {
        Args: { p_campaign_id: string }
        Returns: {
          amount: number
          auto_verified: boolean | null
          campaign_id: string | null
          company_id: string | null
          created_at: string | null
          extended_hold_until: string | null
          fraud_flags_count: number | null
          hold_until: string | null
          id: string
          rejection_reason: string | null
          risk_score: number | null
          status: string | null
          tracking_click_id: string | null
          user_id: string
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "cashback_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      generate_tracking_id: { Args: never; Returns: string }
      generate_user_referral_code: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_public_profile_fields: {
        Args: { profile_row: Database["public"]["Tables"]["profiles"]["Row"] }
        Returns: Json
      }
      has_company_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      process_cashback: {
        Args: {
          p_amount: number
          p_campaign_id: string
          p_company_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      process_conversion: {
        Args: {
          p_conversion_data?: Json
          p_conversion_type: string
          p_tracking_id: string
        }
        Returns: Json
      }
      process_referral_reward: {
        Args: { p_referred_user_id: string }
        Returns: Json
      }
      process_subscription_payment: {
        Args: {
          p_amount: number
          p_card_last_four: string
          p_error_message?: string
          p_plan_id: string
          p_success: boolean
        }
        Returns: Json
      }
      record_referral: {
        Args: { p_referral_code: string; p_referred_id: string }
        Returns: boolean
      }
      verify_conversion:
        | {
            Args: {
              p_action: string
              p_reason?: string
              p_transaction_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_action: string
              p_auto_verified?: boolean
              p_reason?: string
              p_transaction_id: string
            }
            Returns: Json
          }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "company"
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
      app_role: ["admin", "moderator", "user", "company"],
    },
  },
} as const
