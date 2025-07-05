// src/app/api/teacher/chatbots/[chatbotId]/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { CreateChatbotPayload } from '@/types/database.types';
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limiter/simple-wrapper';

// For Next.js 15.3.1, we need to use any for dynamic route params
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: NextRequest, { params }: any) {
  try {
    const { chatbotId } = params;

    if (!chatbotId) {
      return NextResponse.json({ error: 'Chatbot ID is required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const supabaseAdmin = createAdminClient();
    
    // Try to get the session first, then the user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('[API GET /teacher/chatbots/[chatbotId]] Session error:', sessionError);
      return NextResponse.json({ error: 'Not authenticated - no session' }, { status: 401 });
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[API GET /teacher/chatbots/[chatbotId]] Auth error:', authError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify user is a teacher using admin client to bypass RLS
    const { data: profile } = await supabaseAdmin
      .from('teacher_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Get the chatbot using admin client to bypass RLS
    const { data: chatbot, error: fetchError } = await supabaseAdmin
      .from('chatbots')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .eq('teacher_id', user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
      }
      throw fetchError;
    }

    return NextResponse.json(chatbot);
  } catch (error) {
    console.error('Error in GET /api/teacher/chatbots/[chatbotId]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch chatbot' },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PUT(request: NextRequest, { params }: any) {
  try {
    // Apply rate limiting
    const rateLimitResult = await checkRateLimit(request, RateLimitPresets.api);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }
    
    const { chatbotId } = params;

    if (!chatbotId) {
      return NextResponse.json({ error: 'Chatbot ID is required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const supabaseAdmin = createAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify user is a teacher using admin client to bypass RLS
    const { data: profile } = await supabaseAdmin
      .from('teacher_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Verify the chatbot exists and belongs to this teacher using admin client to bypass RLS
    const { data: existingChatbot, error: fetchError } = await supabaseAdmin
      .from('chatbots')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .eq('teacher_id', user.id)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
      }
      throw fetchError;
    }

    // Get the payload from the request
    const body: CreateChatbotPayload = await request.json();
    console.log("[API PUT /teacher/chatbots/[chatbotId]]", { chatbotId }, "Received payload for update:", body);

    // Validate required fields
    if (!body.name || !body.system_prompt) {
      return NextResponse.json({ error: 'Name and system prompt are required' }, { status: 400 });
    }
    
    if (body.bot_type === 'assessment' && (!body.assessment_criteria_text || body.assessment_criteria_text.trim() === '')) {
      return NextResponse.json({ error: 'Assessment criteria are required for assessment bots.' }, { status: 400 });
    }

    // Import the welcome message generator
    const { generateWelcomeMessage } = await import('@/lib/chatbot/generate-welcome-message');
    
    // Determine the bot type
    const botType = body.bot_type || existingChatbot.bot_type;
    
    // Generate welcome message if not provided and system prompt has changed
    let welcomeMessage = body.welcome_message;
    if (welcomeMessage === undefined) {
      // If welcome_message not in update payload, check if system prompt changed
      if (body.system_prompt !== existingChatbot.system_prompt && botType !== 'assessment') {
        console.log('[PUT /api/teacher/chatbots/[chatbotId]] System prompt changed, regenerating welcome message');
        welcomeMessage = await generateWelcomeMessage({
          systemPrompt: body.system_prompt,
          botType: botType,
          chatbotName: body.name
        });
      } else {
        // Keep existing welcome message
        welcomeMessage = existingChatbot.welcome_message;
      }
    }

    // Prepare the update data
    const updateData = {
      name: body.name,
      description: body.description || undefined,
      system_prompt: body.system_prompt,
      model: body.model || existingChatbot.model,
      model_id: body.model_id || existingChatbot.model_id || 'grok-3-mini',
      max_tokens: body.max_tokens === undefined || body.max_tokens === null 
        ? existingChatbot.max_tokens 
        : Number(body.max_tokens),
      temperature: body.temperature === undefined || body.temperature === null 
        ? existingChatbot.temperature 
        : Number(body.temperature),
      enable_rag: (body.bot_type === 'learning' || body.bot_type === 'reading_room' || body.bot_type === 'viewing_room') 
        ? (body.enable_rag || false) 
        : false,
      bot_type: botType,
      assessment_criteria_text: body.bot_type === 'assessment' ? body.assessment_criteria_text : null,
      assessment_type: body.bot_type === 'assessment' 
        ? (body.assessment_type || existingChatbot.assessment_type || 'multiple_choice') 
        : null,
      assessment_question_count: body.bot_type === 'assessment' 
        ? (body.assessment_question_count || existingChatbot.assessment_question_count || 10) 
        : null,
      welcome_message: welcomeMessage || null,
      updated_at: new Date().toISOString(),
    };
    
    // Debug logging for model selection
    console.log("[API PUT /teacher/chatbots/[chatbotId]] Model selection debug:", {
      provided_model: body.model,
      existing_model: existingChatbot.model,
      final_model: updateData.model
    });
    
    if (updateData.description === undefined) {
      delete updateData.description;
    }

    // Update the chatbot using admin client to bypass RLS
    const { data: updatedChatbot, error: updateError } = await supabaseAdmin
      .from('chatbots')
      .update(updateData)
      .eq('chatbot_id', chatbotId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating chatbot:', updateError);
      if (updateError.code === '23505') {
        return NextResponse.json(
          { error: 'A chatbot with this name might already exist or another unique constraint was violated.' }, 
          { status: 409 }
        );
      }
      throw updateError;
    }

    return NextResponse.json(updatedChatbot);
  } catch (error) {
    console.error('Error in PUT /api/teacher/chatbots/[chatbotId]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update chatbot' },
      { status: 500 }
    );
  }
}