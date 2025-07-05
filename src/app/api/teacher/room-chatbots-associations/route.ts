// src/app/api/teacher/room-chatbots-associations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { UpdateRoomChatbotsPayload } from '@/types/database.types';
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limiter/simple-wrapper';

// GET current chatbots for a room
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');

  if (!roomId) {
    return NextResponse.json({ error: 'Room ID query parameter is required' }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('room_id')
      .eq('room_id', roomId)
      .eq('teacher_id', user.id)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found or unauthorized' }, { status: 404 });
    }

    // Use admin client to bypass RLS
    const adminSupabase = createAdminClient();
    
    const { data: roomChatbots, error } = await adminSupabase
      .from('room_chatbots')
      .select('chatbot_id') 
      .eq('room_id', roomId);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch room chatbots' }, { status: 500 });
    }
    
    return NextResponse.json(roomChatbots || []); 

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error fetching room chatbots' },
      { status: 500 }
    );
  }
}

// POST (add) a single chatbot to a room
export async function POST(request: NextRequest) {
  console.log('=== ASSOCIATION ENDPOINT START ===');
  
  try {
    // Apply rate limiting
    const rateLimitResult = await checkRateLimit(request, RateLimitPresets.api);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }
    
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    console.log('Authenticated user:', user.id);

    const body = await request.json();
    console.log('Request body:', JSON.stringify(body));
    const { room_id, chatbot_id } = body;

    if (!room_id || !chatbot_id) {
      console.error('Missing required fields:', { room_id, chatbot_id });
      return NextResponse.json({ error: 'Both room_id and chatbot_id are required' }, { status: 400 });
    }

    // Verify the teacher owns the room
    console.log('Checking room ownership for room:', room_id);
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('room_id')
      .eq('room_id', room_id)
      .eq('teacher_id', user.id)
      .single();

    if (roomError || !room) {
      console.error('Room check failed:', roomError);
      console.error('Room data:', room);
      return NextResponse.json({ error: 'Room not found or unauthorized' }, { status: 404 });
    }
    
    console.log('Room ownership verified');

    // Use admin client to bypass RLS for room_chatbots table
    const adminSupabase = createAdminClient();

    // Check if the association already exists
    const { data: existing, error: checkError } = await adminSupabase
      .from('room_chatbots')
      .select('room_id, chatbot_id')
      .eq('room_id', room_id)
      .eq('chatbot_id', chatbot_id)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, message: 'Chatbot already associated with room' });
    }

    // Add the new association using admin client
    console.log('Inserting association with admin client...');
    const insertData = {
      room_id: room_id,
      chatbot_id: chatbot_id,
    };
    console.log('Insert data:', JSON.stringify(insertData));
    
    const { data: insertedData, error: insertError } = await adminSupabase
      .from('room_chatbots')
      .insert(insertData)
      .select();

    if (insertError) {
      console.error('=== INSERT ERROR ===');
      console.error('Error code:', insertError.code);
      console.error('Error message:', insertError.message);
      console.error('Error details:', insertError.details);
      console.error('Error hint:', insertError.hint);
      
      // Check if it's a trigger error
      if (insertError.message && insertError.message.includes('trigger')) {
        console.error('TRIGGER ERROR DETECTED!');
        console.error('This is likely the create_chatbot_instances_for_new_room_chatbot_trigger failing');
      }
      
      return NextResponse.json({ 
        error: 'Failed to associate chatbot with room', 
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint 
      }, { status: 500 });
    }
    
    console.log('=== INSERT SUCCESS ===');
    console.log('Inserted data:', insertedData);

    // Create student_chatbot_instances for all students in this room
    // (in case the database trigger fails)
    try {
      const { data: roomMembers, error: membersError } = await adminSupabase
        .from('room_members')
        .select('student_id')
        .eq('room_id', room_id)
        .eq('is_active', true);
      
      if (!membersError && roomMembers && roomMembers.length > 0) {
        const instancesToCreate = roomMembers.map(member => ({
          student_id: member.student_id,
          chatbot_id: chatbot_id,
          room_id: room_id
        }));
        
        const { error: instancesError } = await adminSupabase
          .from('student_chatbot_instances')
          .upsert(instancesToCreate, {
            onConflict: 'student_id,chatbot_id,room_id',
            ignoreDuplicates: true
          });
        
        if (instancesError) {
          console.error('Error creating chatbot instances:', instancesError);
          // Continue - chatbot has been added to room
        } else {
          console.log(`Created ${instancesToCreate.length} student chatbot instances`);
        }
      }
    } catch (instanceError) {
      console.error('Error in instance creation:', instanceError);
      // Continue - not critical
    }

    return NextResponse.json({ success: true, message: 'Chatbot successfully added to room', data: insertedData });

  } catch (error) {
    const typedError = error as Error;
    return NextResponse.json(
      { error: typedError.message || 'Failed to add chatbot to room' },
      { status: 500 }
    );
  }
}

// PUT (update) chatbots for a room
export async function PUT(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await checkRateLimit(request, RateLimitPresets.api);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }
  
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');

  if (!roomId) {
    return NextResponse.json({ error: 'Room ID query parameter is required for PUT' }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body: UpdateRoomChatbotsPayload = await request.json();

    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('room_id')
      .eq('room_id', roomId)
      .eq('teacher_id', user.id)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found or unauthorized' }, { status: 404 });
    }

    // Use admin client to bypass RLS
    const adminSupabase = createAdminClient();

    // Perform in a transaction if Supabase JS client supported it easily,
    // otherwise, it's two separate operations.
    const { error: deleteError } = await adminSupabase
      .from('room_chatbots')
      .delete()
      .eq('room_id', roomId);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to clear existing chatbots for room', details: deleteError.message }, { status: 500 });
    }

    if (body.chatbot_ids && body.chatbot_ids.length > 0) {
      const newEntries = body.chatbot_ids.map(chatbotId => ({
        room_id: roomId,
        chatbot_id: chatbotId,
      }));
      const { error: insertError } = await adminSupabase
        .from('room_chatbots')
        .insert(newEntries);

      if (insertError) {
        return NextResponse.json({ error: 'Failed to insert new chatbots for room', details: insertError.message }, { status: 500 });
      }
      
      // Create student_chatbot_instances for all students and new chatbots
      try {
        const { data: roomMembers, error: membersError } = await adminSupabase
          .from('room_members')
          .select('student_id')
          .eq('room_id', roomId)
          .eq('is_active', true);
        
        if (!membersError && roomMembers && roomMembers.length > 0) {
          const instancesToCreate = [];
          for (const member of roomMembers) {
            for (const chatbotId of body.chatbot_ids) {
              instancesToCreate.push({
                student_id: member.student_id,
                chatbot_id: chatbotId,
                room_id: roomId
              });
            }
          }
          
          const { error: instancesError } = await adminSupabase
            .from('student_chatbot_instances')
            .upsert(instancesToCreate, {
              onConflict: 'student_id,chatbot_id,room_id',
              ignoreDuplicates: true
            });
          
          if (instancesError) {
            console.error('Error creating chatbot instances:', instancesError);
            // Continue - chatbots have been added to room
          } else {
            console.log(`Created ${instancesToCreate.length} student chatbot instances`);
          }
        }
      } catch (instanceError) {
        console.error('Error in instance creation:', instanceError);
        // Continue - not critical
      }
    }
    
    return NextResponse.json({ success: true, message: 'Room chatbots updated successfully' });

  } catch (error) {
    const typedError = error as Error;
    if (typedError instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON payload in PUT request.' }, { status: 400 });
    }
    return NextResponse.json(
      { error: typedError.message || 'Failed to update room chatbots' },
      { status: 500 }
    );
  }
}