// src/app/api/teacher/students/pin-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Get student's PIN code
export async function GET(request: NextRequest) {
  try {
    // Create Supabase server client
    const supabase = await createServerSupabaseClient();
    const supabaseAdmin = createAdminClient();
    
    // Get student ID from query params
    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');
    
    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }
    
    // Get current user (teacher) to verify permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is a teacher
    const { data: profile, error: profileError } = await supabase
      .from('teacher_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();
    
    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Unauthorized - Teacher role required' },
        { status: 403 }
      );
    }
    
    // Use admin client to fetch student info from the students table
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('first_name, surname, pin_code, username, year_group')
      .eq('student_id', studentId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid the error
    
    // Check if student exists
    if (!student) {
      console.error('Student not found error:', studentError);
      
      // If student doesn't exist in profiles, check if they exist in auth.users
      const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(studentId);
      
      if (authUserError || !authUser?.user) {
        return NextResponse.json(
          { error: 'Student not found in auth system' },
          { status: 404 }
        );
      }
      
      // Student exists in auth but not in students table - this shouldn't happen
      // Return an error instead of creating in the wrong table
      return NextResponse.json(
        { error: 'Student record not found. Please ensure student is properly created.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      pin_code: student.pin_code || '',
      username: student.username || '',
      year_group: student.year_group || '',
      studentName: `${student.first_name} ${student.surname}`.trim()
    });
    
  } catch (error) {
    console.error('Error retrieving student PIN:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Regenerate PIN code
export async function POST(request: NextRequest) {
  try {
    // Create Supabase clients
    const supabase = await createServerSupabaseClient();
    const supabaseAdmin = createAdminClient();
    
    // Get request body
    const body = await request.json();
    const { studentId } = body;
    
    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }
    
    // Get current user (teacher) to verify permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is a teacher
    const { data: profile, error: profileError } = await supabase
      .from('teacher_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();
    
    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Unauthorized - Teacher role required' },
        { status: 403 }
      );
    }
    
    // Generate new PIN (4-digit number)
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Get student's current info from the students table
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('first_name, surname, username, year_group')
      .eq('student_id', studentId)
      .maybeSingle(); // Use maybeSingle to avoid errors
    
    // If student doesn't exist, return error
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found. Please ensure student is properly created.' },
        { status: 404 }
      );
    }
    
    // Generate username if it doesn't exist
    let username = student.username;
    if (!username) {
      // Generate username from name
      const fullName = `${student.first_name}${student.surname}`.trim();
      username = fullName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') // Remove special chars
        .substring(0, 20); // Limit length
      
      // Add random suffix to ensure uniqueness
      const randomSuffix = Math.floor(100 + Math.random() * 900).toString();
      username = `${username}${randomSuffix}`;
    }
    
    // Update PIN in students table
    const { error: updateError } = await supabaseAdmin
      .from('students')
      .update({
        pin_code: newPin,
        username: username,
        updated_at: new Date().toISOString()
      })
      .eq('student_id', studentId);
    
    if (updateError) {
      console.error('Error updating PIN:', updateError);
      return NextResponse.json(
        { error: 'Failed to update PIN code' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      pin_code: newPin,
      username: username,
      year_group: student.year_group || '',
      studentName: `${student.first_name} ${student.surname}`.trim(),
      regenerated: true
    });
    
  } catch (error) {
    console.error('Error regenerating PIN:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}