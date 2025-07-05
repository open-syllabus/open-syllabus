// src/types/class.types.ts
// Type definitions for class management system

export interface TeacherClass {
  class_id: string;
  teacher_id: string;
  name: string;
  description: string | null;
  academic_year: string | null;
  grade_level: string | null;
  subject: string | null;
  student_count: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClassStudent {
  class_id: string;
  student_id: string;
  added_at: string;
  added_by: string | null;
}

export interface StudentInfo {
  student_id: string;
  full_name: string;
  email: string | null;
  username?: string;
  added_at?: string;
}

export interface ClassWithStudents extends TeacherClass {
  students: StudentInfo[];
}

export interface RoomClass {
  room_id: string;
  class_id: string;
  added_at: string;
  added_by: string | null;
}

export interface ClassUploadResult {
  summary: {
    total_rows: number;
    created: number;
    linked_existing: number;
    skipped: number;
    errors: number;
  };
  class: {
    id: string;
    name: string;
  };
  details: {
    skipped?: Array<{
      row: number;
      full_name: string;
      reason: string;
    }>;
    errors?: Array<{
      row: number;
      error: string;
    }>;
  };
}

export interface CreateClassData {
  name: string;
  description?: string;
  academic_year?: string;
  grade_level?: string;
  subject?: string;
}

export interface UpdateClassData {
  name?: string;
  description?: string;
  academic_year?: string;
  grade_level?: string;
  subject?: string;
  is_archived?: boolean;
}