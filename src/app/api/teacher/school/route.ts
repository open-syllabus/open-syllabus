// src/app/api/teacher/school/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is a teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (profile.school_id) {
      return NextResponse.json({ error: 'Teacher already has a school' }, { status: 400 });
    }

    // Get school name from request
    const { school_name } = await request.json();

    if (!school_name || !school_name.trim()) {
      return NextResponse.json({ error: 'School name is required' }, { status: 400 });
    }

    // Create new school
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .insert({ name: school_name.trim() })
      .select('school_id, name')
      .single();

    if (schoolError) {
      console.error('Error creating school:', schoolError);
      return NextResponse.json({ error: 'Failed to create school' }, { status: 500 });
    }

    // Update teacher profile with school_id
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        school_id: school.school_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      school: {
        school_id: school.school_id,
        name: school.name
      }
    });

  } catch (error) {
    console.error('Error in school creation:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}