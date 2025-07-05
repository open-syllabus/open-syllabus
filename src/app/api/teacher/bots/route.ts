// src/app/api/teacher/bots/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { deleteBotVectors } from '@/lib/pinecone/utils';
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limiter/simple-wrapper';

// GET Handler
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // IMPORTANT: We're using the admin client to bypass RLS issues
    const supabaseAdmin = createAdminClient();
    
    // Check if user is a teacher
    const { data: teacher } = await supabaseAdmin
      .from('teachers')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!teacher) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Extract query parameters for filtering and sorting
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('searchTerm');
    const botType = searchParams.get('botType');
    const hasDocumentsParam = searchParams.get('hasDocuments'); // 'true' or 'false'
    const sortBy = searchParams.get('sortBy') || 'created_at_desc';

    // Use admin client instead of RLS-restricted client
    let query = supabaseAdmin
      .from('bots')
      .select('*')
      .eq('teacher_id', user.id);

    // Apply search term filter
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }
    
    // Apply bot type filter
    if (botType) {
      query = query.eq('type', botType);
    }

    // Apply has_documents filter
    if (hasDocumentsParam !== null) {
      const hasDocuments = hasDocumentsParam === 'true';
      query = query.eq('has_documents', hasDocuments);
    }

    // Apply sorting
    switch (sortBy) {
      case 'name_asc':
        query = query.order('name', { ascending: true });
        break;
      case 'name_desc':
        query = query.order('name', { ascending: false });
        break;
      case 'created_at_asc':
        query = query.order('created_at', { ascending: true });
        break;
      case 'created_at_desc':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data: bots, error } = await query;

    if (error) {
      console.error('[API GET /teacher/bots] Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch bots' }, { status: 500 });
    }

    // Filter out archived bots unless specifically requested
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const filteredBots = includeArchived 
      ? bots 
      : bots?.filter(bot => !bot.is_archived) || [];

    return NextResponse.json({ bots: filteredBots });
  } catch (error) {
    console.error('[API GET /teacher/bots] Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// POST Handler
export async function POST(request: NextRequest) {
  try {
    // Rate limiting for bot creation
    const rateLimitResult = await checkRateLimit(request, RateLimitPresets.api);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is a teacher
    const supabaseAdmin = createAdminClient();
    const { data: teacher } = await supabaseAdmin
      .from('teachers')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!teacher) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.system_prompt) {
      return NextResponse.json(
        { error: 'Name and system prompt are required' },
        { status: 400 }
      );
    }

    // Create the bot
    const { data: newBot, error: createError } = await supabaseAdmin
      .from('bots')
      .insert({
        teacher_id: user.id,
        name: body.name,
        description: body.description,
        system_prompt: body.system_prompt,
        model: body.model || 'gpt-3.5-turbo',
        type: body.type || 'learning',
        welcome_message: body.welcome_message,
        has_documents: false, // Always starts without documents
        temperature: body.temperature || 0.7,
        max_tokens: body.max_tokens || 1000,
        is_archived: false
      })
      .select()
      .single();

    if (createError) {
      console.error('[API POST /teacher/bots] Create error:', createError);
      return NextResponse.json({ error: 'Failed to create bot' }, { status: 500 });
    }

    return NextResponse.json({ bot: newBot }, { status: 201 });
  } catch (error) {
    console.error('[API POST /teacher/bots] Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// DELETE Handler
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('id');

    if (!botId) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();

    // Verify ownership
    const { data: bot } = await supabaseAdmin
      .from('bots')
      .select('teacher_id')
      .eq('id', botId)
      .single();

    if (!bot || bot.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Delete associated vectors from Pinecone
    try {
      await deleteBotVectors(botId);
    } catch (vectorError) {
      console.error('[API DELETE /teacher/bots] Vector deletion error:', vectorError);
      // Continue with bot deletion even if vector deletion fails
    }

    // Delete the bot (cascade will handle related records)
    const { error: deleteError } = await supabaseAdmin
      .from('bots')
      .delete()
      .eq('id', botId);

    if (deleteError) {
      console.error('[API DELETE /teacher/bots] Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete bot' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API DELETE /teacher/bots] Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}