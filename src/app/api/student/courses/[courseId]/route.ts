import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createErrorResponse, createSuccessResponse, handleApiError, ErrorCodes } from '@/lib/utils/api-responses';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await context.params;
    const supabaseAdmin = createAdminClient();

    // Try to get authenticated user first (session-based auth)
    let userId = null;
    let isDirectAccess = false;
    
    try {
      const { createServerSupabaseClient } = await import('@/lib/supabase/server');
      const supabase = await createServerSupabaseClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (!authError && user) {
        userId = user.id;
        console.log('[Student Courses API] Using session auth:', userId);
      }
    } catch (sessionError) {
      console.log('[Student Courses API] Session auth failed, trying direct access');
    }

    // Fallback to direct access via query params
    if (!userId) {
      const { searchParams } = new URL(request.url);
      userId = searchParams.get('userId');
      isDirectAccess = true;
      
      if (!userId) {
        return createErrorResponse(
          'Authentication required - no session or userId provided',
          401,
          ErrorCodes.VALIDATION_ERROR
        );
      }
      
      console.log('[Student Courses API] Using direct access:', userId);
    }

    // Get the student record
    const { data: studentProfile, error: studentError } = await supabaseAdmin
      .from('students')
      .select('student_id, auth_user_id')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (studentError || !studentProfile) {
      console.error('[API GET /student/courses] Student profile not found:', userId, studentError);
      return createErrorResponse('Student profile not found', 404, ErrorCodes.STUDENT_NOT_FOUND);
    }

    // Fetch course details with lessons and resources
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select(`
        *,
        course_lessons (
          lesson_id,
          title,
          description,
          video_url,
          video_platform,
          video_duration,
          lesson_order,
          is_active,
          lesson_resources (
            resource_id,
            name,
            file_url,
            file_size,
            file_type,
            upload_order
          )
        )
      `)
      .eq('course_id', courseId)
      .eq('is_published', true)
      .single();

    if (courseError || !course) {
      console.error('[API GET /student/courses] Course not found or not published:', courseId);
      return createErrorResponse('Course not found or not available', 404, ErrorCodes.NOT_FOUND);
    }

    // Verify student has access to this course via room membership
    // Secure approach: Use SQL query to check access in one operation
    const { data: accessCheck, error: accessError } = await supabaseAdmin
      .from('room_courses')
      .select(`
        room_id,
        rooms!inner(
          room_members!inner(
            student_id,
            is_active
          )
        )
      `)
      .eq('course_id', courseId)
      .eq('rooms.room_members.student_id', studentProfile.student_id)
      .eq('rooms.room_members.is_active', true)
      .limit(1);

    if (accessError) {
      console.error('[API GET /student/courses] Access check error:', accessError);
      return createErrorResponse(
        'Failed to verify course access',
        500,
        ErrorCodes.DATABASE_ERROR
      );
    }

    if (!accessCheck || accessCheck.length === 0) {
      console.error('[API GET /student/courses] Student does not have access to course:', {
        courseId,
        studentId: studentProfile.student_id,
        userId,
        isDirectAccess
      });
      return createErrorResponse(
        'You do not have access to this course',
        403,
        ErrorCodes.UNAUTHORIZED
      );
    }

    // Sort lessons by order and filter active ones
    if (course.course_lessons) {
      course.course_lessons = course.course_lessons
        .filter((lesson: any) => lesson.is_active)
        .sort((a: any, b: any) => a.lesson_order - b.lesson_order);

      // Sort resources within each lesson
      course.course_lessons.forEach((lesson: any) => {
        if (lesson.lesson_resources) {
          lesson.lesson_resources.sort((a: any, b: any) => a.upload_order - b.upload_order);
        }
      });
    }

    // Add lesson count
    const courseWithStats = {
      ...course,
      lesson_count: course.course_lessons?.length || 0
    };

    // Debug logging
    console.log('Student API course response:', {
      courseId,
      lessonCount: course.course_lessons?.length || 0,
      lessonsWithResources: course.course_lessons?.map((lesson: any) => ({
        lessonId: lesson.lesson_id,
        title: lesson.title,
        resourceCount: lesson.lesson_resources?.length || 0,
        resources: lesson.lesson_resources
      }))
    });

    return createSuccessResponse(courseWithStats);

  } catch (error) {
    console.error('[API GET /student/courses] General error:', error);
    return handleApiError(error);
  }
}