import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateTeacher, hasSchoolAssigned, schoolNotAssignedError } from '@/lib/supabase/teacher-auth';
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limiter/simple-wrapper';

function parseCSV(content: string): Array<{ first_name: string; surname: string; year_group: string }> {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have a header row and at least one data row');
  }

  // Parse header to find column indices
  const header = lines[0].toLowerCase().split(',').map(h => h.trim());
  const firstNameIdx = header.findIndex(h => h.includes('firstname') || h.includes('first') || h === 'name');
  const surnameIdx = header.findIndex(h => h.includes('surname') || h.includes('last'));
  const yearGroupIdx = header.findIndex(h => h.includes('year') || h.includes('grade'));

  if (firstNameIdx === -1 || surnameIdx === -1) {
    throw new Error('CSV must contain FirstName and Surname columns');
  }

  if (yearGroupIdx === -1) {
    throw new Error('CSV must contain YearGroup or Grade column');
  }

  // Parse data rows
  const students = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    
    if (values.length > firstNameIdx && values.length > surnameIdx && values.length > yearGroupIdx) {
      const first_name = values[firstNameIdx];
      const surname = values[surnameIdx];
      const year_group = values[yearGroupIdx];
      
      if (first_name && surname && year_group) {
        students.push({
          first_name,
          surname,
          year_group
        });
      } else if (first_name && surname && !year_group) {
        throw new Error(`Missing year group for student: ${first_name} ${surname}`);
      }
    }
  }

  return students;
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for bulk uploads
    const rateLimitResult = await checkRateLimit(request, {
      limit: 5,
      windowMs: 60 * 60 * 1000, // 5 uploads per hour
      message: 'Too many bulk uploads. Please wait before uploading more students.'
    });
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }
    
    // Authenticate teacher and get profile
    const authResult = await authenticateTeacher();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user, profile: teacherProfile } = authResult;
    
    // Check if teacher has a school
    if (!hasSchoolAssigned(teacherProfile)) {
      return schoolNotAssignedError();
    }

    const adminSupabase = createAdminClient();

    // Parse the uploaded file
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const content = await file.text();
    const studentsToCreate = parseCSV(content);

    if (studentsToCreate.length === 0) {
      return NextResponse.json({ error: 'No valid students found in CSV' }, { status: 400 });
    }

    // Use bulk_create_students function (returns TABLE format)
    console.log('[Students Upload] Creating students:', studentsToCreate);
    console.log('[Students Upload] School ID:', teacherProfile.school_id);
    
    const { data: createResults, error: createError } = await adminSupabase
      .rpc('bulk_create_students', {
        p_school_id: teacherProfile.school_id,
        p_students: studentsToCreate,
        p_created_by: user.id
      });

    if (createError) {
      console.error('[Students Upload] Error creating students:', createError);
      return NextResponse.json({ 
        error: 'Failed to create students', 
        details: createError.message 
      }, { status: 500 });
    }
    
    console.log('[Students Upload] Create results:', createResults);

    // Process results from the TABLE return format
    const successfulStudents = [];
    const failedUploads = [];
    
    for (const result of createResults || []) {
      console.log('[Students Upload] Processing result:', result);
      
      if (result.success && result.student_id) {
        // Get the full student details
        const { data: student, error: fetchError } = await adminSupabase
          .from('students')
          .select('student_id, first_name, surname, username, pin_code')
          .eq('student_id', result.student_id)
          .single();
          
        if (fetchError) {
          console.error('[Students Upload] Error fetching student details:', fetchError);
        }
          
        if (student) {
          successfulStudents.push(student);
        }
      } else {
        console.log('[Students Upload] Failed result:', result);
        failedUploads.push({
          error: result.error || 'Failed to create student'
        });
      }
    }

    return NextResponse.json({
      success: true,
      students: successfulStudents,
      message: `Successfully created ${successfulStudents.length} students`,
      errors: failedUploads
    });

  } catch (error) {
    console.error('Error in upload students route:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}