// Generated types based on Open Syllabus optimized schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string
          name: string
          code: string
          admin_email: string | null
          country: string | null
          timezone: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          admin_email?: string | null
          country?: string | null
          timezone?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          admin_email?: string | null
          country?: string | null
          timezone?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      teachers: {
        Row: {
          id: string
          email: string
          name: string
          school_id: string
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          school_id: string
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          school_id?: string
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          school_id: string
          auth_id: string | null
          first_name: string
          surname: string
          username: string
          pin: string
          year_group: string
          form_group: string | null
          tags: string[]
          is_under_13: boolean
          school_managed_consent: boolean
          content_filter_enabled: boolean
          country_code: string | null
          date_of_birth: string | null
          avatar_url: string | null
          theme_color: string
          font_size: string
          high_contrast: boolean
          language: string
          last_pin_change: string
          pin_change_by: string | null
          is_active: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id: string
          auth_id?: string | null
          first_name: string
          surname: string
          username: string
          pin: string
          year_group: string
          form_group?: string | null
          tags?: string[]
          is_under_13?: boolean
          school_managed_consent?: boolean
          content_filter_enabled?: boolean
          country_code?: string | null
          date_of_birth?: string | null
          avatar_url?: string | null
          theme_color?: string
          font_size?: string
          high_contrast?: boolean
          language?: string
          last_pin_change?: string
          pin_change_by?: string | null
          is_active?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string
          auth_id?: string | null
          first_name?: string
          surname?: string
          username?: string
          pin?: string
          year_group?: string
          form_group?: string | null
          tags?: string[]
          is_under_13?: boolean
          school_managed_consent?: boolean
          content_filter_enabled?: boolean
          country_code?: string | null
          date_of_birth?: string | null
          avatar_url?: string | null
          theme_color?: string
          font_size?: string
          high_contrast?: boolean
          language?: string
          last_pin_change?: string
          pin_change_by?: string | null
          is_active?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          name: string
          code: string
          teacher_id: string
          school_id: string
          description: string | null
          is_active: boolean
          max_students: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          teacher_id: string
          school_id: string
          description?: string | null
          is_active?: boolean
          max_students?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          teacher_id?: string
          school_id?: string
          description?: string | null
          is_active?: boolean
          max_students?: number
          created_at?: string
          updated_at?: string
        }
      }
      room_members: {
        Row: {
          room_id: string
          student_id: string
          joined_at: string
        }
        Insert: {
          room_id: string
          student_id: string
          joined_at?: string
        }
        Update: {
          room_id?: string
          student_id?: string
          joined_at?: string
        }
      }
      bots: {
        Row: {
          id: string
          teacher_id: string
          name: string
          description: string | null
          system_prompt: string
          model: string
          type: 'learning' | 'assessment' | 'reading_room' | 'viewing_room' | 'knowledge_book'
          welcome_message: string | null
          has_documents: boolean
          temperature: number
          max_tokens: number
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          name: string
          description?: string | null
          system_prompt: string
          model?: string
          type?: 'learning' | 'assessment' | 'reading_room' | 'viewing_room' | 'knowledge_book'
          welcome_message?: string | null
          has_documents?: boolean
          temperature?: number
          max_tokens?: number
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          name?: string
          description?: string | null
          system_prompt?: string
          model?: string
          type?: 'learning' | 'assessment' | 'reading_room' | 'viewing_room' | 'knowledge_book'
          welcome_message?: string | null
          has_documents?: boolean
          temperature?: number
          max_tokens?: number
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      room_bots: {
        Row: {
          room_id: string
          bot_id: string
          assigned_at: string
          assigned_by: string
        }
        Insert: {
          room_id: string
          bot_id: string
          assigned_at?: string
          assigned_by: string
        }
        Update: {
          room_id?: string
          bot_id?: string
          assigned_at?: string
          assigned_by?: string
        }
      }
      student_bot_access: {
        Row: {
          id: string
          student_id: string
          bot_id: string
          room_id: string
          last_accessed: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          bot_id: string
          room_id: string
          last_accessed?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          bot_id?: string
          room_id?: string
          last_accessed?: string | null
          created_at?: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          student_bot_access_id: string
          student_id: string
          bot_id: string
          started_at: string
          ended_at: string | null
          message_count: number
          total_tokens: number
        }
        Insert: {
          id?: string
          student_bot_access_id: string
          student_id: string
          bot_id: string
          started_at?: string
          ended_at?: string | null
          message_count?: number
          total_tokens?: number
        }
        Update: {
          id?: string
          student_bot_access_id?: string
          student_id?: string
          bot_id?: string
          started_at?: string
          ended_at?: string | null
          message_count?: number
          total_tokens?: number
        }
      }
      messages: {
        Row: {
          id: string
          session_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          tokens: number | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          tokens?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          tokens?: number | null
          created_at?: string
        }
      }
      bot_documents: {
        Row: {
          id: string
          bot_id: string
          file_name: string
          file_path: string
          file_type: string | null
          file_size: number | null
          status: string
          chunk_count: number
          error_message: string | null
          metadata: Json
          uploaded_by: string
          uploaded_at: string
          processed_at: string | null
          processing_started_at: string | null
          retry_count: number
        }
        Insert: {
          id?: string
          bot_id: string
          file_name: string
          file_path: string
          file_type?: string | null
          file_size?: number | null
          status?: string
          chunk_count?: number
          error_message?: string | null
          metadata?: Json
          uploaded_by: string
          uploaded_at?: string
          processed_at?: string | null
          processing_started_at?: string | null
          retry_count?: number
        }
        Update: {
          id?: string
          bot_id?: string
          file_name?: string
          file_path?: string
          file_type?: string | null
          file_size?: number | null
          status?: string
          chunk_count?: number
          error_message?: string | null
          metadata?: Json
          uploaded_by?: string
          uploaded_at?: string
          processed_at?: string | null
          processing_started_at?: string | null
          retry_count?: number
        }
      }
      assessments: {
        Row: {
          id: string
          bot_id: string
          title: string
          instructions: string | null
          questions: Json
          type: 'multiple_choice' | 'open_ended'
          grading_rubric: string | null
          time_limit: number | null
          max_attempts: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bot_id: string
          title: string
          instructions?: string | null
          questions: Json
          type?: 'multiple_choice' | 'open_ended'
          grading_rubric?: string | null
          time_limit?: number | null
          max_attempts?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bot_id?: string
          title?: string
          instructions?: string | null
          questions?: Json
          type?: 'multiple_choice' | 'open_ended'
          grading_rubric?: string | null
          time_limit?: number | null
          max_attempts?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      assessment_submissions: {
        Row: {
          id: string
          assessment_id: string
          student_id: string
          attempt_number: number
          answers: Json
          ai_feedback: Json | null
          ai_score: number | null
          teacher_feedback: string | null
          teacher_score: number | null
          final_score: number | null
          status: 'pending' | 'ai_processing' | 'ai_completed' | 'teacher_reviewed'
          started_at: string
          submitted_at: string | null
          graded_at: string | null
        }
        Insert: {
          id?: string
          assessment_id: string
          student_id: string
          attempt_number?: number
          answers: Json
          ai_feedback?: Json | null
          ai_score?: number | null
          teacher_feedback?: string | null
          teacher_score?: number | null
          final_score?: number | null
          status?: 'pending' | 'ai_processing' | 'ai_completed' | 'teacher_reviewed'
          started_at?: string
          submitted_at?: string | null
          graded_at?: string | null
        }
        Update: {
          id?: string
          assessment_id?: string
          student_id?: string
          attempt_number?: number
          answers?: Json
          ai_feedback?: Json | null
          ai_score?: number | null
          teacher_feedback?: string | null
          teacher_score?: number | null
          final_score?: number | null
          status?: 'pending' | 'ai_processing' | 'ai_completed' | 'teacher_reviewed'
          started_at?: string
          submitted_at?: string | null
          graded_at?: string | null
        }
      }
      student_memories: {
        Row: {
          id: string
          student_id: string
          bot_id: string
          session_id: string | null
          memory_text: string
          memory_type: string | null
          topics: string[]
          importance_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          bot_id: string
          session_id?: string | null
          memory_text: string
          memory_type?: string | null
          topics?: string[]
          importance_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          bot_id?: string
          session_id?: string | null
          memory_text?: string
          memory_type?: string | null
          topics?: string[]
          importance_score?: number | null
          created_at?: string
        }
      }
      safety_analytics: {
        Row: {
          id: string
          message_id: string
          student_id: string
          room_id: string | null
          event_type: string
          concern_type: string | null
          country_code: string | null
          interaction_type: string | null
          helpline_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          student_id: string
          room_id?: string | null
          event_type: string
          concern_type?: string | null
          country_code?: string | null
          interaction_type?: string | null
          helpline_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          student_id?: string
          room_id?: string | null
          event_type?: string
          concern_type?: string | null
          country_code?: string | null
          interaction_type?: string | null
          helpline_name?: string | null
          created_at?: string
        }
      }
      safety_notifications: {
        Row: {
          notification_id: string
          user_id: string
          message_id: string
          room_id: string
          notification_type: string
          is_delivered: boolean
          created_at: string
          delivered_at: string | null
          metadata: Json | null
        }
        Insert: {
          notification_id?: string
          user_id: string
          message_id: string
          room_id: string
          notification_type: string
          is_delivered?: boolean
          created_at?: string
          delivered_at?: string | null
          metadata?: Json | null
        }
        Update: {
          notification_id?: string
          user_id?: string
          message_id?: string
          room_id?: string
          notification_type?: string
          is_delivered?: boolean
          created_at?: string
          delivered_at?: string | null
          metadata?: Json | null
        }
      }
      flagged_messages: {
        Row: {
          id: string
          message_id: string
          student_id: string
          teacher_id: string
          room_id: string
          concern_type: string
          concern_level: number
          analysis_explanation: string | null
          context_messages: Json | null
          status: 'pending' | 'reviewing' | 'resolved' | 'false_positive'
          reviewed_at: string | null
          reviewer_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          message_id: string
          student_id: string
          teacher_id: string
          room_id: string
          concern_type: string
          concern_level: number
          analysis_explanation?: string | null
          context_messages?: Json | null
          status?: 'pending' | 'reviewing' | 'resolved' | 'false_positive'
          reviewed_at?: string | null
          reviewer_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          student_id?: string
          teacher_id?: string
          room_id?: string
          concern_type?: string
          concern_level?: number
          analysis_explanation?: string | null
          context_messages?: Json | null
          status?: 'pending' | 'reviewing' | 'resolved' | 'false_positive'
          reviewed_at?: string | null
          reviewer_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'teacher' | 'student' | 'admin'
          created_at: string
          updated_at: string
        }
      }
    }
    Functions: {
      generate_room_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_unique_pin: {
        Args: { p_school_id: string }
        Returns: string
      }
      check_pin_change_allowed: {
        Args: { p_student_id: string }
        Returns: boolean
      }
      setup_school: {
        Args: {
          p_school_name: string
          p_admin_email: string
          p_admin_name: string
          p_country?: string
        }
        Returns: {
          school_id: string
          school_code: string
          message: string
        }[]
      }
    }
    Enums: {
      assessment_status: 'pending' | 'ai_processing' | 'ai_completed' | 'teacher_reviewed'
      assessment_type: 'multiple_choice' | 'open_ended'
      bot_type: 'learning' | 'assessment' | 'reading_room' | 'viewing_room' | 'knowledge_book'
      concern_status: 'pending' | 'reviewing' | 'resolved' | 'false_positive'
      user_role: 'teacher' | 'student' | 'admin'
    }
  }
}