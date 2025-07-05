import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import Papa from 'papaparse';

interface StudentRow {
  first_name: string;
  surname: string;
  year_group: string;
  form_group?: string;
  username?: string;
  tags?: string;
}

// POST /api/admin/students/bulk-upload - Bulk upload students via CSV
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

    // Check if school has bulk upload feature
    const { data: hasFeature } = await supabase.rpc('check_school_feature', {
      p_school_id: adminData.school_id,
      p_feature_name: 'bulk_upload'
    });

    if (!hasFeature) {
      return NextResponse.json({ 
        error: 'Bulk upload is a premium feature. Please upgrade your subscription.' 
      }, { status: 403 });
    }

    // Get CSV content from request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const csvContent = await file.text();
    
    // Parse CSV
    const parseResult = Papa.parse<StudentRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase().replace(/ /g, '_'),
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json({ 
        error: 'CSV parsing errors', 
        details: parseResult.errors 
      }, { status: 400 });
    }

    const results = {
      success: 0,
      errors: [] as any[],
      students: [] as any[]
    };

    // Process each student row
    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i];
      
      try {
        // Validate row data
        if (!row.first_name || !row.surname || !row.year_group) {
          results.errors.push({
            row: i + 2, // Account for header row and 0-indexing
            error: 'Missing required fields',
            data: row
          });
          continue;
        }

        // Parse tags if provided
        const tags = row.tags ? row.tags.split(',').map(t => t.trim()) : [];

        // Create student
        const { data: result, error } = await supabase.rpc('create_student_unified', {
          p_school_id: adminData.school_id,
          p_first_name: row.first_name.trim(),
          p_surname: row.surname.trim(),
          p_year_group: row.year_group.trim(),
          p_form_group: row.form_group?.trim(),
          p_username: row.username?.trim(),
          p_tags: tags,
          p_created_by: user.id
        });

        if (error) {
          results.errors.push({
            row: i + 2,
            error: error.message,
            data: row
          });
        } else {
          results.success++;
          results.students.push(result);
        }
      } catch (error) {
        results.errors.push({
          row: i + 2,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: row
        });
      }
    }

    return NextResponse.json({
      summary: {
        total_rows: parseResult.data.length,
        successful: results.success,
        failed: results.errors.length
      },
      errors: results.errors,
      students: results.students
    });
  } catch (error) {
    console.error('Error in POST /api/admin/students/bulk-upload:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}