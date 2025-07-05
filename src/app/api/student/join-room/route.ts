// src/app/api/student/join-room/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { room_code, student_id } = body;

    console.log('[Join Room API] Request received:', { room_code, student_id });

    if (!room_code || !student_id) {
      console.error('[Join Room API] Missing required fields');
      return NextResponse.json(
        { error: 'Room code and student ID are required' },
        { status: 400 }
      );
    }
    
    // Validate student_id is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(student_id)) {
      console.error('[Join Room API] Invalid student ID format:', student_id);
      return NextResponse.json(
        { error: 'Invalid student ID format' },
        { status: 400 }
      );
    }

    // Normalize room code to uppercase and remove any spaces
    const normalizedCode = room_code.toUpperCase().trim();

    // Use admin client to bypass RLS for room lookup
    const adminSupabase = createAdminClient();

    // Find the room by code
    const { data: room, error: roomError } = await adminSupabase
      .from('rooms')
      .select('room_id, room_name, teacher_id')
      .eq('room_code', normalizedCode)
      .eq('is_active', true)
      .single();

    if (roomError) {
      console.error('[Join Room API] Room lookup error:', roomError);
      return NextResponse.json(
        { error: 'Invalid room code' },
        { status: 404 }
      );
    }

    if (!room) {
      console.error('[Join Room API] Room not found for code:', normalizedCode);
      return NextResponse.json(
        { error: 'Invalid room code' },
        { status: 404 }
      );
    }

    console.log('[Join Room API] Room found:', room.room_id);

    // Verify the student exists - try by student_id first, then by auth_user_id
    let student;
    let studentError;
    
    // First try to find by student_id
    const studentByIdResult = await adminSupabase
      .from('students')
      .select('student_id, school_id, auth_user_id')
      .eq('student_id', student_id)
      .single();
    
    if (!studentByIdResult.error && studentByIdResult.data) {
      student = studentByIdResult.data;
      console.log('[Join Room API] Student found by student_id:', student.student_id);
    } else {
      // If not found by student_id, try by auth_user_id
      console.log('[Join Room API] Not found by student_id, trying auth_user_id...');
      const studentByAuthResult = await adminSupabase
        .from('students')
        .select('student_id, school_id, auth_user_id')
        .eq('auth_user_id', student_id)
        .single();
      
      if (!studentByAuthResult.error && studentByAuthResult.data) {
        student = studentByAuthResult.data;
        console.log('[Join Room API] Student found by auth_user_id:', student.student_id);
      } else {
        studentError = studentByAuthResult.error || studentByIdResult.error;
      }
    }

    if (studentError || !student) {
      console.error('[Join Room API] Student lookup error:', studentError);
      console.error('[Join Room API] Provided ID:', student_id);
      return NextResponse.json(
        { error: 'Invalid student ID' },
        { status: 404 }
      );
    }

    console.log('[Join Room API] Using student:', { 
      student_id: student.student_id,
      auth_user_id: student.auth_user_id 
    });

    // Check if student is already in the room
    const { data: existingMember } = await adminSupabase
      .from('room_members')
      .select('room_id')
      .eq('room_id', room.room_id)
      .eq('student_id', student.student_id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this room' },
        { status: 400 }
      );
    }

    // Add student to room
    const { error: insertError } = await adminSupabase
      .from('room_members')
      .insert({
        room_id: room.room_id,
        student_id: student.student_id,
        joined_at: new Date().toISOString(),
        is_active: true
      });

    if (insertError) {
      console.error('[Join Room API] Insert error:', insertError);
      console.error('[Join Room API] Insert details:', {
        room_id: room.room_id,
        student_id: student.student_id,
        provided_id: student_id,
        error_code: insertError.code,
        error_details: insertError.details,
        error_message: insertError.message,
        error_hint: insertError.hint
      });
      
      // Check if it's a foreign key constraint error
      if (insertError.code === '23503') {
        if (insertError.message.includes('student_id')) {
          return NextResponse.json(
            { error: 'Student not found in the system' },
            { status: 400 }
          );
        }
        if (insertError.message.includes('room_id')) {
          return NextResponse.json(
            { error: 'Room not found' },
            { status: 400 }
          );
        }
      }
      
      return NextResponse.json(
        { error: 'Failed to join room' },
        { status: 500 }
      );
    }

    console.log('[Join Room API] Successfully added student to room');
    
    // Create student_chatbot_instances for all chatbots in this room
    const { data: roomChatbots, error: chatbotsError } = await adminSupabase
      .from('room_chatbots')
      .select(`
        chatbot_id,
        chatbots (
          chatbot_id,
          name,
          is_archived
        )
      `)
      .eq('room_id', room.room_id);
    
    if (chatbotsError) {
      console.error('[Join Room API] Error fetching room chatbots:', chatbotsError);
      // Continue - student has joined the room, just couldn't create instances
    } else if (roomChatbots && roomChatbots.length > 0) {
      console.log(`[Join Room API] Found ${roomChatbots.length} chatbots in room`);
      
      // Filter out archived chatbots
      const activeChatbots = roomChatbots.filter(rc => {
        const chatbot = rc.chatbots as any;
        return chatbot && !chatbot.is_archived;
      });
      
      if (activeChatbots.length > 0) {
        // Create instances for all active chatbots
        const instancesToCreate = activeChatbots.map(rc => ({
          student_id: student.student_id,
          chatbot_id: rc.chatbot_id,
          room_id: room.room_id
        }));
        
        const { error: instancesError } = await adminSupabase
          .from('student_chatbot_instances')
          .insert(instancesToCreate);
        
        if (instancesError) {
          console.error('[Join Room API] Error creating chatbot instances:', instancesError);
          // Continue - student has joined the room, just couldn't create instances
        } else {
          console.log(`[Join Room API] Created ${instancesToCreate.length} chatbot instances for student`);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      room_id: room.room_id,
      room_name: room.room_name
    });

  } catch (error) {
    console.error('[Join Room API] Unexpected error:', error);
    if (error instanceof Error) {
      console.error('[Join Room API] Error details:', error.message, error.stack);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}