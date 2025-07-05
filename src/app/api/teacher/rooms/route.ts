// src/app/api/teacher/rooms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateRoomCode } from '@/lib/utils/room-codes';
import { z } from 'zod';
import { safeNameSchema, uuidSchema } from '@/lib/validation/schemas';
import type { TeacherRoom } from '@/types/database.types';
import type { PostgrestError } from '@supabase/supabase-js'; // Import for better error typing
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limiter/simple-wrapper';
// import { withCSRFProtection } from '@/lib/csrf/protection';

// Define the schema for creating a room
const createRoomPayloadSchema = z.object({
  room_name: safeNameSchema,
  chatbot_ids: z.array(uuidSchema).optional(),
  course_ids: z.array(uuidSchema).optional()
});

// Infer the type from the schema
type CreateRoomPayload = z.infer<typeof createRoomPayloadSchema>;

// GET all rooms for the teacher
export async function GET(request: NextRequest) {
  console.log('[API GET /rooms] Received request.');
  try {
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const archivedOnly = searchParams.get('archivedOnly') === 'true';
    
    console.log(`[API GET /rooms] Query params: includeArchived=${includeArchived}, archivedOnly=${archivedOnly}`);
    
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('[API GET /rooms] Not authenticated or authError from getUser:', authError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    console.log('[API GET /rooms] User authenticated by getUser:', {
        id: user.id,
        email: user.email,
        aud: user.aud,
        role: user.role
    });

    console.log('[API GET /rooms] Attempting to fetch teacher profile for user_id:', user.id);
    const { data: profile, error: profileError } = await supabase
      .from('teacher_profiles')
      .select('user_id, school_id')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('[API GET /rooms] PROFILE FETCH ERROR OBJECT:', JSON.stringify(profileError, null, 2));
      console.warn('[API GET /rooms] Teacher profile fetch failed for user:', user.id, 'Error message:', profileError.message);
      return NextResponse.json({ error: `Teacher profile not found or error fetching it. Details: ${profileError.message}` }, { status: 403 });
    }

    if (!profile) {
      console.warn('[API GET /rooms] Teacher profile data is null (but no error reported by Supabase) for user:', user.id);
      return NextResponse.json({ error: 'Teacher profile not found (no data returned but no DB error).' }, { status: 403 });
    }

    console.log('[API GET /rooms] Teacher profile fetched successfully:', profile);

    console.log('[API GET /rooms] User is confirmed teacher. Fetching rooms.');
    
    // Use the admin client to bypass RLS policy issues completely
    const supabaseAdmin = createAdminClient();
    
    // Get basic room data first, bypassing RLS completely
    let query = supabaseAdmin
      .from('rooms')
      .select(`
        *,
        room_members!left (
          student_id
        )
      `)
      .eq('teacher_id', user.id);
      
    // Apply archive filtering based on query parameters
    if (archivedOnly) {
      query = query.eq('is_archived', true);
    } else if (!includeArchived) {
      query = query.eq('is_archived', false);
    }
    
    // Always order by creation date
    query = query.order('created_at', { ascending: false });
    
    const { data: rooms, error: fetchError } = await query;

    if (fetchError) {
      console.error('[API GET /rooms] Error fetching rooms from DB:', fetchError);
      throw fetchError;
    }
    
    // Calculate student count for each room
    if (rooms) {
      rooms.forEach(room => {
        const memberships = room.room_members || [];
        room.student_count = memberships.length;
        // Remove the raw memberships data to keep response clean
        delete room.room_members;
      });
    }
    
    // Now fetch associated chatbots separately, also bypassing RLS
    if (rooms && rooms.length > 0) {
      const roomIds = rooms.map(room => room.room_id);
      
      // Get chatbot associations, also using admin client
      const { data: roomChatbots, error: chatbotError } = await supabaseAdmin
        .from('room_chatbots')
        .select(`
          room_id,
          chatbot_id,
          chatbots (chatbot_id, name)
        `)
        .in('room_id', roomIds);
        
      if (chatbotError) {
        console.error('[API GET /rooms] Error fetching room chatbots:', chatbotError);
        // Continue despite error - we'll return rooms without chatbot data
      } else if (roomChatbots) {
        // Manually structure the data to match the previous nested query result
        rooms.forEach(room => {
          const chatbotsForRoom = roomChatbots.filter(rc => rc.room_id === room.room_id);
          room.room_chatbots = chatbotsForRoom;
        });
      }

      // Get course associations
      const { data: roomCourses, error: courseError } = await supabaseAdmin
        .from('room_courses')
        .select(`
          room_id,
          course_id,
          courses (course_id, title)
        `)
        .in('room_id', roomIds);
        
      if (courseError) {
        console.error('[API GET /rooms] Error fetching room courses:', courseError);
        // Continue despite error - we'll return rooms without course data
      } else if (roomCourses) {
        // Manually structure the data to match the nested query result
        rooms.forEach(room => {
          const coursesForRoom = roomCourses.filter(rc => rc.room_id === room.room_id);
          room.room_courses = coursesForRoom;
        });
      }
    }
    
    console.log(`[API GET /rooms] Successfully fetched ${rooms?.length || 0} rooms.`);
    return NextResponse.json(rooms || []);

  } catch (error) {
    // Attempt to type error as PostgrestError or a generic Error
    const typedError = error as PostgrestError | Error;
    let code: string | undefined;
    let details: string | undefined;
    let hint: string | undefined;

    if ('code' in typedError && typeof typedError.code === 'string') {
        code = typedError.code;
    }
    if ('details' in typedError && typeof typedError.details === 'string') {
        details = typedError.details;
    }
     if ('hint' in typedError && typeof typedError.hint === 'string') {
        hint = typedError.hint;
    }

    console.error('[API GET /rooms] CATCH BLOCK Error:',
        typedError.message,
        'Code:', code,
        'Details:', details,
        'Hint:', hint
    );
    return NextResponse.json(
      { error: typedError.message || 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}

// POST a new room - V-ROBUST Version
export async function POST(request: NextRequest) {
  console.log('[API POST /rooms] V-ROBUST Received request.');
  try {
    // Apply rate limiting
    const rateLimitResult = await checkRateLimit(request, RateLimitPresets.api);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }
    const supabase = await createServerSupabaseClient();
    const supabaseAdmin = createAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('[API POST /rooms] V-ROBUST - Not authenticated');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    console.log('[API POST /rooms] V-ROBUST - User authenticated:', user.id);

    const { data: profile, error: profileFetchError } = await supabase
      .from('teacher_profiles')
      .select('user_id, school_id')
      .eq('user_id', user.id)
      .single();

    if (profileFetchError || !profile) {
        console.error('[API POST /rooms] V-ROBUST - Profile fetch error or no profile:', profileFetchError);
        return NextResponse.json({ error: 'Profile error or profile not found while creating room.' }, { status: 500 });
    }
    console.log('[API POST /rooms] V-ROBUST - Profile fetched:', profile);

    const rawBody = await request.json();
    console.log('[API POST /rooms] V-ROBUST - Raw request body:', rawBody);

    // Validate the request body using Zod
    const validationResult = createRoomPayloadSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      console.warn('[API POST /rooms] V-ROBUST - Invalid request body:', validationResult.error.errors);
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.errors 
        }, 
        { status: 400 }
      );
    }

    const body: CreateRoomPayload = validationResult.data;
    console.log('[API POST /rooms] V-ROBUST - Validated request body:', body);

    let roomCode = '';
    let attempts = 0;
    const MAX_ATTEMPTS = 10;
    let newRoomData = null;

    console.log('[API POST /rooms] V-ROBUST - Attempting to generate unique room code and insert...');
    while (attempts < MAX_ATTEMPTS && !newRoomData) {
      roomCode = generateRoomCode();
      attempts++;
      console.log(`[API POST /rooms] V-ROBUST - Attempt #${attempts} with roomCode: ${roomCode}`);

      const { data, error: insertError } = await supabase
        .from('rooms')
        .insert({
          room_name: body.room_name,
          room_code: roomCode,
          teacher_id: user.id,
          school_id: profile.school_id,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) {
        // insertError should be PostgrestError if it's a Supabase/PostgREST error
        if (insertError.code === '23505' && insertError.message.includes('rooms_room_code_key')) {
          console.warn(`[API POST /rooms] V-ROBUST - Room code ${roomCode} collision on attempt #${attempts}. Retrying...`);
          if (attempts >= MAX_ATTEMPTS) {
            console.error('[API POST /rooms] V-ROBUST - Failed to generate unique room code after multiple insert attempts.');
            throw new Error('Failed to generate a unique room code due to repeated collisions.');
          }
          // Continue to the next iteration of the loop to generate a new code
        } else {
          console.error('[API POST /rooms] V-ROBUST - Error inserting into "rooms" table (non-collision):', JSON.stringify(insertError, null, 2));
          throw insertError; // Throw this error to be caught by the outer catch block
        }
      } else {
        newRoomData = data;
        // Use non-null assertion because if data is not null, room_id should exist
        console.log(`[API POST /rooms] V-ROBUST - Room inserted successfully on attempt #${attempts}. Room ID: ${newRoomData!.room_id}`);
      }
    }

    if (!newRoomData) {
        console.error('[API POST /rooms] V-ROBUST - Could not create room after max attempts for room code generation.');
        throw new Error('Failed to create room after multiple attempts to find a unique room code.');
    }

    // Insert chatbot associations if any chatbots were selected
    if (body.chatbot_ids && Array.isArray(body.chatbot_ids) && body.chatbot_ids.length > 0) {
      console.log('[API POST /rooms] V-ROBUST - Preparing to insert into "room_chatbots" table for room ID:', newRoomData.room_id);
      const roomChatbotEntries = body.chatbot_ids.map(chatbotId => ({
        room_id: newRoomData!.room_id,
        chatbot_id: chatbotId,
      }));

      const { error: rcInsertError } = await supabaseAdmin
        .from('room_chatbots')
        .insert(roomChatbotEntries);

      if (rcInsertError) {
        console.error('[API POST /rooms] V-ROBUST - Error inserting into "room_chatbots":', rcInsertError);
        console.log(`[API POST /rooms] V-ROBUST - Attempting to rollback room creation for room ID: ${newRoomData!.room_id} due to room_chatbots insert failure.`);
        const { error: deleteError } = await supabaseAdmin.from('rooms').delete().eq('room_id', newRoomData!.room_id);
        if (deleteError) {
            console.error(`[API POST /rooms] V-ROBUST - CRITICAL: Failed to rollback room ${newRoomData!.room_id} after room_chatbots insert error:`, deleteError);
        } else {
            console.log(`[API POST /rooms] V-ROBUST - Successfully rolled back room ${newRoomData!.room_id}.`);
        }
        throw rcInsertError;
      }
      console.log(`[API POST /rooms] V-ROBUST - Successfully inserted ${roomChatbotEntries.length} entries into "room_chatbots".`);
    } else {
      console.log('[API POST /rooms] V-ROBUST - No chatbots selected, skipping room_chatbots insertion.');
    }

    // Insert course associations if any courses were selected
    if (body.course_ids && body.course_ids.length > 0) {
      console.log('[API POST /rooms] V-ROBUST - Preparing to insert into "room_courses" table for room ID:', newRoomData.room_id);
      const roomCourseEntries = body.course_ids.map(courseId => ({
        room_id: newRoomData!.room_id,
        course_id: courseId,
        assigned_by: user.id
      }));

      const { error: rcCourseInsertError } = await supabaseAdmin
        .from('room_courses')
        .insert(roomCourseEntries);

      if (rcCourseInsertError) {
        console.error('[API POST /rooms] V-ROBUST - Error inserting into "room_courses":', rcCourseInsertError);
        console.log(`[API POST /rooms] V-ROBUST - Attempting to rollback room creation for room ID: ${newRoomData!.room_id} due to room_courses insert failure.`);
        
        // Rollback room and chatbot entries
        const { error: deleteChatbotsError } = await supabaseAdmin.from('room_chatbots').delete().eq('room_id', newRoomData!.room_id);
        const { error: deleteRoomError } = await supabaseAdmin.from('rooms').delete().eq('room_id', newRoomData!.room_id);
        
        if (deleteChatbotsError || deleteRoomError) {
          console.error(`[API POST /rooms] V-ROBUST - CRITICAL: Failed to rollback room ${newRoomData!.room_id} after room_courses insert error:`, { deleteChatbotsError, deleteRoomError });
        } else {
          console.log(`[API POST /rooms] V-ROBUST - Successfully rolled back room ${newRoomData!.room_id}.`);
        }
        throw rcCourseInsertError;
      }
      console.log(`[API POST /rooms] V-ROBUST - Successfully inserted ${roomCourseEntries.length} entries into "room_courses".`);
    } else {
      console.log('[API POST /rooms] V-ROBUST - No courses selected, skipping room_courses insertion.');
    }

    console.log('[API POST /rooms] V-ROBUST - Fetching complete room data for response.');
    const { data: completeRoomData, error: fetchCompleteError } = await supabase
        .from('rooms')
        .select(`
            *,
            room_chatbots (
              chatbots ( chatbot_id, name )
            ),
            room_courses (
              courses ( course_id, title )
            )
        `)
        .eq('room_id', newRoomData!.room_id)
        .single();

    if (fetchCompleteError) {
        console.error('[API POST /rooms] V-ROBUST - Error fetching complete room data after creation:', fetchCompleteError);
        throw fetchCompleteError;
    }
    if (!completeRoomData) {
        console.error('[API POST /rooms] V-ROBUST - Failed to fetch complete room data after creation, though room should exist.');
        throw new Error('Failed to retrieve newly created room details.');
    }

    console.log('[API POST /rooms] V-ROBUST - Room creation successful. Returning complete room data.');
    return NextResponse.json({ room: completeRoomData as TeacherRoom }, { status: 201 });

  } catch (error) {
    // Type guard to check if error is a PostgrestError or at least has common error properties
    let code: string | undefined;
    let details: string | undefined;
    let hint: string | undefined;
    let constraint: string | undefined;
    let message = 'An unknown error occurred';

    if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
            message = error.message;
        }
        if ('code' in error && typeof error.code === 'string') {
            code = error.code;
        }
        if ('details' in error && typeof error.details === 'string') {
            details = error.details;
        }
        if ('hint' in error && typeof error.hint === 'string') {
            hint = error.hint;
        }
        if ('constraint' in error && typeof error.constraint === 'string') {
            constraint = error.constraint;
        }
    } else if (error instanceof Error) {
        message = error.message;
    }


    console.error('[API POST /rooms] V-ROBUST - CATCH BLOCK Error:',
        message,
        'Code:', code,
        'Details:', details,
        'Hint:', hint,
        'Constraint:', constraint
    );

    let statusCode = 500;
    if (code === '23505' && constraint === 'rooms_room_code_key') {
        statusCode = 409;
    } else if (code === '42501') {
        statusCode = 403;
    }

    return NextResponse.json(
      {
        error: message || 'Failed to create room',
        code: code,
        details: details,
        hint: hint
      },
      { status: statusCode }
    );
  }
}