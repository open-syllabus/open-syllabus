import { NextRequest, NextResponse } from 'next/server';
import { authenticateTeacher, hasSchoolAssigned } from '@/lib/supabase/teacher-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Authenticate teacher
    const authResult = await authenticateTeacher();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user, profile: teacherProfile } = authResult;
    
    if (!hasSchoolAssigned(teacherProfile)) {
      return NextResponse.json({ error: 'No school assigned' }, { status: 400 });
    }

    const body = await request.json();
    const { roomId, studentIds } = body;

    if (!roomId || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ 
        error: 'Room ID and student IDs are required' 
      }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminClient();

    // Verify teacher owns the room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('room_id')
      .eq('room_id', roomId)
      .eq('teacher_id', user.id)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ 
        error: 'Room not found or unauthorized' 
      }, { status: 404 });
    }

    // Verify all students belong to the teacher's school
    const { data: students, error: studentsError } = await adminSupabase
      .from('students')
      .select('student_id')
      .in('student_id', studentIds)
      .eq('school_id', teacherProfile.school_id);

    if (studentsError) {
      console.error('Error verifying students:', studentsError);
      return NextResponse.json({ 
        error: 'Failed to verify students' 
      }, { status: 500 });
    }

    if (!students || students.length !== studentIds.length) {
      return NextResponse.json({ 
        error: 'Some students not found or not in your school' 
      }, { status: 400 });
    }

    // Prepare room membership data
    const memberships = studentIds.map(studentId => ({
      room_id: roomId,
      student_id: studentId,
      joined_at: new Date().toISOString(),
      is_active: true
    }));

    // Insert room memberships (upsert to handle duplicates)
    const { error: insertError } = await adminSupabase
      .from('room_members')
      .upsert(memberships, {
        onConflict: 'room_id,student_id',
        ignoreDuplicates: true
      });

    if (insertError) {
      console.error('Error adding students to room:', insertError);
      return NextResponse.json({ 
        error: 'Failed to add students to room' 
      }, { status: 500 });
    }

    // Create student_chatbot_instances for all chatbots in this room
    const { data: roomChatbots, error: chatbotsError } = await adminSupabase
      .from('room_chatbots')
      .select(`
        chatbot_id,
        chatbots (
          chatbot_id,
          is_archived
        )
      `)
      .eq('room_id', roomId);
    
    if (!chatbotsError && roomChatbots && roomChatbots.length > 0) {
      // Filter out archived chatbots
      const activeChatbots = roomChatbots.filter(rc => {
        const chatbot = rc.chatbots as any;
        return chatbot && !chatbot.is_archived;
      });
      
      if (activeChatbots.length > 0) {
        // Create instances for all students and all active chatbots
        const instancesToCreate = [];
        for (const studentId of studentIds) {
          for (const rc of activeChatbots) {
            instancesToCreate.push({
              student_id: studentId,
              chatbot_id: rc.chatbot_id,
              room_id: roomId
            });
          }
        }
        
        // Use upsert to handle duplicates
        const { error: instancesError } = await adminSupabase
          .from('student_chatbot_instances')
          .upsert(instancesToCreate, {
            onConflict: 'student_id,chatbot_id,room_id',
            ignoreDuplicates: true
          });
        
        if (instancesError) {
          console.error('Error creating chatbot instances:', instancesError);
          // Continue - students have been added to room, just couldn't create instances
        } else {
          console.log(`Created ${instancesToCreate.length} chatbot instances`);
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `${studentIds.length} students added to room`
    });

  } catch (error) {
    console.error('Error in room assignment:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}