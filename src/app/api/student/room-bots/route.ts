// src/app/api/student/room-bots/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/types/database-new.types';

export async function GET(request: NextRequest) {
  try {
    // Get room ID from query params
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const userId = searchParams.get('userId'); // Allow direct access mode

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    // Use admin client to ensure we can access the data regardless of auth state
    const supabaseAdmin = createAdminClient();
    
    // Get the current user ID (either from auth or from userId parameter)
    let studentId: string | null = null;
    
    if (userId) {
      // Direct access mode - trust the userId from the join process
      studentId = userId;
      console.log('[API GET /student/room-bots] Using direct access user ID:', studentId);
      
      // Verify the user exists in auth system (not just profiles)
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (!authUser?.user) {
        console.warn('[API GET /student/room-bots] User ID not found in auth:', userId);
        return NextResponse.json({ error: 'Invalid user ID' }, { status: 401 });
      }
    } 
    
    if (!studentId) {
      // Try to get authenticated user
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        studentId = user.id;
        console.log('[API GET /student/room-bots] Using authenticated user ID:', studentId);
      }
    }
    
    if (!studentId) {
      return NextResponse.json({ error: 'Authenticated user or valid user ID required' }, { status: 401 });
    }

    // First, verify the room exists
    const { data: room, error: roomError } = await supabaseAdmin
      .from('rooms')
      .select('id, name, is_active')
      .eq('id', roomId)
      .single();

    if (roomError) {
      console.error('[API GET /student/room-bots] Room not found:', roomError);
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check if room is active
    if (!room.is_active) {
      console.warn('[API GET /student/room-bots] Room is inactive:', roomId);
      return NextResponse.json({ error: 'Room is inactive' }, { status: 403 });
    }
    
    // Verify student has access to this room
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('room_members')
      .select('room_id')
      .eq('room_id', roomId)
      .eq('student_id', studentId)
      .single();
      
    if (membershipError || !membership) {
      console.warn('[API GET /student/room-bots] Student not in room:', studentId, roomId);
      return NextResponse.json({ error: 'Access denied to this room' }, { status: 403 });
    }

    // Get student-specific bot access for this room
    const { data: botAccess, error: accessError } = await supabaseAdmin
      .from('student_bot_access')
      .select(`
        id,
        bot_id,
        bots (
          id,
          name,
          description,
          model,
          type,
          welcome_message
        )
      `)
      .eq('room_id', roomId)
      .eq('student_id', studentId);

    if (accessError) {
      console.error('[API GET /student/room-bots] Error fetching student bot access:', accessError);
      return NextResponse.json({ error: 'Error fetching bot data' }, { status: 500 });
    }

    // If no access exists yet, create them now
    if (!botAccess || botAccess.length === 0) {
      console.log('[API GET /student/room-bots] No bot access found, creating them now');
      
      // First, get all bots in the room
      const { data: roomBots, error: rbError } = await supabaseAdmin
        .from('room_bots')
        .select(`
          bot_id,
          bots (
            id,
            name,
            description,
            model,
            type,
            welcome_message
          )
        `)
        .eq('room_id', roomId);

      if (rbError || !roomBots || roomBots.length === 0) {
        console.warn('[API GET /student/room-bots] No bots found for room:', roomId);
        return NextResponse.json({ bots: [] });
      }
      
      // Create access for each bot
      const accessData = roomBots.map(rb => ({
        student_id: studentId,
        bot_id: rb.bot_id,
        room_id: roomId
      }));
      
      const { data: newAccess, error: createError } = await supabaseAdmin
        .from('student_bot_access')
        .upsert(accessData, { onConflict: 'student_id,bot_id,room_id' })
        .select(`
          id,
          bot_id,
          bots (
            id,
            name,
            description,
            model,
            type,
            welcome_message
          )
        `);
        
      if (createError) {
        console.error('[API GET /student/room-bots] Error creating bot access:', createError);
        return NextResponse.json({ error: 'Error creating student bot access' }, { status: 500 });
      }
      
      // Format the response to match the expected structure
      const formattedBots = (newAccess || []).map(access => {
        const bot = access.bots as any; // Type assertion to avoid TypeScript errors
        return {
          access_id: access.id,
          bot_id: access.bot_id,
          name: bot?.name || 'Unknown Bot',
          description: bot?.description || '',
          model: bot?.model,
          type: bot?.type,
          welcome_message: bot?.welcome_message
        };
      });
      
      return NextResponse.json({ 
        bots: formattedBots,
        roomName: room.name
      });
    }
    
    // Format the response with access
    const formattedBots = botAccess.map(access => {
      const bot = access.bots as any; // Type assertion to avoid TypeScript errors
      return {
        access_id: access.id, 
        bot_id: access.bot_id,
        name: bot?.name || 'Unknown Bot',
        description: bot?.description || '',
        model: bot?.model,
        type: bot?.type,
        welcome_message: bot?.welcome_message
      };
    });

    return NextResponse.json({ 
      bots: formattedBots,
      roomName: room.name
    });
  } catch (error) {
    console.error('[API GET /student/room-bots] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}