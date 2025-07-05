import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { CourseWithDetails } from '@/types/database.types';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Allow both authenticated users and students with direct access
    let userId = user?.id;
    let isStudent = false;
    
    if (!userId) {
      // Check for direct access headers (used by student room access)
      const xUserId = request.headers.get('x-user-id');
      const xUserRole = request.headers.get('x-user-role');
      
      if (xUserId && xUserRole === 'student') {
        userId = xUserId;
        isStudent = true;
      } else {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    } else {
      // Check if the authenticated user is a student
      const { data: studentProfile } = await supabase
        .from('students')
        .select('student_id')
        .eq('auth_user_id', userId)
        .single();
      
      if (studentProfile) {
        isStudent = true;
      }
    }

    const { courseId } = await context.params;

    // Use admin client to bypass RLS for course access
    const adminSupabase = createAdminClient();

    // Fetch course with lessons
    const { data: course, error } = await adminSupabase
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
          created_at,
          updated_at
        )
      `)
      .eq('course_id', courseId)
      .single();

    if (error || !course) {
      console.error('Error fetching course:', error);
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Access control
    if (isStudent) {
      // Students can only access published courses
      if (!course.is_published) {
        return NextResponse.json(
          { error: 'Course not available' },
          { status: 403 }
        );
      }
      
      // Verify student has access through room enrollment
      const { data: studentData } = await adminSupabase
        .from('students')
        .select('student_id')
        .eq('auth_user_id', userId)
        .single();
        
      if (studentData) {
        // Check if student is in a room that has this course
        const { data: roomAccess } = await adminSupabase
          .from('room_members')
          .select(`
            room_id,
            rooms!inner (
              room_courses!inner (
                course_id
              )
            )
          `)
          .eq('student_id', studentData.student_id)
          .eq('rooms.room_courses.course_id', courseId);
          
        if (!roomAccess || roomAccess.length === 0) {
          // Also check direct course enrollment
          const { data: enrollment } = await adminSupabase
            .from('course_enrollments')
            .select('enrollment_id')
            .eq('student_id', studentData.student_id)
            .eq('course_id', courseId)
            .single();
            
          if (!enrollment) {
            return NextResponse.json(
              { error: 'Access denied' },
              { status: 403 }
            );
          }
        }
      }
    } else {
      // Teachers can access their own courses
      if (course.teacher_id !== userId) {
        // Check if teacher has access through school
        const { data: teacherProfile } = await adminSupabase
          .from('teachers')
          .select('school_id')
          .eq('auth_user_id', userId)
          .single();
        
        const { data: courseTeacher } = await adminSupabase
          .from('teachers')
          .select('school_id')
          .eq('auth_user_id', course.teacher_id)
          .single();
        
        if (!teacherProfile?.school_id || 
            !courseTeacher?.school_id || 
            teacherProfile.school_id !== courseTeacher.school_id) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 403 }
          );
        }
      }
    }

    // Sort lessons by order
    if (course.course_lessons) {
      course.course_lessons.sort((a: any, b: any) => a.lesson_order - b.lesson_order);
    }

    // Get enrollment count
    const { count: enrollmentCount } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);

    // Get completion stats
    const { data: progressData } = await supabase
      .from('lesson_progress')
      .select('lesson_id, completed')
      .in('lesson_id', course.course_lessons?.map((l: any) => l.lesson_id) || []);

    // Calculate stats
    const lessonStats = course.course_lessons?.map((lesson: any) => {
      const progress = progressData?.filter((p: any) => p.lesson_id === lesson.lesson_id) || [];
      const completions = progress.filter((p: any) => p.completed).length;
      return {
        ...lesson,
        completion_count: completions,
        completion_rate: enrollmentCount ? (completions / enrollmentCount) * 100 : 0
      };
    });

    const courseWithStats: CourseWithDetails = {
      ...course,
      course_lessons: lessonStats,
      lesson_count: course.course_lessons?.length || 0,
      student_count: enrollmentCount || 0
    };

    return NextResponse.json({ course: courseWithStats });
  } catch (error) {
    console.error('Error in course GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}