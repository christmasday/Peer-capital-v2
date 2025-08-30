export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email?: string | null
          first_name: string | null
          middle_name: string | null
          last_name: string | null
          phone_number: string | null
          bvn: string | null
          date_of_birth: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          country: string | null
          profile_picture_url: string | null
          created_at: string
          updated_at: string
          // ID verification fields
          id_type?: string | null
          id_number?: string | null
          id_document_url?: string | null
          id_verified?: boolean | null
          id_verification_date?: string | null
          // Employment information fields
          employment_status?: string | null
          employer_name?: string | null
          employer_address?: string | null
          work_phone?: string | null
          job_title?: string | null
          monthly_income?: number | null
          employment_start_date?: string | null
          employment_end_date?: string | null
          employment_verified?: boolean | null
          // Withdrawal account fields
          bank_name?: string | null
          account_number?: string | null
          account_name?: string | null
          // Bio field
          bio?: string | null
          // Referral fields
          referral_code?: string | null
          referred_by?: string | null
          // Social Media fields
          facebook_url?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          website?: string | null
        }
        Insert: {
          id: string
          email?: string | null
          first_name?: string | null
          middle_name?: string | null
          last_name?: string | null
          phone_number?: string | null
          bvn?: string | null
          date_of_birth?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string | null
          profile_picture_url?: string | null
          created_at?: string
          updated_at?: string
          // ID verification fields
          id_type?: string | null
          id_number?: string | null
          id_document_url?: string | null
          id_verified?: boolean | null
          id_verification_date?: string | null
          // Employment information fields
          employment_status?: string | null
          employer_name?: string | null
          employer_address?: string | null
          work_phone?: string | null
          job_title?: string | null
          monthly_income?: number | null
          employment_start_date?: string | null
          employment_end_date?: string | null
          employment_verified?: boolean | null
          // Withdrawal account fields
          bank_name?: string | null
          account_number?: string | null
          account_name?: string | null
          // Bio field
          bio?: string | null
          // Referral fields
          referral_code?: string | null
          referred_by?: string | null
          // Social Media fields
          facebook_url?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          website?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          first_name?: string | null
          middle_name?: string | null
          last_name?: string | null
          phone_number?: string | null
          bvn?: string | null
          date_of_birth?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string | null
          profile_picture_url?: string | null
          created_at?: string
          updated_at?: string
          id_type?: string | null
          id_number?: string | null
          id_document_url?: string | null
          id_verified?: boolean | null
          id_verification_date?: string | null
          employment_status?: string | null
          employer_name?: string | null
          employer_address?: string | null
          work_phone?: string | null
          job_title?: string | null
          monthly_income?: number | null
          employment_start_date?: string | null
          employment_end_date?: string | null
          employment_verified?: boolean | null
          // Withdrawal account fields
          bank_name?: string | null
          account_number?: string | null
          account_name?: string | null
          // Bio field
          bio?: string | null
          // Referral fields
          referral_code?: string | null
          referred_by?: string | null
          // Social Media fields
          facebook_url?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          website?: string | null
        }
      }
      user_connections: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
          updated_at: string
          status: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
          updated_at?: string
          status?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
          updated_at?: string
          status?: string
        }
      }
      account_balances: {
        Row: {
          id: string
          user_id: string
          balance: number
          loan_balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          loan_balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          loan_balance?: number
          created_at?: string
          updated_at?: string
        }
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          email_notifications: boolean
          sms_notifications: boolean
          push_notifications: boolean
          marketing_emails: boolean
          transaction_alerts: boolean
          security_alerts: boolean
          // Activity-specific notification settings
          transaction_activity: boolean
          loan_activity: boolean
          connection_activity: boolean
          message_activity: boolean
          verification_activity: boolean
          account_activity: boolean
          system_activity: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_notifications?: boolean
          sms_notifications?: boolean
          push_notifications?: boolean
          marketing_emails?: boolean
          transaction_alerts?: boolean
          security_alerts?: boolean
          // Activity-specific notification settings
          transaction_activity?: boolean
          loan_activity?: boolean
          connection_activity?: boolean
          message_activity?: boolean
          verification_activity?: boolean
          account_activity?: boolean
          system_activity?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_notifications?: boolean
          sms_notifications?: boolean
          push_notifications?: boolean
          marketing_emails?: boolean
          transaction_alerts?: boolean
          security_alerts?: boolean
          // Activity-specific notification settings
          transaction_activity?: boolean
          loan_activity?: boolean
          connection_activity?: boolean
          message_activity?: boolean
          verification_activity?: boolean
          account_activity?: boolean
          system_activity?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          is_active: boolean
          last_activity: string
          created_at: string
          expires_at: string
          user_agent: string | null
          ip_address: string | null
        }
        Insert: {
          id?: string
          user_id: string
          session_token: string
          is_active?: boolean
          last_activity?: string
          created_at?: string
          expires_at?: string
          user_agent?: string | null
          ip_address?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          session_token?: string
          is_active?: boolean
          last_activity?: string
          created_at?: string
          expires_at?: string
          user_agent?: string | null
          ip_address?: string | null
        }
      }
      loan_helpers: {
        Row: {
          id: string
          user_id: string | null
          name: string
          interest_rate: number
          max_loan_amount: number
          loans_issued: number
          amount_issued: number
          profile_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          interest_rate: number
          max_loan_amount: number
          loans_issued?: number
          amount_issued?: number
          profile_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          interest_rate?: number
          max_loan_amount?: number
          loans_issued?: number
          amount_issued?: number
          profile_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      loan_requests: {
        Row: {
          id: string
          user_id: string
          helper_id: string
          amount: number
          interest_rate: number
          duration_months: number
          status: string
          purpose: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          helper_id: string
          amount: number
          interest_rate: number
          duration_months: number
          status?: string
          purpose: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          helper_id?: string
          amount?: number
          interest_rate?: number
          duration_months?: number
          status?: string
          purpose?: string
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: string
          description: string
          reference: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: string
          description: string
          reference: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: string
          description?: string
          reference?: string
          status?: string
          created_at?: string
        }
      }
      auth_users: {
        Row: {
          id: string
          email: string | null
          phone: string | null
          encrypted_password: string | null
          email_confirmed_at: string | null
          phone_confirmed_at: string | null
          confirmation_sent_at: string | null
          recovery_sent_at: string | null
          email_change_sent_at: string | null
          email_change: string | null
          last_sign_in_at: string | null
          raw_app_meta_data: Json | null
          raw_user_meta_data: Json | null
          is_super_admin: boolean | null
          created_at: string
          updated_at: string
          is_sso_user: boolean | null
          banned_until: string | null
          reauthentication_sent_at: string | null
          is_anonymous: boolean | null
        }
        Insert: {
          id: string
          email: string | null
          phone: string | null
          encrypted_password: string | null
          email_confirmed_at: string | null
          phone_confirmed_at: string | null
          confirmation_sent_at: string | null
          recovery_sent_at: string | null
          email_change_sent_at: string | null
          email_change: string | null
          last_sign_in_at: string | null
          raw_app_meta_data: Json | null
          raw_user_meta_data: Json | null
          is_super_admin: boolean | null
          created_at: string
          updated_at: string
          is_sso_user: boolean | null
          banned_until: string | null
          reauthentication_sent_at: string | null
          is_anonymous: boolean | null
        }
        Update: {
          id?: string
          email?: string | null
          phone?: string | null
          encrypted_password?: string | null
          email_confirmed_at?: string | null
          phone_confirmed_at?: string | null
          confirmation_sent_at?: string | null
          recovery_sent_at?: string | null
          email_change_sent_at?: string | null
          email_change?: string | null
          last_sign_in_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          is_super_admin?: boolean | null
          created_at?: string
          updated_at?: string
          is_sso_user?: boolean | null
          banned_until?: string | null
          reauthentication_sent_at?: string | null
          is_anonymous?: boolean | null
        }
      }
      loan_helper_settings: {
        Row: {
          id: string
          user_id: string
          loan_amount: number
          interest_rate: number
          repayment_time: number
          terms_and_conditions: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          loan_amount: number
          interest_rate: number
          repayment_time: number
          terms_and_conditions?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          loan_amount?: number
          interest_rate?: number
          repayment_time?: number
          terms_and_conditions?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          actor_id: string | null // Updated to be nullable
          type: string
          data: Json | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          actor_id?: string | null // Updated to be nullable
          type: string
          data?: Json | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          actor_id?: string | null // Updated to be nullable
          type?: string
          data?: Json | null
          read?: boolean
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          content: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          content: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          content?: string
          read?: boolean
          created_at?: string
        }
      }
      transfer_beneficiaries: {
        Row: {
          id: string
          user_id: string
          account_name: string
          account_number: string
          bank_name: string
          bank_code: string
          recipient_code: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_name: string
          account_number: string
          bank_name: string
          bank_code: string
          recipient_code: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_name?: string
          account_number?: string
          bank_name?: string
          bank_code?: string
          recipient_code?: string
          created_at?: string
          updated_at?: string
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
