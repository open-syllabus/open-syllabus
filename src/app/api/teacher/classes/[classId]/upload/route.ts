// New simplified CSV upload route using the clean student structure
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Papa from 'papaparse';

interface RouteParams {
  params: Promise<{
    classId: string;
  }>;
}

interface CSVStudentRow {
  [key: string]: string;
}

interface ProcessedStudent {
  first_name: string;
  surname: string;
  year_group: string;
  form_group?: string;
  username?: string;
  pin_code?: string;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminClient = createAdminClient();
    
    // 1. Authenticate teacher
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { classId } = await params;
    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    // 2. Get teacher's school
    const { data: teacherProfile } = await supabase
      .from('teacher_profiles')
      .select('school_id')
      .eq('user_id', user.id)
      .single();
      
    if (!teacherProfile?.school_id) {
      return NextResponse.json({ error: 'Teacher must be assigned to a school' }, { status: 400 });
    }

    // 3. Verify class ownership and type
    const { data: classData } = await supabase
      .from('smart_classes')
      .select('class_id, class_name, class_type')
      .eq('class_id', classId)
      .eq('teacher_id', user.id)
      .single();

    if (!classData) {
      // Check legacy classes
      const { data: legacyClass } = await supabase
        .from('teacher_classes')
        .select('class_id, name')
        .eq('class_id', classId)
        .eq('teacher_id', user.id)
        .single();

      if (!legacyClass) {
        return NextResponse.json({ error: 'Class not found' }, { status: 404 });
      }
    } else if (classData.class_type !== 'manual') {
      return NextResponse.json({ 
        error: 'Cannot manually add students to smart classes' 
      }, { status: 400 });
    }

    // 4. Parse CSV file
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileContent = await file.text();
    const parseResult = Papa.parse<CSVStudentRow>(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json({ 
        error: 'Failed to parse CSV file', 
        details: parseResult.errors 
      }, { status: 400 });
    }

    const rows = parseResult.data;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    // 5. Process students
    const studentsToCreate: ProcessedStudent[] = [];
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // Account for header
      
      try {
        // Flexible header matching
        const firstName = findValue(row, ['first name', 'firstname', 'first', 'given name']);
        const surname = findValue(row, ['surname', 'last name', 'lastname', 'last', 'family name']);
        const yearGroup = findValue(row, ['year', 'grade', 'year group']);
        const formGroup = findValue(row, ['form', 'tutor', 'class', 'form group']);

        if (!firstName || !surname) {
          errors.push({ 
            row: rowNumber, 
            error: 'Missing required first name or surname'
          });
          continue;
        }

        studentsToCreate.push({
          first_name: firstName,
          surname: surname,
          year_group: yearGroup || 'Unknown',
          form_group: formGroup,
          username: undefined, // Let the function generate it
          pin_code: undefined  // Let the function generate it
        });

      } catch (error) {
        errors.push({ 
          row: rowNumber, 
          error: error instanceof Error ? error.message : 'Processing error' 
        });
      }
    }

    // 6. Bulk create students using the new function
    const { data: createResults, error: createError } = await adminClient
      .rpc('bulk_create_students', {
        p_school_id: teacherProfile.school_id,
        p_students: studentsToCreate,
        p_created_by: user.id
      });

    if (createError) {
      console.error('Bulk create error:', createError);
      return NextResponse.json({ 
        error: 'Failed to create students',
        details: createError.message 
      }, { status: 500 });
    }

    // 7. Process results
    console.log('Create results:', createResults);
    const successfulStudents = createResults?.filter((r: any) => r.success) || [];
    const failedStudents = createResults?.filter((r: any) => !r.success) || [];

    console.log('Successful students:', successfulStudents.length);
    console.log('Failed students:', failedStudents.length);

    // Add failed students to errors
    failedStudents.forEach((failed: any) => {
      errors.push({
        row: 0, // We don't have the original row number here
        error: failed.error || 'Failed to create student'
      });
    });

    // 8. Add successful students to the class
    if (successfulStudents.length > 0) {
      const studentIds = successfulStudents.map((s: any) => s.student_id).filter(Boolean);
      console.log('Student IDs to link:', studentIds);
      
      // For smart classes, use the add function
      if (classData) {
        const { error: addError } = await adminClient
          .rpc('add_students_to_class', {
            p_class_id: classId,
            p_student_ids: studentIds
          });

        if (addError) {
          console.error('Error adding students to class:', addError);
        }
      } else {
        // For legacy classes, insert directly
        const classStudentRecords = studentIds.map((studentId: any) => ({
          class_id: classId,
          student_id: studentId,
          added_by: user.id,
          added_at: new Date().toISOString()
        }));

        console.log('Inserting class_students records:', classStudentRecords);
        
        const { error: linkError } = await adminClient
          .from('class_students')
          .insert(classStudentRecords);

        if (linkError) {
          console.error('Error linking students to class:', linkError);
          if (linkError.code !== '23505') {
            // If it's not a duplicate key error, it's a real problem
            errors.push({
              row: 0,
              error: `Failed to link students to class: ${linkError.message}`
            });
          }
        } else {
          console.log('Successfully linked', classStudentRecords.length, 'students to class');
        }
      }
    }

    // 9. Return results
    return NextResponse.json({
      success: true,
      summary: {
        created: successfulStudents.length,
        errors: errors.length,
        total: rows.length
      },
      created: successfulStudents.length,
      errors: errors,
      students: successfulStudents.map((s: any) => ({
        student_id: s.student_id,
        username: s.username
      }))
    });

  } catch (error) {
    console.error('CSV Upload Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

// Helper function for flexible header matching
function findValue(row: CSVStudentRow, possibleKeys: string[]): string | undefined {
  for (const key of possibleKeys) {
    // Check exact match
    if (row[key]) return row[key].trim();
    
    // Check case-insensitive match
    const foundKey = Object.keys(row).find(k => 
      k.toLowerCase() === key.toLowerCase() ||
      k.toLowerCase().includes(key.toLowerCase())
    );
    
    if (foundKey && row[foundKey]) {
      return row[foundKey].trim();
    }
  }
  return undefined;
}