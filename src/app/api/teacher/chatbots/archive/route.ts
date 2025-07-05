// src/app/api/teacher/chatbots/archive/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    // Authentication check
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get request body
    const { chatbotId, archive = true } = await request.json();

    if (!chatbotId) {
      return NextResponse.json(
        { error: 'Missing required field: chatbotId is required' },
        { status: 400 }
      );
    }
    
    // Verify the teacher owns the chatbot
    const { data: chatbot, error: chatbotError } = await supabase
      .from('chatbots')
      .select('chatbot_id')
      .eq('chatbot_id', chatbotId)
      .eq('teacher_id', user.id)
      .single();
    
    if (chatbotError || !chatbot) {
      console.error('Chatbot access error:', chatbotError);
      return NextResponse.json(
        { error: 'No permission to access this chatbot or chatbot not found' },
        { status: 403 }
      );
    }

    // Use admin client for the update to bypass RLS
    const adminClient = createAdminClient();
    
    // Archive or restore the chatbot
    const { error: archiveError } = await adminClient
      .from('chatbots')
      .update({ 
        is_archived: archive,
        updated_at: new Date().toISOString()
      })
      .eq('chatbot_id', chatbotId);
      
    if (archiveError) {
      console.error(`Error ${archive ? 'archiving' : 'restoring'} chatbot:`, archiveError);
      return NextResponse.json(
        { error: `Failed to ${archive ? 'archive' : 'restore'} chatbot: ` + archiveError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Chatbot successfully ${archive ? 'archived' : 'restored'}`
    });
    
  } catch (error) {
    console.error('Error in chatbot archive/restore endpoint:', error);
    return NextResponse.json(
      { error: 'Server error while processing request' },
      { status: 500 }
    );
  }
}