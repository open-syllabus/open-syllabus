import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ notebookId: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get entry_id from query params if provided
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('entryId');

    // Build query
    let query = supabase
      .from('notebook_student_notes')
      .select('*')
      .eq('student_id', user.id);

    if (entryId) {
      query = query.eq('entry_id', entryId);
    } else {
      // Get all notes for entries in this notebook
      const { data: entries } = await supabase
        .from('notebook_entries')
        .select('entry_id')
        .eq('notebook_id', (await params).notebookId);
      
      if (entries && entries.length > 0) {
        const entryIds = entries.map(e => e.entry_id);
        query = query.in('entry_id', entryIds);
      }
    }

    const { data: notes, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching notes:', error);
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }

    return NextResponse.json({ notes: notes || [] });
  } catch (error) {
    console.error('Error in notes GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ notebookId: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { entry_id, content, anchor_position } = body;

    // Validate required fields
    if (!entry_id || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the entry belongs to a notebook the student has access to
    const { data: entry, error: entryError } = await supabase
      .from('notebook_entries')
      .select('notebook_id')
      .eq('entry_id', entry_id)
      .single();

    if (entryError || !entry) {
      console.error('Error fetching entry:', entryError);
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Verify the student has access to this notebook
    const { data: notebook, error: notebookError } = await supabase
      .from('student_notebooks')
      .select('notebook_id')
      .eq('notebook_id', entry.notebook_id)
      .eq('student_id', user.id)
      .single();

    if (notebookError || !notebook) {
      console.error('Notebook access error:', notebookError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create the note
    const { data: note, error } = await supabase
      .from('notebook_student_notes')
      .insert({
        entry_id,
        student_id: user.id,
        content,
        anchor_position,
        is_expanded: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Error in notes POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ notebookId: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { note_id, content, is_expanded } = body;

    if (!note_id) {
      return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
    }

    // Build update object
    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (is_expanded !== undefined) updateData.is_expanded = is_expanded;

    // Update the note (RLS will ensure it belongs to the user)
    const { data: note, error } = await supabase
      .from('notebook_student_notes')
      .update(updateData)
      .eq('note_id', note_id)
      .eq('student_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating note:', error);
      return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error('Error in notes PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ notebookId: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
    }

    // Delete the note (RLS will ensure it belongs to the user)
    const { error } = await supabase
      .from('notebook_student_notes')
      .delete()
      .eq('note_id', noteId)
      .eq('student_id', user.id);

    if (error) {
      console.error('Error deleting note:', error);
      return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in notes DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}