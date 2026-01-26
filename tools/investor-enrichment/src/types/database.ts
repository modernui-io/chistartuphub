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
      accelerators: {
        Row: {
          application_deadline: string | null
          created_date: string | null
          description: string | null
          duration: string | null
          featured: boolean | null
          focus_areas: string[] | null
          id: string
          investment_range: string | null
          is_active: boolean | null
          location: string | null
          logo_url: string | null
          name: string
          program_type: string | null
          stage: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          application_deadline?: string | null
          created_date?: string | null
          description?: string | null
          duration?: string | null
          featured?: boolean | null
          focus_areas?: string[] | null
          id?: string
          investment_range?: string | null
          is_active?: boolean | null
          location?: string | null
          logo_url?: string | null
          name: string
          program_type?: string | null
          stage?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          application_deadline?: string | null
          created_date?: string | null
          description?: string | null
          duration?: string | null
          featured?: boolean | null
          focus_areas?: string[] | null
          id?: string
          investment_range?: string | null
          is_active?: boolean | null
          location?: string | null
          logo_url?: string | null
          name?: string
          program_type?: string | null
          stage?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      funding_opportunities: {
        Row: {
          application_link: string | null
          check_size_max: number | null
          check_size_min: number | null
          chicago_focused: boolean | null
          contact_email: string | null
          created_date: string | null
          deadline: string | null
          deadline_type: string | null
          description: string | null
          featured: boolean | null
          id: string
          is_active: boolean | null
          name: string
          opportunity_type: string | null
          organization: string | null
          sectors: string[] | null
          stage: string[] | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          application_link?: string | null
          check_size_max?: number | null
          check_size_min?: number | null
          chicago_focused?: boolean | null
          contact_email?: string | null
          created_date?: string | null
          deadline?: string | null
          deadline_type?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          is_active?: boolean | null
          name: string
          opportunity_type?: string | null
          organization?: string | null
          sectors?: string[] | null
          stage?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          application_link?: string | null
          check_size_max?: number | null
          check_size_min?: number | null
          chicago_focused?: boolean | null
          contact_email?: string | null
          created_date?: string | null
          deadline?: string | null
          deadline_type?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          is_active?: boolean | null
          name?: string
          opportunity_type?: string | null
          organization?: string | null
          sectors?: string[] | null
          stage?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      investors: {
        Row: {
          canonical_name: string
          check_size_max: number | null
          check_size_min: number | null
          completeness_score: number | null
          confidence_score: number | null
          contact_email: string | null
          created_at: string | null
          description: string | null
          domain: string | null
          hq_city: string | null
          hq_country: string | null
          hq_location: string | null
          hq_state: string | null
          id: string
          investor_type: string | null
          is_midwest: boolean | null
          linkedin_url: string | null
          mvip_score: number | null
          sectors: string[] | null
          source: string | null
          source_url: string | null
          stage_focus: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          canonical_name: string
          check_size_max?: number | null
          check_size_min?: number | null
          completeness_score?: number | null
          confidence_score?: number | null
          contact_email?: string | null
          created_at?: string | null
          description?: string | null
          domain?: string | null
          hq_city?: string | null
          hq_country?: string | null
          hq_location?: string | null
          hq_state?: string | null
          id?: string
          investor_type?: string | null
          is_midwest?: boolean | null
          linkedin_url?: string | null
          mvip_score?: number | null
          sectors?: string[] | null
          source?: string | null
          source_url?: string | null
          stage_focus?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          canonical_name?: string
          check_size_max?: number | null
          check_size_min?: number | null
          completeness_score?: number | null
          confidence_score?: number | null
          contact_email?: string | null
          created_at?: string | null
          description?: string | null
          domain?: string | null
          hq_city?: string | null
          hq_country?: string | null
          hq_location?: string | null
          hq_state?: string | null
          id?: string
          investor_type?: string | null
          is_midwest?: boolean | null
          linkedin_url?: string | null
          mvip_score?: number | null
          sectors?: string[] | null
          source?: string | null
          source_url?: string | null
          stage_focus?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          achievements: string[] | null
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          created_at: string | null
          current_focus: string | null
          email: string
          first_name: string | null
          focus_description: string | null
          full_name: string | null
          help_offer_email: boolean | null
          help_offer_inapp: boolean | null
          help_response_email: boolean | null
          help_response_inapp: boolean | null
          id: string
          industry_focus: string[] | null
          interests: string[] | null
          last_name: string | null
          linkedin_url: string | null
          location: string | null
          opportunity_category: string | null
          role: string | null
          stage: string | null
          startup_name: string | null
          tech_stack: string[] | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          achievements?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string | null
          current_focus?: string | null
          email: string
          first_name?: string | null
          focus_description?: string | null
          full_name?: string | null
          help_offer_email?: boolean | null
          help_offer_inapp?: boolean | null
          help_response_email?: boolean | null
          help_response_inapp?: boolean | null
          id: string
          industry_focus?: string[] | null
          interests?: string[] | null
          last_name?: string | null
          linkedin_url?: string | null
          location?: string | null
          opportunity_category?: string | null
          role?: string | null
          stage?: string | null
          startup_name?: string | null
          tech_stack?: string[] | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          achievements?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string | null
          current_focus?: string | null
          email?: string
          first_name?: string | null
          focus_description?: string | null
          full_name?: string | null
          help_offer_email?: boolean | null
          help_offer_inapp?: boolean | null
          help_response_email?: boolean | null
          help_response_inapp?: boolean | null
          id?: string
          industry_focus?: string[] | null
          interests?: string[] | null
          last_name?: string | null
          linkedin_url?: string | null
          location?: string | null
          opportunity_category?: string | null
          role?: string | null
          stage?: string | null
          startup_name?: string | null
          tech_stack?: string[] | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_investors: {
        Row: {
          canonical_name: string | null
          check_size_max: number | null
          check_size_min: number | null
          completeness_score: number | null
          confidence_score: number | null
          created_at: string | null
          description: string | null
          domain: string | null
          hq_city: string | null
          hq_country: string | null
          hq_location: string | null
          hq_state: string | null
          id: string | null
          investor_type: string | null
          is_midwest: boolean | null
          mvip_score: number | null
          sectors: string[] | null
          source: string | null
          stage_focus: string | null
          updated_at: string | null
          website: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ============================================================
// HELPER TYPES - Makes using these types much easier
// ============================================================

// Get the Row type for any table (what you get back from queries)
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

// Get the Insert type for any table (what you send when creating)
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

// Get the Update type for any table (what you send when updating)
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// ============================================================
// CONVENIENT ALIASES - Use these in your code
// ============================================================

// Investor types
export type Investor = Tables<'investors'>
export type InvestorInsert = TablesInsert<'investors'>
export type InvestorUpdate = TablesUpdate<'investors'>

// Funding opportunity types
export type FundingOpportunity = Tables<'funding_opportunities'>
export type FundingOpportunityInsert = TablesInsert<'funding_opportunities'>
export type FundingOpportunityUpdate = TablesUpdate<'funding_opportunities'>

// Accelerator types
export type Accelerator = Tables<'accelerators'>
export type AcceleratorInsert = TablesInsert<'accelerators'>
export type AcceleratorUpdate = TablesUpdate<'accelerators'>

// User profile types
export type UserProfile = Tables<'user_profiles'>
export type UserProfileInsert = TablesInsert<'user_profiles'>
export type UserProfileUpdate = TablesUpdate<'user_profiles'>

// Deadline type for funding opportunities
export type DeadlineType = 'fixed' | 'rolling' | 'annual' | 'quarterly' | 'monthly' | 'ongoing' | 'unknown'
