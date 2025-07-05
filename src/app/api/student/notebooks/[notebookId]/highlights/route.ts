import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { HighlightColor } from '@/types/notebook.types';

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
      .from('notebook_highlights')
      .select('*')
      .eq('student_id', user.id);

    if (entryId) {
      query = query.eq('entry_id', entryId);
    } else {
      // Get all highlights for entries in this notebook
      const { data: entries } = await supabase
        .from('notebook_entries')
        .select('entry_id')
        .eq('notebook_id', (await params).notebookId);
      
      if (entries && entries.length > 0) {
        const entryIds = entries.map(e => e.entry_id);
        query = query.in('entry_id', entryIds);
      }
    }

    const { data: highlights, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching highlights:', error);
      return NextResponse.json({ error: 'Failed to fetch highlights' }, { status: 500 });
    }

    return NextResponse.json({ highlights: highlights || [] });
  } catch (error) {
    console.error('Error in highlights GET:', error);
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
    const { entry_id, start_position, end_position, selected_text, color = 'yellow' } = body;
    
    console.log('Creating highlight for entry:', entry_id, 'by user:', user.id);

    // Validate required fields
    if (!entry_id || start_position === undefined || end_position === undefined || !selected_text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate color
    const validColors: HighlightColor[] = ['yellow', 'green', 'blue', 'pink', 'orange'];
    if (!validColors.includes(color)) {
      return NextResponse.json({ error: 'Invalid color' }, { status: 400 });
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

    // Create the highlight
    const { data: highlight, error } = await supabase
      .from('notebook_highlights')
      .insert({
        entry_id,
        student_id: user.id,
        start_position,
        end_position,
        selected_text,
        color
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating highlight:', error);
      return NextResponse.json({ error: 'Failed to create highlight' }, { status: 500 });
    }

    return NextResponse.json({ highlight });
  } catch (error) {
    console.error('Error in highlights POST:', error);
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
    const highlightId = searchParams.get('highlightId');

    if (!highlightId) {
      return NextResponse.json({ error: 'Highlight ID required' }, { status: 400 });
    }

    // Delete the highlight (RLS will ensure it belongs to the user)
    const { error } = await supabase
      .from('notebook_highlights')
      .delete()
      .eq('highlight_id', highlightId)
      .eq('student_id', user.id);

    if (error) {
      console.error('Error deleting highlight:', error);
      return NextResponse.json({ error: 'Failed to delete highlight' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in highlights DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}