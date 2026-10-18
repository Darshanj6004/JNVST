// Auto-generated database types matching the Supabase schema
// Keep in sync with the SQL schema in supabase/schema.sql

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "teacher" | "student";
          full_name: string;
          username: string;
          roll_number: string | null;
          class_name: string | null;
          avatar_color: string;
          status: "active" | "inactive";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: "teacher" | "student";
          full_name: string;
          username: string;
          roll_number?: string | null;
          class_name?: string | null;
          avatar_color?: string;
          status?: "active" | "inactive";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          code: string;
          total_questions: number;
          total_marks: number;
          duration_minutes: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["subjects"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["subjects"]["Insert"]>;
      };
      topics: {
        Row: {
          id: string;
          subject_id: string;
          name: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["topics"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["topics"]["Insert"]>;
      };
      questions: {
        Row: {
          id: string;
          subject_id: string;
          topic_id: string;
          difficulty: "easy" | "medium" | "hard";
          question_text: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_option: "A" | "B" | "C" | "D";
          explanation: string | null;
          image_url: string | null;
          marks: number;
          used_count: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["questions"]["Row"], "id" | "created_at" | "updated_at" | "used_count"> & { id?: string; used_count?: number };
        Update: Partial<Database["public"]["Tables"]["questions"]["Insert"]>;
      };
      mock_tests: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          pattern: "JNVST" | "Manual";
          duration_minutes: number;
          total_questions: number;
          total_marks: number;
          scheduled_at: string | null;
          status: "draft" | "scheduled" | "live" | "completed";
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["mock_tests"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["mock_tests"]["Insert"]>;
      };
      mock_test_questions: {
        Row: {
          id: string;
          mock_test_id: string;
          question_id: string;
          order_index: number;
        };
        Insert: Omit<Database["public"]["Tables"]["mock_test_questions"]["Row"], "id"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["mock_test_questions"]["Insert"]>;
      };
      exam_attempts: {
        Row: {
          id: string;
          student_id: string;
          mock_test_id: string;
          started_at: string;
          submitted_at: string | null;
          score: number | null;
          total_attempted: number;
          total_correct: number;
          status: "in_progress" | "submitted" | "timed_out";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["exam_attempts"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["exam_attempts"]["Insert"]>;
      };
      exam_answers: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          selected_option: "A" | "B" | "C" | "D" | null;
          is_marked_for_review: boolean;
          is_correct: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["exam_answers"]["Row"], "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["exam_answers"]["Insert"]>;
      };
      practice_sets: {
        Row: {
          id: string;
          title: string;
          subject_id: string;
          topic_id: string | null;
          difficulty: "easy" | "medium" | "hard" | "combined";
          question_ids: string[];
          created_by: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["practice_sets"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["practice_sets"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          title: string;
          body: string;
          type: "test" | "result" | "info" | "alert";
          target_role: "student" | "teacher" | "all" | null;
          target_student_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      notification_reads: {
        Row: {
          id: string;
          notification_id: string;
          user_id: string;
          read_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notification_reads"]["Row"], "id" | "read_at"> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["notification_reads"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
