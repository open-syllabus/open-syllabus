// src/app/api/teacher/room-details/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin'; // For fetching student profiles

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: teacherProfile, error: profileError } = await supabase
      .from('teacher_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !teacherProfile) {
      return NextResponse.json({ error: 'Not authorized (user is not a teacher)' }, { status: 403 });
    }

    // Fetch room details and verify ownership
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*') // Select all room fields
      .eq('room_id', roomId)
      .eq('teacher_id', user.id) // RLS also enforces this, but explicit check is good
      .single();

    if (roomError || !roomData) {
      return NextResponse.json({ error: 'Room not found or unauthorized' }, { status: 404 });
    }

    // Create admin client to bypass RLS
    const adminSupabase = createAdminClient();
    
    // Fetch assigned chatbots - First get the associations
    const { data: roomChatbotsData, error: roomChatbotsError } = await adminSupabase
      .from('room_chatbots')
      .select('chatbot_id')
      .eq('room_id', roomId);

    // Silently handle errors - associations might not exist yet
    
    // Now fetch the chatbot details if we have associations
    let assignedChatbots: any[] = [];
    if (roomChatbotsData && roomChatbotsData.length > 0) {
      const chatbotIds = roomChatbotsData.map(rc => rc.chatbot_id);
      
      const { data: chatbotsData, error: chatbotsError } = await adminSupabase
        .from('chatbots')
        .select('chatbot_id, name, description, bot_type, is_archived, enable_rag, model, teacher_id, system_prompt, created_at, updated_at, temperature, max_tokens')
        .in('chatbot_id', chatbotIds);
      
      if (!chatbotsError && chatbotsData) {
        assignedChatbots = chatbotsData;
      }
    }

    // Fetch assigned courses from room_courses relationship table
    const { data: roomCoursesData, error: roomCoursesError } = await supabase
      .from('room_courses')
      .select(`
        course_id,
        courses (
          *,
          course_lessons (
            lesson_id,
            title,
            lesson_order
          )
        )
      `)
      .eq('room_id', roomId);
    
    // Extract courses from the relationship data
    const assignedCourses = roomCoursesData?.map(rc => rc.courses).filter(Boolean) || [];

    // Calculate stats for each course
    const coursesWithStats = assignedCourses?.map((course: any) => {
      return {
        ...course,
        lesson_count: course.course_lessons?.length || 0,
        student_count: 0 // TODO: Add enrollment count when enrollment system is ready
      };
    }) || [];

    // Fetch linked classes
    const { data: linkedClassesData, error: linkedClassesError } = await supabase
      .from('room_classes')
      .select(`
        class_id,
        added_at,
        teacher_classes (
          class_id,
          name,
          description,
          grade_level,
          subject,
          student_count
        )
      `)
      .eq('room_id', roomId)
      .order('added_at', { ascending: false });

    const linkedClasses = linkedClassesData?.map(rc => ({
      ...rc.teacher_classes,
      linked_at: rc.added_at
    })).filter(Boolean) || [];

    // Get query parameter to include inactive students
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const inactiveOnly = searchParams.get('inactiveOnly') === 'true';
    
    // Fetch student memberships with active status filtering
    let membershipQuery = supabase
      .from('room_members')
      .select('student_id, joined_at, is_active')
      .eq('room_id', roomId);
      
    // Apply active status filtering based on query parameters  
    if (inactiveOnly) {
      membershipQuery = membershipQuery.eq('is_active', false);
    } else if (!includeInactive) {
      membershipQuery = membershipQuery.eq('is_active', true);
    }
    
    const { data: memberships, error: membershipError } = await membershipQuery;

    if (membershipError) {
      return NextResponse.json({ error: 'Failed to fetch student memberships' }, { status: 500 });
    }

    interface StudentInRoom {
        user_id: string;
        full_name: string;
        email: string;
        username?: string;
        joined_at: string;
        is_active?: boolean;
    }

    let studentsInRoom: StudentInRoom[] = [];
    if (memberships && memberships.length > 0) {
      const studentIds = memberships.map(m => m.student_id);

      // Use the admin client already created above
      const { data: studentsData, error: studentsError } = await adminSupabase
        .from('students')
        .select('student_id, first_name, surname, username')
        .in('student_id', studentIds);

      studentsInRoom = memberships.map(membership => {
        const student = studentsData?.find(s => s.student_id === membership.student_id);
        const fullName = student ? `${student.first_name} ${student.surname}` : 'Unknown Student';
        return {
          user_id: membership.student_id,
          full_name: fullName,
          email: '',       // Email not stored in students table
          username: student?.username || undefined,
          joined_at: membership.joined_at,
          is_active: membership.is_active !== false
        };
      });
    }

    const responsePayload = {
      room: roomData,
      chatbots: assignedChatbots,
      courses: coursesWithStats,
      students: studentsInRoom,
      linkedClasses: linkedClasses,
    };

    return NextResponse.json(responsePayload);

  } catch (error) {
    const typedError = error as Error;
    return NextResponse.json(
      { error: typedError.message || 'Failed to fetch room details' },
      { status: 500 }
    );
  }
}