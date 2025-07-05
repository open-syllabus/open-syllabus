import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getPodcastJobStatus } from '@/lib/queue/memory-queue-safe';

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

    // Get job ID from query params
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const voice = searchParams.get('voice') || 'nova';
    const speed = parseFloat(searchParams.get('speed') || '1.0');
    
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Get job status from queue
    const jobStatus = await getPodcastJobStatus(jobId);
    
    // If job is completed, check if we have the podcast record
    if (jobStatus.status === 'completed' && jobStatus.result?.success) {
      const { data: podcast } = await supabase
        .from('study_guide_podcasts')
        .select('*')
        .eq('study_guide_id', studyGuideId)
        .eq('student_id', user.id)
        .eq('voice', voice)
        .eq('speed', speed)
        .single();

      return NextResponse.json({
        status: 'completed',
        progress: 100,
        podcast: podcast,
        audioUrl: jobStatus.result.audioUrl,
        podcastId: jobStatus.result.podcastId
      });
    }

    // Return current job status
    return NextResponse.json({
      status: jobStatus.status,
      progress: jobStatus.progress || 0,
      error: jobStatus.error
    });

  } catch (error) {
    console.error('Error checking podcast status:', error);
    return NextResponse.json({ 
      error: 'Failed to check podcast status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}