// src/app/api/room/direct-access/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createErrorResponse, createSuccessResponse, handleApiError, ErrorCodes } from '@/lib/utils/api-responses';

export async function GET(request: NextRequest) {
  try {
    // Get parameters from query string
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const studentId = searchParams.get('studentId');

    // Validate required parameters
    if (!roomId || !studentId) {
      return createErrorResponse(
        'Missing required parameters: roomId and studentId are required',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Use admin client to bypass RLS
    const supabaseAdmin = createAdminClient();

    // Verify student exists
    const { data: studentProfile, error: studentError } = await supabaseAdmin
      .from('students')
      .select('student_id, auth_user_id, first_name, surname')
      .eq('auth_user_id', studentId)
      .single();

    if (studentError || !studentProfile) {
      console.error('[API GET /room/direct-access] Student not found:', studentId);
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Verify the room exists
    const { data: room, error: roomError } = await supabaseAdmin
      .from('rooms')
      .select('room_id, room_name, room_code, is_active')
      .eq('room_id', roomId)
      .single();

    if (roomError || !room) {
      console.error('[API GET /room/direct-access] Room not found:', roomId);
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (!room.is_active) {
      return NextResponse.json({ error: 'Room is not active' }, { status: 403 });
    }

    // Check for membership
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('room_members')
      .select('room_id')
      .eq('room_id', roomId)
      .eq('student_id', studentId)
      .single();

    // If not a member, deny access - teachers must add students
    if (!membership || membershipError) {
      console.error('[API GET /room/direct-access] Student not a member of room');
      return NextResponse.json(
        { error: 'Student is not a member of this room. Please ask your teacher to add you.' },
        { status: 403 }
      );
    }

    // Get room chatbots
    const { data: chatbots, error: chatbotsError } = await supabaseAdmin
      .from('room_chatbots')
      .select(`
        chatbots (
          chatbot_id,
          name,
          description,
          bot_type
        )
      `)
      .eq('room_id', roomId);

    if (chatbotsError) {
      console.error('[API GET /room/direct-access] Error fetching chatbots:', chatbotsError);
    }

    // Extract chatbot data from the join result
    const roomChatbots = chatbots
      ? chatbots
          .map((item) => item.chatbots)
          .filter((chatbot) => chatbot !== null)
      : [];

    // Return room details with access confirmation
    return NextResponse.json({
      success: true,
      room: {
        room_id: room.room_id,
        room_name: room.room_name,
        room_code: room.room_code
      },
      student: {
        user_id: studentProfile.auth_user_id,
        full_name: `${studentProfile.first_name} ${studentProfile.surname}`.trim()
      },
      chatbots: roomChatbots,
      membership_status: 'existing'
    });
  } catch (error) {
    console.error('[API GET /room/direct-access] General error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown server error' },
      { status: 500 }
    );
  }
}