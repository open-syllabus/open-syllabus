// src/app/api/teacher/students/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateTeacher, hasSchoolAssigned, schoolNotAssignedError } from '@/lib/supabase/teacher-auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');

  console.log('[GET /api/teacher/students] Starting request, roomId:', roomId);

  try {
    // Authenticate teacher and get profile
    console.log('[GET /api/teacher/students] Calling authenticateTeacher...');
    const authResult = await authenticateTeacher();
    
    console.log('[GET /api/teacher/students] Auth result type:', typeof authResult, 'is NextResponse:', authResult instanceof NextResponse);
    
    if (authResult instanceof NextResponse) {
      console.log('[GET /api/teacher/students] Returning auth error response');
      return authResult;
    }
    
    const { user, profile: teacherProfile } = authResult;
    console.log('[GET /api/teacher/students] Auth successful, user:', user.id, 'school:', teacherProfile.school_id);
    
    // Check if teacher has a school
    if (!hasSchoolAssigned(teacherProfile)) {
      console.log('[GET /api/teacher/students] No school assigned, returning error');
      return schoolNotAssignedError();
    }

    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminClient();

    // If roomId is provided, fetch students for specific room
    if (roomId) {
      // Verify teacher owns the room
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('room_id')
        .eq('room_id', roomId)
        .eq('teacher_id', user.id)
        .single();

      if (roomError || !room) {
        console.warn(`[API /teacher/students] Room not found (ID: ${roomId}) or teacher (ID: ${user.id}) not authorized:`, roomError?.message);
        return NextResponse.json({ error: 'Room not found or unauthorized' }, { status: 404 });
      }

      // Fetch room members
      const { data: memberships, error: membershipError } = await supabase
        .from('room_members')
        .select('student_id, joined_at')
        .eq('room_id', roomId);

      if (membershipError) {
        console.error(`[API /teacher/students] Failed to fetch room memberships for room ${roomId}:`, membershipError.message);
        return NextResponse.json(
          { error: `Failed to fetch room memberships: ${membershipError.message}` },
          { status: 500 }
        );
      }

      if (!memberships || memberships.length === 0) {
        return NextResponse.json({ students: [] });
      }

      const studentIds = memberships.map(m => m.student_id);
      
      // Get student details
      const { data: students, error: studentsError } = await adminSupabase
        .from('students')
        .select('student_id, first_name, surname, username, pin_code, year_group, created_at')
        .in('student_id', studentIds);

      if (studentsError) {
        console.error('[API /teacher/students] Failed to fetch students:', studentsError);
        return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
      }

      return NextResponse.json({ students: students || [] });
    }

    // Otherwise, fetch all students for the school
    const { data: students, error } = await adminSupabase
      .from('students')
      .select(`
        student_id,
        first_name,
        surname,
        username,
        pin_code,
        year_group,
        created_at
      `)
      .eq('school_id', teacherProfile.school_id)
      .order('surname', { ascending: true })
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error fetching students:', error);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    // Get room counts and last activity for each student
    const studentIds = students?.map(s => s.student_id) || [];
    
    // Get room memberships
    const { data: roomMemberships } = await adminSupabase
      .from('room_members')
      .select('student_id')
      .in('student_id', studentIds);

    // Count rooms for each student
    const roomCounts = new Map<string, number>();
    roomMemberships?.forEach(membership => {
      const count = roomCounts.get(membership.student_id) || 0;
      roomCounts.set(membership.student_id, count + 1);
    });

    // Get last activity for each student (last message timestamp)
    const lastActivityMap = new Map<string, string>();
    
    // Get auth_user_ids for students
    const { data: studentAuthUsers } = await adminSupabase
      .from('students')
      .select('student_id, auth_user_id')
      .in('student_id', studentIds);
    
    if (studentAuthUsers && studentAuthUsers.length > 0) {
      const authUserIds = studentAuthUsers
        .filter(s => s.auth_user_id)
        .map(s => s.auth_user_id);
      
      if (authUserIds.length > 0) {
        // Get last message for each student
        const { data: lastMessages } = await adminSupabase
          .from('chat_messages')
          .select('user_id, created_at')
          .in('user_id', authUserIds)
          .order('created_at', { ascending: false });
        
        // Create a map of auth_user_id to student_id
        const authToStudentMap = new Map<string, string>();
        studentAuthUsers.forEach(s => {
          if (s.auth_user_id) {
            authToStudentMap.set(s.auth_user_id, s.student_id);
          }
        });
        
        // Process last messages to get most recent per student
        const processedStudents = new Set<string>();
        lastMessages?.forEach(msg => {
          const studentId = authToStudentMap.get(msg.user_id);
          if (studentId && !processedStudents.has(studentId)) {
            lastActivityMap.set(studentId, msg.created_at);
            processedStudents.add(studentId);
          }
        });
      }
    }

    // Add room counts and last activity to students
    const studentsWithDetails = students?.map(student => ({
      ...student,
      room_count: roomCounts.get(student.student_id) || 0,
      last_activity: lastActivityMap.get(student.student_id) || null
    })) || [];

    return NextResponse.json({ students: studentsWithDetails });

  } catch (error) {
    const typedError = error as Error & { code?: string; details?: unknown };
    console.error('[API /teacher/students] CATCH BLOCK Error:', 
        typedError?.message, 
        'Code:', typedError?.code, 
        'Details:', typedError?.details
    );
    return NextResponse.json(
      { error: typedError?.message || 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

// POST endpoint for creating a single student
export async function POST(request: NextRequest) {
  try {
    // Authenticate teacher and get profile
    const authResult = await authenticateTeacher();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user, profile: teacherProfile } = authResult;
    
    // Check if teacher has a school
    if (!hasSchoolAssigned(teacherProfile)) {
      return schoolNotAssignedError();
    }

    const body = await request.json();
    const { first_name, surname, year_group } = body;

    if (!first_name || !surname) {
      return NextResponse.json({ error: 'First name and surname are required' }, { status: 400 });
    }

    if (!year_group) {
      return NextResponse.json({ error: 'Year group is required for safety features' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Create student using the database function
    const { data: student, error } = await adminSupabase
      .rpc('create_student', {
        p_school_id: teacherProfile.school_id,
        p_first_name: first_name,
        p_surname: surname,
        p_year_group: year_group,
        p_created_by: user.id
      });

    if (error) {
      console.error('Error creating student:', error);
      return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
    }

    return NextResponse.json({ student });

  } catch (error) {
    console.error('Error in create student route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, roomId } = body;

    if (!studentId || !roomId) {
      return NextResponse.json({ error: 'Student ID and Room ID are required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify teacher owns the room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('room_id')
      .eq('room_id', roomId)
      .eq('teacher_id', user.id)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: 'Room not found or unauthorized' }, { status: 404 });
    }

    // Use admin client for deletion operations
    const adminSupabase = createAdminClient();

    // Delete from room_members
    const { error: membershipError } = await adminSupabase
      .from('room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('student_id', studentId);

    if (membershipError) {
      console.error('[API DELETE /teacher/students] Failed to delete room membership:', membershipError);
      return NextResponse.json({ error: 'Failed to remove student from room' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Student removed from room successfully' });

  } catch (error) {
    console.error('[API DELETE /teacher/students] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete student' },
      { status: 500 }
    );
  }
}