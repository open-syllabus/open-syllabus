// src/app/api/student/room-bot-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/types/database-new.types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get parameters from query string
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const botId = searchParams.get('botId');
    const userId = searchParams.get('userId');
    const accessId = searchParams.get('accessId');

    // Validate required parameters
    if (!roomId || !botId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: roomId and botId are required' 
      }, { status: 400 });
    }
    
    console.log('[API GET /room-bot-data] Request params:', {
      roomId,
      botId,
      userId,
      accessId,
      fullUrl: request.url
    });

    // Use admin client to bypass RLS
    const supabaseAdmin = createAdminClient();

    // Verify user has access to the room if userId is provided
    let actualStudentId = userId;
    if (userId) {
      // First get the actual student_id from the students table
      const { data: studentProfile, error: studentError } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('auth_id', userId)
        .maybeSingle();
        
      if (studentProfile) {
        actualStudentId = studentProfile.id;
        console.log('[API GET /room-bot-data] Found student id:', actualStudentId, 'for auth_id:', userId);
      }
      
      const { data: membership, error: membershipError } = await supabaseAdmin
        .from('room_members')
        .select('room_id')
        .eq('room_id', roomId)
        .eq('student_id', actualStudentId)
        .maybeSingle();

      if (membershipError) {
        console.error('[API GET /room-bot-data] Error checking membership:', membershipError);
        // Continue anyway, we'll create membership if needed
      }

      if (!membership) {
        console.log('[API GET /room-bot-data] User not in room');
        return NextResponse.json(
          { error: 'Student is not a member of this room. Please ask your teacher to add you.' },
          { status: 403 }
        );
      }
    }

    // Fetch all data in parallel for better performance
    const [roomResult, botResult, roomBotResult, readingDocResult, accessResult] = await Promise.allSettled([
      // Get room data
      supabaseAdmin
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single(),
      
      // Get bot data with all fields
      supabaseAdmin
        .from('bots')
        .select(`
          id, 
          name, 
          description, 
          system_prompt, 
          model, 
          max_tokens, 
          temperature, 
          has_documents,
          type, 
          welcome_message
        `)
        .eq('id', botId)
        .single()
        .then(result => {
          console.log('[API GET /room-bot-data] Bot query result:', {
            botId,
            status: result.error ? 'error' : 'success',
            error: result.error?.message || null,
            errorCode: result.error?.code || null,
            hasData: !!result.data,
            botName: result.data?.name || 'N/A'
          });
          return result;
        }),
      
      // Verify bot-room association
      supabaseAdmin
        .from('room_bots')
        .select('bot_id')
        .eq('room_id', roomId)
        .eq('bot_id', botId)
        .single()
        .then(result => {
          console.log('[API GET /room-bot-data] Association check result:', {
            roomId,
            botId,
            status: result.error ? 'error' : 'success',
            error: result.error?.message || null,
            hasData: !!result.data
          });
          return result;
        }),
      
      // Get bot document if applicable
      supabaseAdmin
        .from('bot_documents')
        .select('file_name, file_path')
        .eq('bot_id', botId)
        .eq('status', 'completed')
        .limit(1)
        .maybeSingle(),
      
      // Get or create access if userId provided
      userId && !accessId ? 
        supabaseAdmin
          .from('student_bot_access')
          .select('*')
          .eq('student_id', actualStudentId)
          .eq('bot_id', botId)
          .eq('room_id', roomId)
          .maybeSingle()
        : accessId ?
          supabaseAdmin
            .from('student_bot_access')
            .select('*')
            .eq('id', accessId)
            .single()
          : Promise.resolve({ status: 'fulfilled', value: { data: null } })
    ]);

    // Process results
    if (roomResult.status === 'rejected' || !(roomResult.status === 'fulfilled' && roomResult.value.data)) {
      console.error('[API GET /room-bot-data] Room query failed:', {
        status: roomResult.status,
        error: roomResult.status === 'rejected' ? roomResult.reason : 'No data'
      });
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (botResult.status === 'rejected' || !(botResult.status === 'fulfilled' && botResult.value.data)) {
      console.error('[API GET /room-bot-data] Bot not found:', {
        botId,
        status: botResult.status,
        error: botResult.status === 'rejected' ? botResult.reason : 'No data returned',
        hasValue: botResult.status === 'fulfilled' ? !!botResult.value : false,
        valueType: botResult.status === 'fulfilled' ? typeof botResult.value : 'N/A',
        // Log the actual result structure for debugging
        fullResult: JSON.stringify(botResult, null, 2)
      });
      return NextResponse.json({ error: `Bot not found with ID: ${botId}` }, { status: 404 });
    }

    if (roomBotResult.status === 'rejected' || !(roomBotResult.status === 'fulfilled' && roomBotResult.value.data)) {
      console.error('[API GET /room-bot-data] Association check failed:', {
        status: roomBotResult.status,
        error: roomBotResult.status === 'rejected' ? roomBotResult.reason : 'No data'
      });
      return NextResponse.json({ error: 'Bot is not associated with this room' }, { status: 404 });
    }

    const room = (roomResult.status === 'fulfilled' ? roomResult.value.data : null)!;
    const bot = (botResult.status === 'fulfilled' ? botResult.value.data : null)!;
    const botDocument = readingDocResult.status === 'fulfilled' ? readingDocResult.value.data : null;
    let existingAccess = accessResult.status === 'fulfilled' && 'data' in accessResult.value ? accessResult.value.data : null;

    // Create access if needed
    if (userId && !existingAccess && !accessId) {
      const { data: newAccess } = await supabaseAdmin
        .from('student_bot_access')
        .insert({
          student_id: actualStudentId,
          bot_id: botId,
          room_id: roomId
        })
        .select()
        .single();
      
      existingAccess = newAccess;
    }

    // Build response with caching
    const response = NextResponse.json({
      room: {
        id: room.id,
        name: room.name,
        code: room.code,
        teacher_id: room.teacher_id,
        school_id: room.school_id,
        is_active: room.is_active,
        created_at: room.created_at,
        updated_at: room.updated_at,
        room_bots: [{
          bots: bot
        }]
      },
      bot: bot,
      accessId: existingAccess?.id || accessId,
      botDocument: (bot.type === 'reading_room' || bot.type === 'viewing_room') ? botDocument : null
    });
    
    // Cache for 5 minutes
    response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=60');
    
    return response;
  } catch (error) {
    console.error('[API GET /room-bot-data] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}