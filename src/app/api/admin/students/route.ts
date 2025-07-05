import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/admin/students - Get all students for the school
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a school admin
    const { data: adminData, error: adminError } = await supabase
      .from('school_admins')
      .select('school_id, permissions')
      .eq('user_id', user.id)
      .single();

    if (adminError || !adminData) {
      return NextResponse.json({ error: 'Not a school admin' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const yearGroup = searchParams.get('year_group');
    const formGroup = searchParams.get('form_group');
    const tags = searchParams.get('tags')?.split(',');
    const isActive = searchParams.get('is_active') !== 'false';

    // Build query
    let query = supabase
      .from('master_students')
      .select('*')
      .eq('school_id', adminData.school_id)
      .eq('is_active', isActive)
      .order('surname', { ascending: true })
      .order('first_name', { ascending: true });

    // Apply filters
    if (yearGroup) {
      query = query.eq('year_group', yearGroup);
    }
    if (formGroup) {
      query = query.eq('form_group', formGroup);
    }
    if (tags && tags.length > 0) {
      query = query.contains('tags', tags);
    }

    const { data: students, error } = await query;

    if (error) {
      console.error('Error fetching students:', error);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Error in GET /api/admin/students:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/students - Create a new student
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a school admin with manage_students permission
    const { data: adminData, error: adminError } = await supabase
      .from('school_admins')
      .select('school_id, permissions')
      .eq('user_id', user.id)
      .single();

    if (adminError || !adminData || !adminData.permissions?.manage_students) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { first_name, surname, year_group, form_group, username, pin_code, tags } = body;

    // Validate required fields
    if (!first_name || !surname || !year_group) {
      return NextResponse.json({ 
        error: 'Missing required fields: first_name, surname, year_group' 
      }, { status: 400 });
    }

    // Call the unified student creation function
    const { data: result, error } = await supabase.rpc('create_student_unified', {
      p_school_id: adminData.school_id,
      p_first_name: first_name,
      p_surname: surname,
      p_year_group: year_group,
      p_form_group: form_group,
      p_username: username,
      p_pin_code: pin_code,
      p_tags: tags || [],
      p_created_by: user.id
    });

    if (error) {
      console.error('Error creating student:', error);
      return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      student: result
    });
  } catch (error) {
    console.error('Error in POST /api/admin/students:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}