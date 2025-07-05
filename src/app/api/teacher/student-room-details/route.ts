// src/app/api/teacher/student-room-details/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { StudentAssessment, FlaggedMessage } from '@/types/database.types';

// Simplified types for summaries
interface AssessmentSummaryForStudent extends Pick<StudentAssessment, 'assessment_id' | 'chatbot_id' | 'assessed_at' | 'ai_grade_raw' | 'teacher_override_grade' | 'status'> {
  chatbot_name?: string | null;
}

interface ConcernSummaryForStudent extends Pick<FlaggedMessage, 'flag_id' | 'concern_type' | 'concern_level' | 'created_at' | 'status'> {
  message_preview?: string | null;
}

interface StudentProfile {
  user_id: string;
  full_name: string;
  email?: string;
}

interface StudentRoomDetailsResponse {
  student: StudentProfile | null;
  assessments: AssessmentSummaryForStudent[];
  concerns: ConcernSummaryForStudent[];
  // We could add a flag like hasChatHistory: boolean;
}

export async function GET(request: NextRequest) {
  console.log('[API GET /teacher/student-room-details] Received request.');
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const studentId = searchParams.get('studentId');

    if (!roomId || !studentId) {
      console.warn('[API GET /student-room-details] roomId or studentId query parameter is missing.');
      return NextResponse.json({ error: 'Room ID and Student ID are required' }, { status: 400 });
    }
    console.log(`[API GET /student-room-details] Processing for roomId: ${roomId}, studentId: ${studentId}`);

    const supabase = await createServerSupabaseClient(); // User-context client
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('[API GET /student-room-details] Not authenticated:', authError?.message);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify teacher role
    const { data: teacherProfile, error: teacherProfileError } = await supabase
      .from('teacher_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (teacherProfileError || !teacherProfile) {
      console.warn(`[API GET /student-room-details] User ${user.id} not a teacher or profile error.`);
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    console.log(`[API GET /student-room-details] User ${user.id} authenticated as teacher.`);

    // Verify teacher owns the room
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('room_id')
      .eq('room_id', roomId)
      .eq('teacher_id', user.id)
      .single();

    if (roomError || !roomData) {
      console.warn(`[API GET /student-room-details] Room ${roomId} not found or teacher ${user.id} not authorized:`, roomError?.message);
      return NextResponse.json({ error: 'Room not found or unauthorized' }, { status: 404 });
    }

    // Verify student is a member of this room - check both tables for compatibility
    let isMember = false;
    
    // First check room_members table
    const { data: membershipNew, error: membershipNewError } = await supabase
      .from('room_members')
      .select('student_id')
      .eq('room_id', roomId)
      .eq('student_id', studentId)
      .single();
      
    if (membershipNew && !membershipNewError) {
      isMember = true;
    } else {
      // Fallback: check room_members table (legacy)
      const { data: membershipOld, error: membershipOldError } = await supabase
        .from('room_members')
        .select('student_id')
        .eq('room_id', roomId)
        .eq('student_id', studentId)
        .single();
        
      if (membershipOld && !membershipOldError) {
        isMember = true;
      }
    }

    if (!isMember) {
      console.warn(`[API GET /student-room-details] Student ${studentId} is not a member of room ${roomId} in either table`);
      return NextResponse.json({ error: 'Student not found in this room' }, { status: 404 });
    }
    console.log(`[API GET /student-room-details] Verified teacher ownership and student membership for room ${roomId}, student ${studentId}.`);

    const adminSupabase = createAdminClient();

    // Fetch student data from the students table
    let studentData = null;
    
    try {
      // Fetch student details from the students table
      const { data, error } = await adminSupabase
        .from('students')
        .select('auth_user_id, first_name, surname')
        .eq('student_id', studentId)
        .single();
        
      if (error) {
        console.error(`[API GET /student-room-details] Error fetching student ${studentId}:`, error);
      } else if (data) {
        studentData = data;
      }
    } catch (error) {
      console.error(`[API GET /student-room-details] Error in student fetch:`, error);
    }
    
    // Create a profile object with the student data
    const studentInfo: StudentProfile = studentData 
        ? { 
            user_id: studentData.auth_user_id, 
            full_name: `${studentData.first_name} ${studentData.surname}`.trim() || 'Student'
          } 
        : { 
            user_id: studentId, 
            full_name: 'Unknown Student'
          };

    // Fetch assessments for this student in this room (limit for summary, e.g., last 10)
    // Re-using the foreign key hint strategy from the main assessments list API
    const chatbotForeignKeyHint = "!student_assessments_chatbot_id_fkey";
    const { data: assessmentsData, error: assessmentsError } = await adminSupabase
      .from('student_assessments')
      .select(`
        assessment_id,
        chatbot_id,
        assessed_at,
        ai_grade_raw,
        teacher_override_grade,
        status,
        chatbot:chatbots${chatbotForeignKeyHint}!inner(name)
      `)
      .eq('student_id', studentId)
      .eq('room_id', roomId) // Filter by room
      .eq('teacher_id', user.id) // And ensure teacher owns the assessment bot
      .order('assessed_at', { ascending: false })
      .limit(10); // Example limit

    if (assessmentsError) {
      console.error(`[API GET /student-room-details] Error fetching assessments for student ${studentId} in room ${roomId}:`, assessmentsError.message);
    }
    const assessments: AssessmentSummaryForStudent[] = (assessmentsData || []).map(item => {
        const chatbotData = item.chatbot as { name?: string | null } | null; // Type assertion
        return {
            assessment_id: item.assessment_id,
            chatbot_id: item.chatbot_id,
            assessed_at: item.assessed_at,
            ai_grade_raw: item.ai_grade_raw,
            teacher_override_grade: item.teacher_override_grade,
            status: item.status,
            chatbot_name: chatbotData?.name || 'N/A'
        };
    });
    console.log(`[API GET /student-room-details] Fetched ${assessments.length} assessments for student ${studentId} in room ${roomId}.`);

    // Fetch flagged concerns for this student in this room (limit for summary)
    const { data: concernsData, error: concernsError } = await adminSupabase
      .from('flagged_messages')
      .select('flag_id, concern_type, concern_level, created_at, status, message:chat_messages!fk_message(content)') // Include message content for preview
      .eq('student_id', studentId)
      .eq('room_id', roomId) // Filter by room
      .eq('teacher_id', user.id) // Ensure teacher owns the concern record
      .order('created_at', { ascending: false })
      .limit(10); // Example limit

    if (concernsError) {
      console.error(`[API GET /student-room-details] Error fetching concerns for student ${studentId} in room ${roomId}:`, concernsError.message);
    }
    const concerns: ConcernSummaryForStudent[] = (concernsData || []).map(item => {
        const messageData = item.message as { content?: string | null } | null; // Type assertion
        return {
            flag_id: item.flag_id,
            concern_type: item.concern_type,
            concern_level: item.concern_level,
            created_at: item.created_at,
            status: item.status,
            message_preview: messageData?.content?.substring(0, 50) + (messageData?.content && messageData.content.length > 50 ? '...' : '') || null
        };
    });
    console.log(`[API GET /student-room-details] Fetched ${concerns.length} concerns for student ${studentId} in room ${roomId}.`);

    const responsePayload: StudentRoomDetailsResponse = {
      student: studentInfo,
      assessments,
      concerns,
    };

    console.log(`[API GET /student-room-details] Successfully prepared data. Returning response.`);
    return NextResponse.json(responsePayload);

  } catch (error) {
    const typedError = error as Error & { code?: string; details?: string };
    console.error('[API GET /student-room-details] CATCH BLOCK Error:', typedError.message, 'Code:', typedError.code, 'Details:', typedError.details);
    return NextResponse.json(
      { error: typedError.message || 'Failed to fetch student room details' },
      { status: 500 }
    );
  }
}