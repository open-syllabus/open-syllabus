// API routes for notebook entries
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch all entries for a specific notebook
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ notebookId: string }> }
) {
  try {
    const supabase = await createClient();
    const { notebookId } = await params;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify notebook ownership
    const { data: notebook, error: notebookError } = await supabase
      .from('student_notebooks')
      .select('*')
      .eq('notebook_id', notebookId)
      .eq('student_id', user.id)
      .single();

    if (notebookError || !notebook) {
      return NextResponse.json({ error: 'Notebook not found' }, { status: 404 });
    }

    // Fetch entries with message details
    const { data: entries, error } = await supabase
      .from('notebook_entries')
      .select(`
        *,
        message:chat_messages(
          message_id,
          created_at,
          role,
          user_id
        )
      `)
      .eq('notebook_id', notebookId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching entries:', error);
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
    }

    // Fetch highlights and notes for all entries
    const entryIds = entries?.map(e => e.entry_id) || [];
    
    // Fetch highlights
    const { data: highlights } = await supabase
      .from('notebook_highlights')
      .select('*')
      .in('entry_id', entryIds)
      .eq('student_id', user.id)
      .order('start_position', { ascending: true });

    // Fetch notes
    const { data: notes } = await supabase
      .from('notebook_student_notes')
      .select('*')
      .in('entry_id', entryIds)
      .eq('student_id', user.id)
      .order('created_at', { ascending: true });

    // Combine entries with their highlights and notes
    const entriesWithAnnotations = entries?.map(entry => ({
      ...entry,
      highlights: highlights?.filter(h => h.entry_id === entry.entry_id) || [],
      student_notes: notes?.filter(n => n.entry_id === entry.entry_id) || []
    })) || [];

    return NextResponse.json({ 
      notebook,
      entries: entriesWithAnnotations 
    });
  } catch (error) {
    console.error('Error in GET entries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a specific entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ notebookId: string }> }
) {
  try {
    const supabase = await createClient();
    const { notebookId } = await params;
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('entryId');

    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID required' }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify notebook ownership
    const { data: notebook, error: notebookError } = await supabase
      .from('student_notebooks')
      .select('notebook_id')
      .eq('notebook_id', notebookId)
      .eq('student_id', user.id)
      .single();

    if (notebookError || !notebook) {
      return NextResponse.json({ error: 'Notebook not found' }, { status: 404 });
    }

    // Delete entry
    const { error } = await supabase
      .from('notebook_entries')
      .delete()
      .eq('entry_id', entryId)
      .eq('notebook_id', notebookId);

    if (error) {
      console.error('Error deleting entry:', error);
      return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
    }

    // Update notebook's updated_at timestamp
    await supabase
      .from('student_notebooks')
      .update({ updated_at: new Date().toISOString() })
      .eq('notebook_id', notebookId);

    return NextResponse.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}