// src/app/api/teacher/chatbots/archived/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Use admin client to bypass RLS
    const supabaseAdmin = createAdminClient();
    
    // Verify user is a teacher
    const { data: profile } = await supabase
      .from('teacher_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Fetch only archived chatbots
    const { data: chatbots, error: fetchError } = await supabaseAdmin
      .from('chatbots')
      .select('*')
      .eq('teacher_id', user.id)
      .eq('is_archived', true)
      .order('updated_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching archived chatbots:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch archived chatbots' },
        { status: 500 }
      );
    }

    // Add student counts (0 for archived chatbots as they're not active)
    const chatbotsWithCounts = (chatbots || []).map(chatbot => ({
      ...chatbot,
      student_count: 0
    }));

    return NextResponse.json(chatbotsWithCounts);
  } catch (error) {
    console.error('Error in GET /api/teacher/chatbots/archived:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch archived chatbots' },
      { status: 500 }
    );
  }
}