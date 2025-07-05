import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/admin/classes - Get all classes for the school
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
    const teacherId = searchParams.get('teacher_id');
    const classType = searchParams.get('class_type');
    const isActive = searchParams.get('is_active') !== 'false';

    // Build query for smart classes
    let query = supabase
      .from('smart_classes')
      .select(`
        *,
        teacher:teacher_profiles!smart_classes_teacher_id_fkey(
          user_id,
          full_name
        )
      `)
      .eq('school_id', adminData.school_id)
      .eq('is_active', isActive)
      .order('class_name', { ascending: true });

    // Apply filters
    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }
    if (classType) {
      query = query.eq('class_type', classType);
    }

    const { data: smartClasses, error: smartError } = await query;

    if (smartError) {
      console.error('Error fetching smart classes:', smartError);
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
    }

    // Also get legacy classes
    const { data: legacyClasses, error: legacyError } = await supabase
      .from('teacher_classes')
      .select(`
        *,
        teacher:teacher_profiles!teacher_classes_teacher_id_fkey(
          user_id,
          full_name
        ),
        student_count
      `)
      .eq('teacher_profiles.school_id', adminData.school_id)
      .order('name', { ascending: true });

    // Combine and format results
    const allClasses = [
      ...(smartClasses || []).map(c => ({
        ...c,
        system: 'new',
        student_count: c.class_type === 'smart' ? null : undefined // Will be computed
      })),
      ...(legacyClasses || []).map(c => ({
        ...c,
        system: 'legacy',
        class_name: c.name,
        class_type: 'manual'
      }))
    ];

    // Get student counts for smart classes
    for (const cls of allClasses) {
      if (cls.system === 'new' && cls.class_id) {
        const { data: count } = await supabase.rpc('count_class_students', {
          p_class_id: cls.class_id
        });
        cls.student_count = count || 0;
      }
    }

    return NextResponse.json({ classes: allClasses });
  } catch (error) {
    console.error('Error in GET /api/admin/classes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/classes - Create a new smart class
export async function POST(request: Request) {
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

    // Check if school has smart classes feature
    const { data: hasFeature } = await supabase.rpc('check_school_feature', {
      p_school_id: adminData.school_id,
      p_feature_name: 'smart_classes'
    });

    if (!hasFeature) {
      return NextResponse.json({ 
        error: 'Smart classes are a premium feature. Please upgrade your subscription.' 
      }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { 
      class_name, 
      description, 
      teacher_id, 
      class_type = 'smart',
      filters = {}
    } = body;

    // Validate required fields
    if (!class_name || !teacher_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: class_name, teacher_id' 
      }, { status: 400 });
    }

    // Create the smart class
    const { data: newClass, error } = await supabase
      .from('smart_classes')
      .insert({
        school_id: adminData.school_id,
        teacher_id,
        class_name,
        description,
        class_type,
        filters
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating class:', error);
      return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
    }

    // Preview students if it's a smart class
    let studentPreview = null;
    if (class_type === 'smart' && Object.keys(filters).length > 0) {
      const { data: preview } = await supabase.rpc('preview_smart_class_students', {
        p_school_id: adminData.school_id,
        p_filters: filters
      });
      studentPreview = preview;
    }

    return NextResponse.json({ 
      success: true,
      class: newClass,
      student_preview: studentPreview
    });
  } catch (error) {
    console.error('Error in POST /api/admin/classes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}