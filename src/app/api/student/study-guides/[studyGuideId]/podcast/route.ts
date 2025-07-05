import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Check if OpenAI is configured
if (!process.env.OPENAI_API_KEY) {
  console.error('WARNING: OPENAI_API_KEY is not configured. Podcast generation will fail.');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studyGuideId: string }> }
) {
  try {
    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      return NextResponse.json({ 
        error: 'Podcast generation is not available',
        details: 'OpenAI API key is not configured. Please contact support.'
      }, { status: 503 });
    }

    const supabase = await createServerSupabaseClient();
    const { studyGuideId } = await params;
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const { voice = 'nova', speed = 1.0 } = await request.json();

    // Check if podcast already exists
    const { data: existingPodcast } = await supabase
      .from('study_guide_podcasts')
      .select('podcast_id, audio_url')
      .eq('study_guide_id', studyGuideId)
      .eq('voice', voice)
      .eq('speed', speed)
      .single();

    if (existingPodcast && existingPodcast.audio_url) {
      return NextResponse.json({ 
        podcastId: existingPodcast.podcast_id,
        audioUrl: existingPodcast.audio_url,
        cached: true 
      });
    }

    // Fetch the study guide
    const { data: studyGuide, error: fetchError } = await supabase
      .from('study_guides')
      .select('*')
      .eq('study_guide_id', studyGuideId)
      .eq('student_id', user.id)
      .single();

    if (fetchError || !studyGuide) {
      console.error('Error fetching study guide:', fetchError);
      return NextResponse.json({ 
        error: 'Study guide not found',
        details: fetchError?.message || 'No study guide found for this user'
      }, { status: 404 });
    }

    // Call Supabase Edge Function to generate podcast
    console.log(`[Podcast API] Calling edge function for study guide ${studyGuideId}`);
    
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-podcast`;
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        studyGuideId,
        userId: user.id,
        studyGuideContent: studyGuide.content,
        studyGuideTitle: studyGuide.title,
        voice,
        speed
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Podcast API] Edge function error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: edgeFunctionUrl,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      });
      return NextResponse.json({ 
        error: 'Failed to generate podcast',
        details: errorText,
        status: response.status
      }, { status: 500 });
    }

    const result = await response.json();
    
    if (result.success) {
      return NextResponse.json({
        podcastId: result.podcastId,
        audioUrl: result.audioUrl,
        status: 'completed',
        cached: result.cached
      });
    } else {
      return NextResponse.json({ 
        error: 'Failed to generate podcast',
        details: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error starting podcast generation:', error);
    return NextResponse.json({ 
      error: 'Failed to start podcast generation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to retrieve existing podcast
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

    // Get voice and speed from query params
    const { searchParams } = new URL(request.url);
    const voice = searchParams.get('voice') || 'nova';
    const speed = parseFloat(searchParams.get('speed') || '1.0');

    // Fetch podcast metadata
    const { data: podcast, error } = await supabase
      .from('study_guide_podcasts')
      .select('*')
      .eq('study_guide_id', studyGuideId)
      .eq('student_id', user.id)
      .eq('voice', voice)
      .eq('speed', speed)
      .single();

    if (error || !podcast) {
      return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
    }

    return NextResponse.json({ podcast });

  } catch (error) {
    console.error('Error fetching podcast:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch podcast',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}