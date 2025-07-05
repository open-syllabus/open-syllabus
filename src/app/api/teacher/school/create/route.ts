// src/app/api/teacher/school/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminClient();
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get teacher profile using admin client to avoid RLS issues
    const { data: teacherProfile, error: profileError } = await adminSupabase
      .from('teacher_profiles')
      .select('teacher_id, school_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !teacherProfile) {
      console.error('Error fetching teacher profile:', profileError);
      console.error('User ID:', user.id);
      return NextResponse.json({ 
        error: 'Teacher profile not found',
        details: profileError?.message,
        user_id: user.id
      }, { status: 404 });
    }

    if (teacherProfile.school_id) {
      return NextResponse.json({ error: 'Teacher already has a school assigned' }, { status: 400 });
    }

    // Get school name from request or use default
    const body = await request.json();
    const school_name = body.school_name || `${user.email?.split('@')[0]}'s School`;

    // Create new school with admin client
    const { data: school, error: schoolError } = await adminSupabase
      .from('schools')
      .insert({ 
        name: school_name.trim(),
        tier: 'free',
        created_at: new Date().toISOString()
      })
      .select('school_id, name')
      .single();

    if (schoolError) {
      console.error('Error creating school:', schoolError);
      return NextResponse.json({ error: 'Failed to create school' }, { status: 500 });
    }

    // Update teacher profile with school_id
    const { error: updateError } = await adminSupabase
      .from('teacher_profiles')
      .update({ 
        school_id: school.school_id,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating teacher profile:', updateError);
      return NextResponse.json({ error: 'Failed to update teacher profile' }, { status: 500 });
    }

    console.log(`[School Create] Created school "${school.name}" (${school.school_id}) for teacher ${user.id}`);

    return NextResponse.json({ 
      success: true, 
      school: {
        school_id: school.school_id,
        name: school.name
      },
      message: 'School created successfully'
    });

  } catch (error) {
    console.error('Error in school creation:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}