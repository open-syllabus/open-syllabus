# Enhanced Notebook Annotations Guide

## Overview
The notebook feature has been significantly enhanced with inline note-taking and improved highlighting functionality. Students can now create an interactive study experience by annotating specific parts of their saved content.

## Database Setup

First, run the SQL script to create the necessary tables:

```bash
# Run in your Supabase SQL editor
create_notebook_annotations_tables.sql
```

This creates two new tables:
- `notebook_highlights` - Stores text highlights with colors
- `notebook_student_notes` - Stores inline notes anchored to specific positions

## Features

### 1. Text Highlighting
- **Select text** to highlight it in different colors
- **5 color options**: Yellow, Green, Blue, Pink, Orange
- **Double-click** on a highlight to remove it
- Highlights are preserved when the page reloads

### 2. Inline Notes System
- **Click the + button** that appears on hover next to any paragraph or list item
- Notes are anchored to specific positions in the text
- **Note markers** appear as numbered superscripts [1], [2], etc.
- Notes display in the margin on desktop, or in a list below on mobile

### 3. Note Management
- **Edit notes** by clicking the edit icon
- **Delete notes** with confirmation
- Notes are automatically sorted by their position in the text
- Export includes all notes when downloading

### 4. Responsive Design
- **Desktop**: Notes appear in the right margin
- **Tablet/Mobile**: Notes appear in a list below the content
- Touch-friendly interface for mobile devices

## User Interface

### Highlight Toolbar
When text is selected, a floating toolbar appears with:
- 5 color buttons for highlighting
- A note button to add a note at the selection end

### Add Note Hints
When hovering over content:
- A subtle (+) button appears on the left
- Click it to add a note at that position
- The note input appears inline

### Note Display
- **Desktop**: Margin notes align with their markers
- **Mobile**: Collapsible note cards below content
- Edit/Delete actions available on hover/tap

## Technical Implementation

### Key Components

1. **Enhanced Content Renderer**
   - Combines highlights and notes into a single annotation system
   - Maintains text position accuracy across renders
   - Handles overlapping annotations gracefully

2. **Position Tracking**
   - Uses DOM text node walking to calculate positions
   - Preserves positions through markdown rendering
   - Handles complex nested HTML structures

3. **API Integration**
   - `/api/student/notebooks/[notebookId]/highlights` - Manage highlights
   - `/api/student/notebooks/[notebookId]/notes` - Manage notes
   - Automatic user authentication and authorization

### State Management
- Local state updates for instant feedback
- Optimistic updates with error handling
- Batch loading of annotations with entries

## Export Functionality

The export feature has been enhanced to include:
- All highlights (shown in plain text exports)
- All notes with their numbers and content
- Proper formatting for both Markdown and plain text

## Best Practices

1. **Highlighting**
   - Use different colors for different types of information
   - Yellow for key concepts, Green for examples, etc.

2. **Note-Taking**
   - Keep notes concise and focused
   - Add notes for clarification or personal insights
   - Use notes to create connections between concepts

3. **Organization**
   - Review and clean up old highlights periodically
   - Export important notebooks for backup
   - Use the star feature for frequently accessed notebooks

## Troubleshooting

### Highlights not appearing
- Ensure the database tables are created
- Check browser console for API errors
- Verify user authentication

### Notes not saving
- Check network connection
- Ensure you're logged in
- Try refreshing the page

### Position issues
- Avoid editing the source content after adding annotations
- If positions shift, remove and re-add annotations

## Future Enhancements

Potential improvements for consideration:
- Highlight search and filter
- Note categories or tags
- Collaborative annotations
- AI-powered note suggestions
- Cross-reference between notes