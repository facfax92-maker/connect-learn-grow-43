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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          created_at: string
          date: string
          duration: number
          id: string
          note: string | null
          price: number
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          stripe_payment_id: string | null
          student_id: string
          subject: string
          tutor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          duration: number
          id?: string
          note?: string | null
          price: number
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_payment_id?: string | null
          student_id: string
          subject: string
          tutor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          duration?: number
          id?: string
          note?: string | null
          price?: number
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_payment_id?: string | null
          student_id?: string
          subject?: string
          tutor_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          student_id: string
          tutor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          student_id: string
          tutor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          student_id?: string
          tutor_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean
          sender_id?: string
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
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      review_flags: {
        Row: {
          created_at: string
          flagged_by: string
          id: string
          reason: string
          review_id: string
        }
        Insert: {
          created_at?: string
          flagged_by: string
          id?: string
          reason: string
          review_id: string
        }
        Update: {
          created_at?: string
          flagged_by?: string
          id?: string
          reason?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_flags_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string
          flagged: boolean | null
          id: string
          rating: number
          reply_at: string | null
          student_id: string
          tags: string[] | null
          tutor_id: string
          tutor_reply: string | null
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          flagged?: boolean | null
          id?: string
          rating: number
          reply_at?: string | null
          student_id: string
          tags?: string[] | null
          tutor_id: string
          tutor_reply?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          flagged?: boolean | null
          id?: string
          rating?: number
          reply_at?: string | null
          student_id?: string
          tags?: string[] | null
          tutor_id?: string
          tutor_reply?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          created_at: string
          district: string | null
          entrance_exam_target: string | null
          grade_level: Database["public"]["Enums"]["grade_level"] | null
          id: string
          learning_goals: string | null
          parent_contact: string | null
          school_name: string | null
          subjects: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          district?: string | null
          entrance_exam_target?: string | null
          grade_level?: Database["public"]["Enums"]["grade_level"] | null
          id?: string
          learning_goals?: string | null
          parent_contact?: string | null
          school_name?: string | null
          subjects?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          district?: string | null
          entrance_exam_target?: string | null
          grade_level?: Database["public"]["Enums"]["grade_level"] | null
          id?: string
          learning_goals?: string | null
          parent_contact?: string | null
          school_name?: string | null
          subjects?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tutor_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          start_time: string
          tutor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          start_time: string
          tutor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
          tutor_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tutor_profiles: {
        Row: {
          availability: string[] | null
          bio: string | null
          certification_urls: string[] | null
          created_at: string
          education_degree: string | null
          education_university: string | null
          entrance_specializations: string[] | null
          graduation_year: number | null
          hourly_rate: number | null
          id: string
          languages: string[] | null
          rating: number | null
          review_count: number | null
          session_type: Database["public"]["Enums"]["session_type"] | null
          status: Database["public"]["Enums"]["tutor_status"]
          subjects: string[] | null
          teaching_city: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string[] | null
          bio?: string | null
          certification_urls?: string[] | null
          created_at?: string
          education_degree?: string | null
          education_university?: string | null
          entrance_specializations?: string[] | null
          graduation_year?: number | null
          hourly_rate?: number | null
          id?: string
          languages?: string[] | null
          rating?: number | null
          review_count?: number | null
          session_type?: Database["public"]["Enums"]["session_type"] | null
          status?: Database["public"]["Enums"]["tutor_status"]
          subjects?: string[] | null
          teaching_city?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string[] | null
          bio?: string | null
          certification_urls?: string[] | null
          created_at?: string
          education_degree?: string | null
          education_university?: string | null
          entrance_specializations?: string[] | null
          graduation_year?: number | null
          hourly_rate?: number | null
          id?: string
          languages?: string[] | null
          rating?: number | null
          review_count?: number | null
          session_type?: Database["public"]["Enums"]["session_type"] | null
          status?: Database["public"]["Enums"]["tutor_status"]
          subjects?: string[] | null
          teaching_city?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tutor_student_connections: {
        Row: {
          admin_note: string | null
          confirmed_at: string | null
          created_at: string
          expires_at: string
          id: string
          monthly_rate: number
          payment_screenshot_url: string | null
          platform_fee: number
          status: string
          student_id: string
          subject: string
          tutor_profile_id: string
          tutor_user_id: string
        }
        Insert: {
          admin_note?: string | null
          confirmed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          monthly_rate: number
          payment_screenshot_url?: string | null
          platform_fee: number
          status?: string
          student_id: string
          subject?: string
          tutor_profile_id: string
          tutor_user_id: string
        }
        Update: {
          admin_note?: string | null
          confirmed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          monthly_rate?: number
          payment_screenshot_url?: string | null
          platform_fee?: number
          status?: string
          student_id?: string
          subject?: string
          tutor_profile_id?: string
          tutor_user_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_or_create_conversation: {
        Args: { p_student_id: string; p_tutor_id: string }
        Returns: string
      }
      get_tutor_booked_slots: {
        Args: { p_date_end: string; p_date_start: string; p_tutor_id: string }
        Returns: {
          slot_date: string
          slot_time: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "tutor" | "admin"
      booking_status:
        | "pending_payment"
        | "confirmed"
        | "completed"
        | "cancelled"
      grade_level:
        | "middle_school"
        | "high_school"
        | "university"
        | "adult_learner"
        | "grade_1_8"
        | "grade_9_10_see"
        | "grade_11_12_science"
        | "grade_11_12_management"
        | "grade_11_12_humanities"
        | "bachelors"
        | "masters"
        | "entrance_exam_prep"
      session_type: "online" | "in_person" | "both"
      tutor_status: "pending_approval" | "approved" | "rejected"
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
      app_role: ["student", "tutor", "admin"],
      booking_status: [
        "pending_payment",
        "confirmed",
        "completed",
        "cancelled",
      ],
      grade_level: [
        "middle_school",
        "high_school",
        "university",
        "adult_learner",
        "grade_1_8",
        "grade_9_10_see",
        "grade_11_12_science",
        "grade_11_12_management",
        "grade_11_12_humanities",
        "bachelors",
        "masters",
        "entrance_exam_prep",
      ],
      session_type: ["online", "in_person", "both"],
      tutor_status: ["pending_approval", "approved", "rejected"],
    },
  },
} as const
