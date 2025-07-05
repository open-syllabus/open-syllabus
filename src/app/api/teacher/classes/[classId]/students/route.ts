// src/app/api/teacher/classes/[classId]/students/route.ts
// API endpoint for managing students in a class

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface RouteParams {
  params: Promise<{
    classId: string;
  }>;
}

// POST: Add students to a class
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminClient = createAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { classId } = await params;
    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: classData } = await supabase
      .from('teacher_classes')
      .select('class_id, name')
      .eq('class_id', classId)
      .eq('teacher_id', user.id)
      .single();

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { student_ids } = body;

    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      return NextResponse.json({ error: 'Student IDs array is required' }, { status: 400 });
    }

    // Validate all student IDs are UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validStudentIds = student_ids.filter(id => 
      typeof id === 'string' && uuidRegex.test(id)
    );

    if (validStudentIds.length === 0) {
      return NextResponse.json({ error: 'No valid student IDs provided' }, { status: 400 });
    }

    // Verify all students exist and are actually students
    const { data: existingStudents } = await adminClient
      .from('student_profiles')
      .select('user_id')
      .in('user_id', validStudentIds);

    if (!existingStudents || existingStudents.length !== validStudentIds.length) {
      return NextResponse.json({ 
        error: 'Some student IDs are invalid or do not exist' 
      }, { status: 400 });
    }

    // Check which students are already in the class
    const { data: existingClassStudents } = await supabase
      .from('class_students')
      .select('student_id')
      .eq('class_id', classId)
      .in('student_id', validStudentIds);

    const existingStudentIds = new Set(
      existingClassStudents?.map(cs => cs.student_id) || []
    );

    // Filter out students already in the class
    const newStudentIds = validStudentIds.filter(id => !existingStudentIds.has(id));

    if (newStudentIds.length === 0) {
      return NextResponse.json({ 
        message: 'All students are already in the class',
        added: 0,
        skipped: validStudentIds.length
      });
    }

    // Add new students to the class
    const classStudentRecords = newStudentIds.map(student_id => ({
      class_id: classId,
      student_id,
      added_by: user.id
    }));

    const { data: addedStudents, error: insertError } = await supabase
      .from('class_students')
      .insert(classStudentRecords)
      .select('student_id');

    if (insertError) {
      console.error('[API Class Students POST] Error adding students:', insertError);
      return NextResponse.json({ error: 'Failed to add students to class' }, { status: 500 });
    }

    console.log(`[API Class Students POST] Added ${addedStudents?.length || 0} students to class ${classId}`);
    
    return NextResponse.json({
      message: 'Students added successfully',
      added: addedStudents?.length || 0,
      skipped: existingStudentIds.size,
      class_id: classId
    }, { status: 201 });
  } catch (error) {
    console.error('[API Class Students POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove students from a class
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { classId } = await params;
    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: classData } = await supabase
      .from('teacher_classes')
      .select('class_id')
      .eq('class_id', classId)
      .eq('teacher_id', user.id)
      .single();

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { student_ids } = body;

    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      return NextResponse.json({ error: 'Student IDs array is required' }, { status: 400 });
    }

    // Remove students from the class
    const { error: deleteError } = await supabase
      .from('class_students')
      .delete()
      .eq('class_id', classId)
      .in('student_id', student_ids);

    if (deleteError) {
      console.error('[API Class Students DELETE] Error removing students:', deleteError);
      return NextResponse.json({ error: 'Failed to remove students from class' }, { status: 500 });
    }

    console.log(`[API Class Students DELETE] Removed students from class ${classId}`);
    
    return NextResponse.json({
      message: 'Students removed successfully',
      class_id: classId
    });
  } catch (error) {
    console.error('[API Class Students DELETE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}