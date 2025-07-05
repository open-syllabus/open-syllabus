// src/app/api/teacher/delete-account/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limiter/simple-wrapper';

export async function DELETE(request: NextRequest) {
  try {
    // Apply strict rate limiting - only 1 attempt per hour
    const rateLimitResult = await checkRateLimit(request, {
      limit: 1,
      windowMs: 60 * 60 * 1000, // 1 hour
      message: 'Account deletion is limited to once per hour. Please try again later.'
    });
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }
    
    // Get the authenticated user
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the user is a teacher
    const { data: profile, error: profileError } = await supabase
      .from('teacher_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Only teachers can delete their accounts through this endpoint' },
        { status: 403 }
      );
    }

    console.log(`[DELETE ACCOUNT] Starting deletion process for teacher: ${user.id}`);

    // Use admin client for all operations
    const supabaseAdmin = createAdminClient();

    // Step 1: Get all rooms owned by this teacher to clean up related data
    const { data: teacherRooms, error: roomsError } = await supabaseAdmin
      .from('rooms')
      .select('room_id')
      .eq('teacher_id', user.id);

    if (roomsError) {
      console.error('[DELETE ACCOUNT] Error fetching teacher rooms:', roomsError);
      throw new Error('Failed to fetch teacher data for cleanup');
    }

    console.log(`[DELETE ACCOUNT] Found ${teacherRooms?.length || 0} rooms to clean up`);

    // Step 2: Find students that are ONLY associated with this teacher
    // First, get all students in this teacher's rooms
    let studentsToDelete: string[] = [];
    
    if (teacherRooms && teacherRooms.length > 0) {
      const roomIds = teacherRooms.map(room => room.room_id);
      
      // Get all students in this teacher's rooms
      const { data: studentsInTeacherRooms } = await supabaseAdmin
        .from('room_members')
        .select('student_id')
        .in('room_id', roomIds);
      
      if (studentsInTeacherRooms && studentsInTeacherRooms.length > 0) {
        const studentIds = [...new Set(studentsInTeacherRooms.map(rm => rm.student_id))];
        
        // For each student, check if they belong to any rooms NOT owned by this teacher
        for (const studentId of studentIds) {
          const { data: otherRooms } = await supabaseAdmin
            .from('room_members')
            .select('room_id, rooms!inner(teacher_id)')
            .eq('student_id', studentId)
            .neq('rooms.teacher_id', user.id);
          
          // If student has no other rooms, they should be deleted
          if (!otherRooms || otherRooms.length === 0) {
            studentsToDelete.push(studentId);
          }
        }
      }
      
      console.log(`[DELETE ACCOUNT] Found ${studentsToDelete.length} students to delete (only associated with this teacher)`);
    }

    // Step 3: Delete related data (in correct order due to foreign key constraints)
    if (teacherRooms && teacherRooms.length > 0) {
      const roomIds = teacherRooms.map(room => room.room_id);

      // Delete student assessments in teacher's rooms
      const { error: assessmentsError } = await supabaseAdmin
        .from('student_assessments')
        .delete()
        .in('room_id', roomIds);

      if (assessmentsError) {
        console.warn('[DELETE ACCOUNT] Error deleting assessments:', assessmentsError);
      }

      // Delete room memberships
      const { error: membershipsError } = await supabaseAdmin
        .from('room_members')
        .delete()
        .in('room_id', roomIds);

      if (membershipsError) {
        console.warn('[DELETE ACCOUNT] Error deleting room memberships:', membershipsError);
      }

      // Delete room-chatbot associations
      const { error: chatbotAssocError } = await supabaseAdmin
        .from('room_chatbots')
        .delete()
        .in('room_id', roomIds);

      if (chatbotAssocError) {
        console.warn('[DELETE ACCOUNT] Error deleting room-chatbot associations:', chatbotAssocError);
      }

      // Delete the rooms themselves
      const { error: roomDeleteError } = await supabaseAdmin
        .from('rooms')
        .delete()
        .eq('teacher_id', user.id);

      if (roomDeleteError) {
        console.warn('[DELETE ACCOUNT] Error deleting rooms:', roomDeleteError);
      }
    }

    // Step 3: Delete teacher's chatbots
    const { error: chatbotsError } = await supabaseAdmin
      .from('chatbots')
      .delete()
      .eq('teacher_id', user.id);

    if (chatbotsError) {
      console.warn('[DELETE ACCOUNT] Error deleting chatbots:', chatbotsError);
    }

    // Step 4: Delete teacher's documents
    const { error: documentsError } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('teacher_id', user.id);

    if (documentsError) {
      console.warn('[DELETE ACCOUNT] Error deleting documents:', documentsError);
    }

    // Step 5: Delete teacher's smart classes (this will cascade delete manual_class_students)
    const { error: smartClassesError } = await supabaseAdmin
      .from('smart_classes')
      .delete()
      .eq('teacher_id', user.id);

    if (smartClassesError) {
      console.warn('[DELETE ACCOUNT] Error deleting smart classes:', smartClassesError);
    }

    // Step 6: Delete orphaned students (students only associated with this teacher)
    if (studentsToDelete.length > 0) {
      console.log(`[DELETE ACCOUNT] Deleting ${studentsToDelete.length} orphaned students`);
      
      // First get the auth_user_ids for these students
      const { data: studentsData } = await supabaseAdmin
        .from('students')
        .select('student_id, auth_user_id')
        .in('student_id', studentsToDelete);
      
      // Delete all student-related data
      // Delete messages
      await supabaseAdmin
        .from('messages')
        .delete()
        .in('student_id', studentsToDelete);
      
      // Delete student memory
      await supabaseAdmin
        .from('student_memory')
        .delete()
        .in('student_id', studentsToDelete);
      
      // Delete flagged messages
      await supabaseAdmin
        .from('flagged_messages')
        .delete()
        .in('student_id', studentsToDelete);
      
      // Delete filtered messages
      await supabaseAdmin
        .from('filtered_messages')
        .delete()
        .in('student_id', studentsToDelete);
      
      // Delete manual class students
      await supabaseAdmin
        .from('manual_class_students')
        .delete()
        .in('student_id', studentsToDelete);
      
      // Delete student notebooks
      await supabaseAdmin
        .from('student_notebooks')
        .delete()
        .in('student_id', studentsToDelete);
      
      // Delete course enrollments
      await supabaseAdmin
        .from('course_enrollments')
        .delete()
        .in('student_id', studentsToDelete);
      
      // Delete the student records
      const { error: studentsDeleteError } = await supabaseAdmin
        .from('students')
        .delete()
        .in('student_id', studentsToDelete);
      
      if (studentsDeleteError) {
        console.warn('[DELETE ACCOUNT] Error deleting orphaned students:', studentsDeleteError);
      }
      
      // Delete auth users for these students
      if (studentsData) {
        const authUserIds = studentsData
          .map(s => s.auth_user_id)
          .filter(id => id !== null);
        
        for (const authUserId of authUserIds) {
          try {
            await supabaseAdmin.auth.admin.deleteUser(authUserId);
          } catch (error) {
            console.warn(`[DELETE ACCOUNT] Error deleting student auth user ${authUserId}:`, error);
          }
        }
      }
    }

    // Step 7: Delete the teacher profile
    const { error: profileDeleteError } = await supabaseAdmin
      .from('teacher_profiles')
      .delete()
      .eq('user_id', user.id);

    if (profileDeleteError) {
      console.error('[DELETE ACCOUNT] Error deleting teacher profile:', profileDeleteError);
      throw new Error('Failed to delete teacher profile');
    }

    // Step 8: Delete the auth user (this should be last)
    const { error: userDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (userDeleteError) {
      console.error('[DELETE ACCOUNT] Error deleting auth user:', userDeleteError);
      // Profile is already deleted, so this is a partial failure
      throw new Error('Profile deleted but auth user deletion failed. Please contact support.');
    }

    console.log(`[DELETE ACCOUNT] Successfully deleted teacher account: ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Account successfully deleted'
    });

  } catch (error) {
    console.error('[DELETE ACCOUNT] Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete account' 
      },
      { status: 500 }
    );
  }
}