// src/app/api/teacher/classes/route.ts
// API endpoint for listing and creating teacher classes

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET: List all classes for a teacher
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is a teacher
    const { data: teacherProfile } = await supabase
      .from('teacher_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!teacherProfile) {
      return NextResponse.json({ error: 'Not authorized - teachers only' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const academicYear = searchParams.get('academicYear');
    const subject = searchParams.get('subject');

    // Build query
    let query = supabase
      .from('teacher_classes')
      .select(`
        *,
        class_students!inner (
          student_id
        )
      `)
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }
    if (academicYear) {
      query = query.eq('academic_year', academicYear);
    }
    if (subject) {
      query = query.eq('subject', subject);
    }

    const { data: classes, error } = await query;

    if (error) {
      console.error('[API Teacher Classes GET] Error fetching classes:', error);
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
    }

    // Transform data to include student count
    const classesWithCounts = classes?.map(cls => ({
      ...cls,
      student_count: cls.class_students?.length || 0,
      class_students: undefined // Remove the raw join data
    })) || [];

    return NextResponse.json({ classes: classesWithCounts });
  } catch (error) {
    console.error('[API Teacher Classes GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new class
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is a teacher
    const { data: teacherProfile } = await supabase
      .from('teacher_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!teacherProfile) {
      return NextResponse.json({ error: 'Not authorized - teachers only' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { name, description, academic_year, grade_level, subject } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 });
    }

    // Create the class
    const { data: newClass, error: createError } = await supabase
      .from('teacher_classes')
      .insert({
        teacher_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        academic_year: academic_year?.trim() || null,
        grade_level: grade_level?.trim() || null,
        subject: subject?.trim() || null,
        student_count: 0,
        is_archived: false
      })
      .select()
      .single();

    if (createError) {
      console.error('[API Teacher Classes POST] Error creating class:', createError);
      
      // Check for unique constraint violation
      if (createError.code === '23505') {
        return NextResponse.json({ 
          error: 'A class with this name already exists' 
        }, { status: 409 });
      }
      
      return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
    }

    console.log(`[API Teacher Classes POST] Created class ${newClass.class_id} for teacher ${user.id}`);
    return NextResponse.json({ class: newClass }, { status: 201 });
  } catch (error) {
    console.error('[API Teacher Classes POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}