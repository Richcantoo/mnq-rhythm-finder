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
      analytics_summaries: {
        Row: {
          created_at: string
          id: string
          metric_data: Json
          metric_date: string
          metric_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metric_data: Json
          metric_date: string
          metric_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metric_data?: Json
          metric_date?: string
          metric_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      chart_analyses: {
        Row: {
          chart_date: string
          confidence_score: number
          created_at: string
          day_of_week: string
          filename: string
          id: string
          key_levels: Json | null
          pattern_features: Json | null
          pattern_type: string
          price_direction: string | null
          search_vector: unknown | null
          seasonal_context: Json | null
          session_details: Json | null
          temporal_patterns: Json | null
          updated_at: string
        }
        Insert: {
          chart_date: string
          confidence_score: number
          created_at?: string
          day_of_week: string
          filename: string
          id?: string
          key_levels?: Json | null
          pattern_features?: Json | null
          pattern_type: string
          price_direction?: string | null
          search_vector?: unknown | null
          seasonal_context?: Json | null
          session_details?: Json | null
          temporal_patterns?: Json | null
          updated_at?: string
        }
        Update: {
          chart_date?: string
          confidence_score?: number
          created_at?: string
          day_of_week?: string
          filename?: string
          id?: string
          key_levels?: Json | null
          pattern_features?: Json | null
          pattern_type?: string
          price_direction?: string | null
          search_vector?: unknown | null
          seasonal_context?: Json | null
          session_details?: Json | null
          temporal_patterns?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      chart_analysis_tags: {
        Row: {
          added_at: string
          chart_analysis_id: string | null
          id: string
          tag_id: string | null
        }
        Insert: {
          added_at?: string
          chart_analysis_id?: string | null
          id?: string
          tag_id?: string | null
        }
        Update: {
          added_at?: string
          chart_analysis_id?: string | null
          id?: string
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_analysis_tags_chart_analysis_id_fkey"
            columns: ["chart_analysis_id"]
            isOneToOne: false
            referencedRelation: "chart_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_analysis_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "pattern_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_images: {
        Row: {
          ai_analysis: Json | null
          confidence_score: number | null
          created_at: string
          file_path: string
          file_size: number | null
          filename: string
          id: string
          key_levels: Json | null
          pattern_features: Json | null
          pattern_type: string | null
          season: string | null
          session_time: string | null
          similar_images: string[] | null
          similarity_scores: number[] | null
          trade_date: string | null
          updated_at: string
          upload_date: string
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          confidence_score?: number | null
          created_at?: string
          file_path: string
          file_size?: number | null
          filename: string
          id?: string
          key_levels?: Json | null
          pattern_features?: Json | null
          pattern_type?: string | null
          season?: string | null
          session_time?: string | null
          similar_images?: string[] | null
          similarity_scores?: number[] | null
          trade_date?: string | null
          updated_at?: string
          upload_date?: string
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          confidence_score?: number | null
          created_at?: string
          file_path?: string
          file_size?: number | null
          filename?: string
          id?: string
          key_levels?: Json | null
          pattern_features?: Json | null
          pattern_type?: string | null
          season?: string | null
          session_time?: string | null
          similar_images?: string[] | null
          similarity_scores?: number[] | null
          trade_date?: string | null
          updated_at?: string
          upload_date?: string
          user_id?: string
        }
        Relationships: []
      }
      export_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          export_criteria: Json
          export_type: string
          file_path: string | null
          id: string
          record_count: number | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          export_criteria: Json
          export_type: string
          file_path?: string | null
          id?: string
          record_count?: number | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          export_criteria?: Json
          export_type?: string
          file_path?: string | null
          id?: string
          record_count?: number | null
          status?: string | null
        }
        Relationships: []
      }
      pattern_categories: {
        Row: {
          color_hex: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color_hex?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          color_hex?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      pattern_cluster_members: {
        Row: {
          added_at: string
          chart_analysis_id: string | null
          cluster_id: string | null
          id: string
          membership_confidence: number | null
        }
        Insert: {
          added_at?: string
          chart_analysis_id?: string | null
          cluster_id?: string | null
          id?: string
          membership_confidence?: number | null
        }
        Update: {
          added_at?: string
          chart_analysis_id?: string | null
          cluster_id?: string | null
          id?: string
          membership_confidence?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pattern_cluster_members_chart_analysis_id_fkey"
            columns: ["chart_analysis_id"]
            isOneToOne: true
            referencedRelation: "chart_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pattern_cluster_members_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "pattern_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      pattern_clusters: {
        Row: {
          cluster_description: string | null
          cluster_features: Json | null
          cluster_name: string
          confidence_threshold: number | null
          created_at: string
          id: string
          success_rate: number | null
          total_patterns: number | null
          updated_at: string
        }
        Insert: {
          cluster_description?: string | null
          cluster_features?: Json | null
          cluster_name: string
          confidence_threshold?: number | null
          created_at?: string
          id?: string
          success_rate?: number | null
          total_patterns?: number | null
          updated_at?: string
        }
        Update: {
          cluster_description?: string | null
          cluster_features?: Json | null
          cluster_name?: string
          confidence_threshold?: number | null
          created_at?: string
          id?: string
          success_rate?: number | null
          total_patterns?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      pattern_notes: {
        Row: {
          chart_analysis_id: string | null
          created_at: string
          id: string
          is_private: boolean | null
          note_content: string
          note_title: string | null
          note_type: string | null
          updated_at: string
        }
        Insert: {
          chart_analysis_id?: string | null
          created_at?: string
          id?: string
          is_private?: boolean | null
          note_content: string
          note_title?: string | null
          note_type?: string | null
          updated_at?: string
        }
        Update: {
          chart_analysis_id?: string | null
          created_at?: string
          id?: string
          is_private?: boolean | null
          note_content?: string
          note_title?: string | null
          note_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pattern_notes_chart_analysis_id_fkey"
            columns: ["chart_analysis_id"]
            isOneToOne: false
            referencedRelation: "chart_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      pattern_similarities: {
        Row: {
          algorithm_used: string
          computed_at: string
          id: string
          similarity_features: Json | null
          similarity_score: number
          source_chart_id: string | null
          target_chart_id: string | null
        }
        Insert: {
          algorithm_used?: string
          computed_at?: string
          id?: string
          similarity_features?: Json | null
          similarity_score?: number
          source_chart_id?: string | null
          target_chart_id?: string | null
        }
        Update: {
          algorithm_used?: string
          computed_at?: string
          id?: string
          similarity_features?: Json | null
          similarity_score?: number
          source_chart_id?: string | null
          target_chart_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pattern_similarities_source_chart_id_fkey"
            columns: ["source_chart_id"]
            isOneToOne: false
            referencedRelation: "chart_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pattern_similarities_target_chart_id_fkey"
            columns: ["target_chart_id"]
            isOneToOne: false
            referencedRelation: "chart_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      pattern_tags: {
        Row: {
          color_hex: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color_hex?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color_hex?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      prediction_outcomes: {
        Row: {
          actual_outcome: string | null
          actual_price: number | null
          chart_analysis_id: string | null
          confidence_score: number
          created_at: string
          id: string
          outcome_notes: string | null
          predicted_at: string
          predicted_direction: string
          price_target: number | null
          time_horizon_hours: number | null
          updated_at: string
          validated_at: string | null
        }
        Insert: {
          actual_outcome?: string | null
          actual_price?: number | null
          chart_analysis_id?: string | null
          confidence_score?: number
          created_at?: string
          id?: string
          outcome_notes?: string | null
          predicted_at?: string
          predicted_direction: string
          price_target?: number | null
          time_horizon_hours?: number | null
          updated_at?: string
          validated_at?: string | null
        }
        Update: {
          actual_outcome?: string | null
          actual_price?: number | null
          chart_analysis_id?: string | null
          confidence_score?: number
          created_at?: string
          id?: string
          outcome_notes?: string | null
          predicted_at?: string
          predicted_direction?: string
          price_target?: number | null
          time_horizon_hours?: number | null
          updated_at?: string
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prediction_outcomes_chart_analysis_id_fkey"
            columns: ["chart_analysis_id"]
            isOneToOne: false
            referencedRelation: "chart_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string
          id: string
          is_favorite: boolean | null
          search_criteria: Json
          search_description: string | null
          search_name: string
          updated_at: string
          use_count: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          search_criteria: Json
          search_description?: string | null
          search_name: string
          updated_at?: string
          use_count?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          search_criteria?: Json
          search_description?: string | null
          search_name?: string
          updated_at?: string
          use_count?: number | null
        }
        Relationships: []
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
    Enums: {},
  },
} as const
