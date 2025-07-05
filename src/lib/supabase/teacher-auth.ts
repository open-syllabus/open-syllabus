// Centralized teacher authentication and profile fetching
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export interface TeacherProfile {
  teacher_id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  school_id: string | null;
  country_code: string | null;
  created_at: string;
  updated_at: string;
  is_school_member: boolean | null;
}

export interface AuthenticatedTeacher {
  user: {
    id: string;
    email?: string;
  };
  profile: TeacherProfile;
}

/**
 * Authenticates a teacher and fetches their profile using admin client to bypass RLS
 * This is the ONLY way teacher profiles should be fetched in API routes
 * 
 * @returns AuthenticatedTeacher object or NextResponse error
 */
export async function authenticateTeacher(): Promise<AuthenticatedTeacher | NextResponse> {
  try {
    // First authenticate the user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('[authenticateTeacher] Not authenticated:', authError?.message);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('[authenticateTeacher] User authenticated:', user.id, user.email);

    // Then fetch teacher profile using admin client to bypass RLS
    const adminSupabase = createAdminClient();
    const { data: teacherProfile, error: profileError } = await adminSupabase
      .from('teacher_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('[authenticateTeacher] Teacher profile error:', {
        user_id: user.id,
        error: profileError.message,
        code: profileError.code,
        details: profileError.details
      });
      
      // Specific error for missing profile
      if (profileError.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'Teacher profile not found',
          user_id: user.id,
          message: 'Your teacher profile may not have been created properly. Please contact support.'
        }, { status: 404 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to fetch teacher profile',
        details: profileError.message 
      }, { status: 500 });
    }

    if (!teacherProfile) {
      return NextResponse.json({ 
        error: 'Teacher profile not found',
        user_id: user.id 
      }, { status: 404 });
    }

    return {
      user: {
        id: user.id,
        email: user.email
      },
      profile: teacherProfile as TeacherProfile
    };
  } catch (error) {
    console.error('[authenticateTeacher] Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during authentication' 
    }, { status: 500 });
  }
}

/**
 * Checks if teacher has a school assigned
 */
export function hasSchoolAssigned(profile: TeacherProfile): boolean {
  return !!profile.school_id;
}

/**
 * Standard error response for missing school
 */
export function schoolNotAssignedError() {
  return NextResponse.json({ 
    error: 'No school assigned',
    message: 'Please complete your teacher setup to create or join a school.'
  }, { status: 400 });
}