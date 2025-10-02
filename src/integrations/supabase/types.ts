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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_calls: {
        Row: {
          agent_id: string
          conversation_id: string | null
          created_at: string
          error_code: string | null
          error_message: string | null
          id: string
          message_length: number
          metadata: Json | null
          platform: string
          response_time_ms: number | null
          status: string
          tenant_id: string
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          agent_id: string
          conversation_id?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          message_length: number
          metadata?: Json | null
          platform: string
          response_time_ms?: number | null
          status: string
          tenant_id: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          agent_id?: string
          conversation_id?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          message_length?: number
          metadata?: Json | null
          platform?: string
          response_time_ms?: number | null
          status?: string
          tenant_id?: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_calls_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_calls_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_calls_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_improvements: {
        Row: {
          after_value: string | null
          agent_id: string
          applied_at: string | null
          applied_by: string | null
          before_value: string | null
          evidence: Json | null
          id: string
          impact_metrics: Json | null
          improvement_type: string
          reason: string | null
          workspace_id: string
        }
        Insert: {
          after_value?: string | null
          agent_id: string
          applied_at?: string | null
          applied_by?: string | null
          before_value?: string | null
          evidence?: Json | null
          id?: string
          impact_metrics?: Json | null
          improvement_type: string
          reason?: string | null
          workspace_id: string
        }
        Update: {
          after_value?: string | null
          agent_id?: string
          applied_at?: string | null
          applied_by?: string | null
          before_value?: string | null
          evidence?: Json | null
          id?: string
          impact_metrics?: Json | null
          improvement_type?: string
          reason?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_improvements_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_improvements_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          api_endpoint: string | null
          api_key_reference: string | null
          avatar_url: string | null
          config: Json | null
          connection_config: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          knowledge_base: string | null
          max_tokens: number | null
          model_name: string | null
          name: string
          parent_version_id: string | null
          platform: Database["public"]["Enums"]["agent_platform"]
          platform_agent_id: string
          status: Database["public"]["Enums"]["agent_status"] | null
          system_prompt: string | null
          temperature: number | null
          tenant_id: string
          training_examples: Json | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          api_endpoint?: string | null
          api_key_reference?: string | null
          avatar_url?: string | null
          config?: Json | null
          connection_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          knowledge_base?: string | null
          max_tokens?: number | null
          model_name?: string | null
          name: string
          parent_version_id?: string | null
          platform: Database["public"]["Enums"]["agent_platform"]
          platform_agent_id: string
          status?: Database["public"]["Enums"]["agent_status"] | null
          system_prompt?: string | null
          temperature?: number | null
          tenant_id: string
          training_examples?: Json | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          api_endpoint?: string | null
          api_key_reference?: string | null
          avatar_url?: string | null
          config?: Json | null
          connection_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          knowledge_base?: string | null
          max_tokens?: number | null
          model_name?: string | null
          name?: string
          parent_version_id?: string | null
          platform?: Database["public"]["Enums"]["agent_platform"]
          platform_agent_id?: string
          status?: Database["public"]["Enums"]["agent_status"] | null
          system_prompt?: string | null
          temperature?: number | null
          tenant_id?: string
          training_examples?: Json | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_parent_version_id_fkey"
            columns: ["parent_version_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      agreement_analysis: {
        Row: {
          agent_ids: string[]
          benchmark_id: string | null
          consensus_category: string | null
          created_at: string | null
          disagreement_level: string | null
          evidence: Json | null
          human_review_completed: boolean | null
          human_review_notes: string | null
          id: string
          interpretation: string | null
          kappa_score: number | null
          requires_human_review: boolean | null
          test_case_id: string
          workspace_id: string
        }
        Insert: {
          agent_ids: string[]
          benchmark_id?: string | null
          consensus_category?: string | null
          created_at?: string | null
          disagreement_level?: string | null
          evidence?: Json | null
          human_review_completed?: boolean | null
          human_review_notes?: string | null
          id?: string
          interpretation?: string | null
          kappa_score?: number | null
          requires_human_review?: boolean | null
          test_case_id: string
          workspace_id: string
        }
        Update: {
          agent_ids?: string[]
          benchmark_id?: string | null
          consensus_category?: string | null
          created_at?: string | null
          disagreement_level?: string | null
          evidence?: Json | null
          human_review_completed?: boolean | null
          human_review_notes?: string | null
          id?: string
          interpretation?: string | null
          kappa_score?: number | null
          requires_human_review?: boolean | null
          test_case_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agreement_analysis_benchmark_id_fkey"
            columns: ["benchmark_id"]
            isOneToOne: false
            referencedRelation: "benchmarks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreement_analysis_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreement_analysis_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      benchmarks: {
        Row: {
          agent_ids: string[]
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          results: Json | null
          test_case_ids: string[]
          workspace_id: string
        }
        Insert: {
          agent_ids?: string[]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          results?: Json | null
          test_case_ids?: string[]
          workspace_id: string
        }
        Update: {
          agent_ids?: string[]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          results?: Json | null
          test_case_ids?: string[]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "benchmarks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cognitive_insights: {
        Row: {
          agent_id: string | null
          description: string
          evidence: Json | null
          generated_at: string | null
          id: string
          insight_type: string
          recommendations: string[] | null
          severity: string
          title: string
          workspace_id: string
        }
        Insert: {
          agent_id?: string | null
          description: string
          evidence?: Json | null
          generated_at?: string | null
          id?: string
          insight_type: string
          recommendations?: string[] | null
          severity: string
          title: string
          workspace_id: string
        }
        Update: {
          agent_id?: string | null
          description?: string
          evidence?: Json | null
          generated_at?: string | null
          id?: string
          insight_type?: string
          recommendations?: string[] | null
          severity?: string
          title?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cognitive_insights_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cognitive_insights_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          agent_id: string
          created_at: string | null
          external_session_id: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          tenant_id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          external_session_id?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          tenant_id: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          external_session_id?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          tenant_id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      logs: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          level: string
          message: string
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          level: string
          message: string
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          level?: string
          message?: string
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          latency_ms: number | null
          metadata: Json | null
          role: string
          tokens_used: number | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          role: string
          tokens_used?: number | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          latency_ms?: number | null
          metadata?: Json | null
          role?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          agent_id: string | null
          conversation_id: string | null
          created_at: string | null
          id: string
          metric_type: string
          metric_value: Json
          tenant_id: string
        }
        Insert: {
          agent_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metric_type: string
          metric_value: Json
          tenant_id: string
        }
        Update: {
          agent_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metric_type?: string
          metric_value?: Json
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "metrics_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          current_tenant_id: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          current_tenant_id?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          current_tenant_id?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_tenant_id_fkey"
            columns: ["current_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_config: {
        Row: {
          accent_color: string | null
          background_image_url: string | null
          chat_placeholder: string | null
          created_at: string | null
          enable_conversation_export: boolean | null
          enable_file_upload: boolean | null
          enable_google_auth: boolean | null
          enable_guest_access: boolean | null
          font_family: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          tenant_id: string
          updated_at: string | null
          welcome_message: Json | null
        }
        Insert: {
          accent_color?: string | null
          background_image_url?: string | null
          chat_placeholder?: string | null
          created_at?: string | null
          enable_conversation_export?: boolean | null
          enable_file_upload?: boolean | null
          enable_google_auth?: boolean | null
          enable_guest_access?: boolean | null
          font_family?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tenant_id: string
          updated_at?: string | null
          welcome_message?: Json | null
        }
        Update: {
          accent_color?: string | null
          background_image_url?: string | null
          chat_placeholder?: string | null
          created_at?: string | null
          enable_conversation_export?: boolean | null
          enable_file_upload?: boolean | null
          enable_google_auth?: boolean | null
          enable_guest_access?: boolean | null
          font_family?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tenant_id?: string
          updated_at?: string | null
          welcome_message?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_domains: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          is_primary: boolean | null
          ssl_enabled: boolean | null
          tenant_id: string
          updated_at: string | null
          verification_token: string | null
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          id?: string
          is_primary?: boolean | null
          ssl_enabled?: boolean | null
          tenant_id: string
          updated_at?: string | null
          verification_token?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          is_primary?: boolean | null
          ssl_enabled?: boolean | null
          tenant_id?: string
          updated_at?: string | null
          verification_token?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_domains_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          config: Json | null
          created_at: string | null
          domain: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          primary_color: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      test_cases: {
        Row: {
          agent_id: string | null
          category: string
          context: string | null
          created_at: string | null
          created_by: string | null
          difficulty: string | null
          expected_answer: string
          expected_score_min: number | null
          id: string
          is_active: boolean | null
          question: string
          tags: string[] | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          agent_id?: string | null
          category: string
          context?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty?: string | null
          expected_answer: string
          expected_score_min?: number | null
          id?: string
          is_active?: boolean | null
          question: string
          tags?: string[] | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          agent_id?: string | null
          category?: string
          context?: string | null
          created_at?: string | null
          created_by?: string | null
          difficulty?: string | null
          expected_answer?: string
          expected_score_min?: number | null
          id?: string
          is_active?: boolean | null
          question?: string
          tags?: string[] | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_cases_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_cases_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      test_executions: {
        Row: {
          actual_answer: string | null
          agent_id: string
          cognitive_analysis: Json | null
          cognitive_gaps: Json | null
          cost_usd: number | null
          executed_at: string | null
          executed_by: string | null
          expected_answer: string
          factual_accuracy: number | null
          guardrail_results: Json | null
          id: string
          improvement_suggestions: Json | null
          latency_ms: number | null
          question_asked: string
          relevance_score: number | null
          similarity_score: number | null
          status: string | null
          test_case_id: string
          tokens_used: number | null
          validation_justification: string | null
          workspace_id: string
        }
        Insert: {
          actual_answer?: string | null
          agent_id: string
          cognitive_analysis?: Json | null
          cognitive_gaps?: Json | null
          cost_usd?: number | null
          executed_at?: string | null
          executed_by?: string | null
          expected_answer: string
          factual_accuracy?: number | null
          guardrail_results?: Json | null
          id?: string
          improvement_suggestions?: Json | null
          latency_ms?: number | null
          question_asked: string
          relevance_score?: number | null
          similarity_score?: number | null
          status?: string | null
          test_case_id: string
          tokens_used?: number | null
          validation_justification?: string | null
          workspace_id: string
        }
        Update: {
          actual_answer?: string | null
          agent_id?: string
          cognitive_analysis?: Json | null
          cognitive_gaps?: Json | null
          cost_usd?: number | null
          executed_at?: string | null
          executed_by?: string | null
          expected_answer?: string
          factual_accuracy?: number | null
          guardrail_results?: Json | null
          id?: string
          improvement_suggestions?: Json | null
          latency_ms?: number | null
          question_asked?: string
          relevance_score?: number | null
          similarity_score?: number | null
          status?: string | null
          test_case_id?: string
          tokens_used?: number | null
          validation_justification?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_executions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_executions_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_executions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_tenant: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _tenant_id: string
          _user_id: string
        }
        Returns: boolean
      }
      has_tenant_access: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      agent_platform: "dify" | "langflow" | "crewai" | "native"
      agent_status: "active" | "inactive" | "maintenance"
      app_role: "super_admin" | "tenant_admin" | "agent_manager" | "user"
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
      agent_platform: ["dify", "langflow", "crewai", "native"],
      agent_status: ["active", "inactive", "maintenance"],
      app_role: ["super_admin", "tenant_admin", "agent_manager", "user"],
    },
  },
} as const
