# Notebook Highlights and Notes Implementation Guide

## Overview
This guide documents the implementation of highlighting functionality and student notes for the notebook feature in Skolr.

## Features Implemented

### 1. Text Highlighting
- Students can select text within notebook entries and highlight it in 5 different colors:
  - Yellow (default)
  - Green
  - Blue
  - Pink
  - Orange
- Highlights are persisted to the database and restored when the page reloads
- Students can remove highlights by double-clicking on them

### 2. Student Notes
- Students can add personal notes to any notebook entry
- Notes appear in a separate section below the entry content
- Notes can be edited and deleted
- Notes display timestamps

## Database Schema

### notebook_highlights table
```sql
CREATE TABLE notebook_highlights (
    highlight_id UUID PRIMARY KEY,
    entry_id UUID REFERENCES notebook_entries(entry_id),
    student_id UUID REFERENCES auth.users(id),
    start_position INTEGER NOT NULL,
    end_position INTEGER NOT NULL,
    selected_text TEXT NOT NULL,
    color VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

### notebook_student_notes table
```sql
CREATE TABLE notebook_student_notes (
    note_id UUID PRIMARY KEY,
    entry_id UUID REFERENCES notebook_entries(entry_id),
    student_id UUID REFERENCES auth.users(id),
    content TEXT NOT NULL,
    anchor_position INTEGER,
    is_expanded BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

## API Endpoints

### Highlights API (`/api/student/notebooks/[notebookId]/highlights`)
- **GET**: Fetch highlights for entries in a notebook
- **POST**: Create a new highlight
- **DELETE**: Remove a highlight

### Notes API (`/api/student/notebooks/[notebookId]/notes`)
- **GET**: Fetch notes for entries in a notebook
- **POST**: Create a new note
- **PATCH**: Update an existing note
- **DELETE**: Remove a note

## Usage Instructions

### For Students

#### Creating Highlights
1. Select any text within a notebook entry
2. A highlight toolbar will appear above the selection
3. Click on a color to highlight the selected text
4. The highlight is automatically saved

#### Removing Highlights
1. Double-click on any highlighted text
2. The highlight will be removed immediately

#### Adding Notes
1. Click the "Add Note" button in the entry header
2. Type your note in the prompt dialog
3. The note will appear below the entry content

#### Editing Notes
1. Click the edit icon next to any note
2. Modify the text in the textarea
3. Click the checkmark to save changes

#### Deleting Notes
1. Click the trash icon next to any note
2. Confirm the deletion when prompted

## Technical Implementation Details

### Text Selection Handling
- Uses the browser's Selection API to capture selected text
- Calculates character positions relative to the entry content
- Stores start and end positions for accurate highlight restoration

### Highlight Rendering
- Integrates with ReactMarkdown to render highlights within formatted content
- Preserves markdown formatting while applying highlights
- Handles overlapping highlights gracefully

### Performance Optimizations
- Highlights and notes are fetched in bulk with entries
- Local state updates for immediate UI feedback
- Optimistic updates for better user experience

## Security Considerations
- Row Level Security (RLS) ensures students can only access their own highlights and notes
- All API endpoints verify user authentication
- Students can only modify their own annotations

## Future Enhancements
1. Collaborative highlights (share with classmates)
2. Export highlights and notes with notebook content
3. Search within highlights and notes
4. Categories or tags for notes
5. Rich text formatting for notes
6. Highlight statistics and analytics

## Troubleshooting

### Common Issues
1. **Highlights not appearing**: Ensure the database migrations have been run
2. **Selection toolbar not showing**: Check that JavaScript is enabled and no errors in console
3. **Notes not saving**: Verify the user is authenticated and has access to the notebook

### Database Migration
Run the migration file to create the necessary tables:
```bash
supabase migration up 20250108_add_highlights_and_notes.sql
```

## Testing the Feature
1. Navigate to any notebook page as a student
2. Select text in an entry and create highlights
3. Add notes to entries
4. Refresh the page to verify persistence
5. Test editing and deleting both highlights and notes