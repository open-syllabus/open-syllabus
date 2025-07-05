// Types for student notebooks feature

import type { BaseTable, Chatbot } from './database.types';

// Database table type (matches actual schema)
export interface StudentNotebook extends BaseTable {
  notebook_id: string;
  student_id: string;
  chatbot_id: string;
  name: string;  // Required field in database
  description?: string;
  title?: string;  // Optional for UI compatibility
  is_starred?: boolean;
  display_order?: number;
}

// UI type with all fields guaranteed
export interface NotebookWithMetadata extends StudentNotebook {
  name: string; // Always present (required in DB)
  title: string; // Always present for UI (defaults to name)
  is_starred: boolean; // Always present (defaults to false if not in DB)
  chatbot?: Partial<Chatbot>;
  entry_count?: number;
  last_entry_date?: string;
}

// Notebook entry type (matches database schema)
export interface NotebookEntry extends BaseTable {
  entry_id: string;
  notebook_id: string;
  message_id: string;
  chatbot_id?: string;
  room_id?: string;
  content: string;  // Column is 'content' not 'message_content'
  selected_portion?: string;
  chatbot_name?: string;
  notes?: string;
  display_order?: number;
  message?: {
    created_at?: string;
    user_id?: string;
  };
  metadata?: {
    saved_at?: string;
    message_role?: 'user' | 'assistant';  // Role stored in metadata
    original_content?: string;
    chatbot_name?: string;
    [key: string]: unknown;
  };
}

// Highlight color options
export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange';

// Notebook highlight type
export interface NotebookHighlight extends BaseTable {
  highlight_id: string;
  entry_id: string;
  student_id: string;
  start_position: number;
  end_position: number;
  selected_text: string;
  color: HighlightColor;
}

// Student note type
export interface NotebookStudentNote extends BaseTable {
  note_id: string;
  entry_id: string;
  student_id: string;
  content: string;
  anchor_position?: number;
  is_expanded?: boolean;
}

// Extended entry type with highlights and notes
export interface NotebookEntryWithAnnotations extends NotebookEntry {
  highlights?: NotebookHighlight[];
  student_notes?: NotebookStudentNote[];
}