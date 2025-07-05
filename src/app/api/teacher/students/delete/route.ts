import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limiter/simple-wrapper';

export async function DELETE(request: NextRequest) {
  try {
    // Apply strict rate limiting for mass deletion
    const rateLimitResult = await checkRateLimit(request, {
      limit: 5,
      windowMs: 60 * 60 * 1000, // 5 deletions per hour
      message: 'Too many deletion requests. Please wait before deleting more students.'
    });
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }
    
    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify teacher
    const { data: teacher } = await supabase
      .from('teacher_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!teacher) {
      return NextResponse.json(
        { error: 'Only teachers can delete students' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { studentIds } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid student IDs' },
        { status: 400 }
      );
    }

    // Use admin client for deletion
    const adminClient = createAdminClient();

    // First, get the auth_user_ids for these students
    const { data: students, error: fetchError } = await adminClient
      .from('students')
      .select('student_id, auth_user_id')
      .in('student_id', studentIds);

    if (fetchError) {
      console.error('Error fetching students:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch students' },
        { status: 500 }
      );
    }

    if (!students || students.length === 0) {
      return NextResponse.json(
        { error: 'No students found' },
        { status: 404 }
      );
    }

    // Delete related data in order due to foreign key constraints
    console.log(`[DELETE STUDENTS] Deleting ${students.length} students`);

    // 1. Delete chat messages
    const { error: messagesError } = await adminClient
      .from('messages')
      .delete()
      .in('student_id', studentIds);

    if (messagesError) {
      console.warn('[DELETE STUDENTS] Error deleting messages:', messagesError);
    }

    // 2. Delete student assessments
    const { error: assessmentsError } = await adminClient
      .from('student_assessments')
      .delete()
      .in('student_id', studentIds);

    if (assessmentsError) {
      console.warn('[DELETE STUDENTS] Error deleting assessments:', assessmentsError);
    }

    // 3. Delete room memberships
    const { error: membershipsError } = await adminClient
      .from('room_members')
      .delete()
      .in('student_id', studentIds);

    if (membershipsError) {
      console.warn('[DELETE STUDENTS] Error deleting room memberships:', membershipsError);
    }

    // 4. Delete student memory entries
    const { error: memoryError } = await adminClient
      .from('student_memory')
      .delete()
      .in('student_id', studentIds);

    if (memoryError) {
      console.warn('[DELETE STUDENTS] Error deleting memory entries:', memoryError);
    }

    // 5. Delete flagged messages
    const { error: flaggedError } = await adminClient
      .from('flagged_messages')
      .delete()
      .in('student_id', studentIds);

    if (flaggedError) {
      console.warn('[DELETE STUDENTS] Error deleting flagged messages:', flaggedError);
    }

    // 6. Delete filtered messages
    const { error: filteredError } = await adminClient
      .from('filtered_messages')
      .delete()
      .in('student_id', studentIds);

    if (filteredError) {
      console.warn('[DELETE STUDENTS] Error deleting filtered messages:', filteredError);
    }

    // 7. Delete manual class students
    const { error: manualClassError } = await adminClient
      .from('manual_class_students')
      .delete()
      .in('student_id', studentIds);

    if (manualClassError) {
      console.warn('[DELETE STUDENTS] Error deleting manual class students:', manualClassError);
    }

    // 8. Delete student notebooks
    const { error: notebooksError } = await adminClient
      .from('student_notebooks')
      .delete()
      .in('student_id', studentIds);

    if (notebooksError) {
      console.warn('[DELETE STUDENTS] Error deleting notebooks:', notebooksError);
    }

    // 9. Delete course enrollments
    const { error: enrollmentsError } = await adminClient
      .from('course_enrollments')
      .delete()
      .in('student_id', studentIds);

    if (enrollmentsError) {
      console.warn('[DELETE STUDENTS] Error deleting course enrollments:', enrollmentsError);
    }

    // 10. Delete the student records
    const { error: studentsDeleteError } = await adminClient
      .from('students')
      .delete()
      .in('student_id', studentIds);

    if (studentsDeleteError) {
      console.error('[DELETE STUDENTS] Error deleting students:', studentsDeleteError);
      return NextResponse.json(
        { error: 'Failed to delete students' },
        { status: 500 }
      );
    }

    // 11. Delete auth users if they exist
    const authUserIds = students
      .map(s => s.auth_user_id)
      .filter(id => id !== null);

    for (const authUserId of authUserIds) {
      try {
        await adminClient.auth.admin.deleteUser(authUserId);
      } catch (error) {
        console.warn(`[DELETE STUDENTS] Error deleting auth user ${authUserId}:`, error);
      }
    }

    console.log(`[DELETE STUDENTS] Successfully deleted ${students.length} students`);

    return NextResponse.json({
      success: true,
      deletedCount: students.length
    });

  } catch (error) {
    console.error('[DELETE STUDENTS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to delete students' },
      { status: 500 }
    );
  }
}