// src/app/api/teacher/students/[studentId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateTeacher } from '@/lib/supabase/teacher-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  try {
    // Authenticate teacher
    const authResult = await authenticateTeacher();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user, profile: teacherProfile } = authResult;
    const adminSupabase = createAdminClient();
    
    // Get student details
    const { data: student, error: studentError } = await adminSupabase
      .from('students')
      .select('*')
      .eq('student_id', studentId)
      .eq('school_id', teacherProfile.school_id)
      .single();
      
    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    // Get teacher's rooms
    const { data: teacherRooms } = await adminSupabase
      .from('rooms')
      .select('room_id')
      .eq('teacher_id', user.id);
      
    const roomIds = teacherRooms?.map(r => r.room_id) || [];
    
    // Get student's room memberships that overlap with teacher's rooms
    const { data: studentRooms } = await adminSupabase
      .from('room_members')
      .select('room_id, joined_at')
      .eq('student_id', studentId)
      .in('room_id', roomIds);
      
    // Get room details
    const rooms = [];
    if (studentRooms && studentRooms.length > 0) {
      const { data: roomDetails } = await adminSupabase
        .from('rooms')
        .select('room_id, room_name')
        .in('room_id', studentRooms.map(rm => rm.room_id));
        
      const roomMap = new Map(roomDetails?.map(r => [r.room_id, r.room_name]) || []);
      
      for (const rm of studentRooms) {
        rooms.push({
          room_id: rm.room_id,
          room_name: roomMap.get(rm.room_id) || 'Unknown Room',
          joined_at: rm.joined_at
        });
      }
    }
    
    // Get last activity (last message)
    let lastActivity = null;
    if (student.auth_user_id) {
      const { data: lastMessage } = await adminSupabase
        .from('chat_messages')
        .select('created_at')
        .eq('user_id', student.auth_user_id)
        .in('room_id', roomIds)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (lastMessage && lastMessage.length > 0) {
        lastActivity = lastMessage[0].created_at;
      }
    }
    
    // Return student details
    const studentDetails = {
      student_id: student.student_id,
      first_name: student.first_name,
      surname: student.surname,
      username: student.username,
      pin_code: student.pin_code,
      year_group: student.year_group,
      created_at: student.created_at,
      room_count: rooms.length,
      last_activity: lastActivity,
      rooms: rooms
    };
    
    return NextResponse.json(studentDetails);
    
  } catch (error) {
    console.error('Error fetching student details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student details' },
      { status: 500 }
    );
  }
}