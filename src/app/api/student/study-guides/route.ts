import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/student/study-guides - Get all study guides for the current student
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get notebook_id from query params if provided
    const { searchParams } = new URL(request.url);
    const notebookId = searchParams.get('notebook_id');

    // Build query
    let query = supabase
      .from('study_guides')
      .select(`
        *,
        notebook:student_notebooks(
          notebook_id,
          name,
          title,
          chatbot_id
        ),
        podcasts:study_guide_podcasts(
          podcast_id,
          voice,
          speed,
          duration_seconds,
          created_at
        )
      `)
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    // Filter by notebook if provided
    if (notebookId) {
      query = query.eq('notebook_id', notebookId);
    }

    const { data: studyGuides, error } = await query;

    if (error) {
      console.error('Error fetching study guides:', error);
      return NextResponse.json({ error: 'Failed to fetch study guides' }, { status: 500 });
    }

    return NextResponse.json({ studyGuides: studyGuides || [] });

  } catch (error) {
    console.error('Error in study guides GET:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/student/study-guides?id=xxx - Delete a study guide
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studyGuideId = searchParams.get('id');

    if (!studyGuideId) {
      return NextResponse.json({ error: 'Study guide ID required' }, { status: 400 });
    }

    const { error } = await adminSupabase
      .from('study_guides')
      .delete()
      .eq('study_guide_id', studyGuideId)
      .eq('student_id', user.id);

    if (error) {
      console.error('Error deleting study guide:', error);
      return NextResponse.json({ error: 'Failed to delete study guide' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in study guide DELETE:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}