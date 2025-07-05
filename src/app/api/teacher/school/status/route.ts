// src/app/api/teacher/school/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get teacher profile with school details
    const { data: teacherProfile, error: profileError } = await supabase
      .from('teacher_profiles')
      .select(`
        teacher_id,
        user_id,
        full_name,
        email,
        school_id,
        country_code,
        schools (
          school_id,
          name,
          tier,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .single();

    if (profileError || !teacherProfile) {
      return NextResponse.json({ 
        error: 'Teacher profile not found',
        details: profileError 
      }, { status: 404 });
    }

    // Check admin status
    const [superAdminCheck, schoolAdminCheck] = await Promise.all([
      supabase.rpc('is_super_admin', { p_user_id: user.id }),
      supabase
        .from('school_admins')
        .select('school_id, created_at')
        .eq('user_id', user.id)
        .maybeSingle()
    ]);

    return NextResponse.json({
      teacher: {
        teacher_id: teacherProfile.teacher_id,
        user_id: teacherProfile.user_id,
        full_name: teacherProfile.full_name,
        email: teacherProfile.email,
        country_code: teacherProfile.country_code,
        has_school: !!teacherProfile.school_id,
        is_super_admin: !!superAdminCheck.data,
        is_school_admin: !!schoolAdminCheck.data
      },
      school: teacherProfile.schools || null,
      needs_onboarding: !teacherProfile.country_code || !teacherProfile.school_id
    });

  } catch (error) {
    console.error('Error in teacher status check:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}