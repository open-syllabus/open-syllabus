import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studyGuideId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { studyGuideId } = await params;
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all podcasts for this study guide
    const { data: podcasts, error } = await supabase
      .from('study_guide_podcasts')
      .select('*')
      .eq('study_guide_id', studyGuideId)
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching podcasts:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch podcasts',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ podcasts: podcasts || [] });

  } catch (error) {
    console.error('Error fetching podcasts:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch podcasts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}