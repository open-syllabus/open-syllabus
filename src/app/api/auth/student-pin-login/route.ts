// src/app/api/auth/student-pin-login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limiter/simple-wrapper';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for authentication
    const rateLimitResult = await checkRateLimit(request, RateLimitPresets.auth);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }
    const supabaseAdmin = createAdminClient();
    
    // Get parameters from request
    const { username, pin_code } = await request.json();
    
    console.log('[Student PIN Login] Attempt for username:', username);
    
    // Validate inputs
    if (!username || !pin_code) {
      return NextResponse.json({ 
        error: 'Missing username or PIN'
      }, { status: 400 });
    }
    
    // Find the user by username in students table
    // First try to find without school_id (username should be unique enough with our new format)
    const { data: students, error: studentError } = await supabaseAdmin
      .from('students')
      .select('student_id, username, pin_code, first_name, surname, auth_user_id, school_id')
      .eq('username', username.toLowerCase());
      
    if (studentError) {
      console.error('[Student PIN Login] Database error:', studentError);
      return NextResponse.json({ 
        error: 'Invalid username or PIN'
      }, { status: 401 });
    }
    
    // Handle multiple students with same username across schools
    let student = null;
    if (!students || students.length === 0) {
      console.error('[Student PIN Login] No student found with username:', username);
      return NextResponse.json({ 
        error: 'Invalid username or PIN'
      }, { status: 401 });
    } else if (students.length === 1) {
      student = students[0];
    } else {
      // Multiple students with same username - need to verify PIN to find the right one
      console.log('[Student PIN Login] Multiple students found with username:', username);
      student = students.find(s => s.pin_code === pin_code);
      if (!student) {
        return NextResponse.json({ 
          error: 'Invalid username or PIN'
        }, { status: 401 });
      }
    }
    
    console.log('[Student PIN Login] Found student:', {
      student_id: student.student_id,
      username: student.username,
      school_id: student.school_id
    });
    
    // Verify PIN matches
    if (student.pin_code !== pin_code) {
      console.log('[Student PIN Login] PIN mismatch');
      return NextResponse.json({ 
        error: 'Invalid username or PIN' 
      }, { status: 401 });
    }
    
    console.log('[Student PIN Login] PIN verified for student:', student.student_id);
    
    // Construct the email used in auth.users
    const studentEmail = `${student.username}@${student.school_id}.local`;
    
    // Create a fresh Supabase client for authentication
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
    
    // Authenticate with Supabase
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email: studentEmail,
      password: pin_code
    });
    
    if (authError) {
      console.error('[Student PIN Login] Authentication failed:', authError);
      return NextResponse.json({ 
        error: 'Authentication failed. Please contact your teacher.'
      }, { status: 401 });
    }
    
    // Authentication successful
    console.log('[Student PIN Login] Success for:', student.username);
    
    return NextResponse.json({
      success: true,
      user_id: student.student_id,
      student_name: `${student.first_name} ${student.surname}`.trim(),
      session: authData.session
    });
    
  } catch (error) {
    console.error('[Student PIN Login] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'An error occurred during login'
    }, { status: 500 });
  }
}