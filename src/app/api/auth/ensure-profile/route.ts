import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated', details: authError?.message },
        { status: 401 }
      );
    }
    
    // Use admin client for database operations to bypass RLS
    const supabaseAdmin = createAdminClient();
    
    // First, check if profile already exists
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('teacher_profiles')
      .select('user_id, email, full_name, school_id, country_code')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows found"
      console.error('[ensure-profile] Error fetching profile:', fetchError);
      return NextResponse.json(
        { error: 'Failed to check profile', details: fetchError.message },
        { status: 500 }
      );
    }
    
    // If profile exists, return it
    if (existingProfile) {
      console.log('[ensure-profile] Profile already exists for user:', user.id);
      return NextResponse.json({
        profile: existingProfile,
        created: false,
        message: 'Profile already exists'
      });
    }
    
    // Profile doesn't exist - create it
    console.log('[ensure-profile] Creating profile for user:', user.id);
    
    // Extract user metadata
    const role = user.user_metadata?.role || 'teacher';
    const fullName = user.user_metadata?.full_name || 
                    user.user_metadata?.name || 
                    user.email?.split('@')[0] || 
                    'Teacher';
    const countryCode = user.user_metadata?.country_code;
    const schoolName = user.user_metadata?.school_name;
    
    // Only create profile for teachers
    if (role !== 'teacher') {
      return NextResponse.json({
        error: 'Not a teacher account',
        role: role
      }, { status: 400 });
    }
    
    let schoolId = null;
    
    // Create school if provided
    if (schoolName) {
      try {
        // First try to find existing school
        const { data: existingSchool } = await supabaseAdmin
          .from('schools')
          .select('school_id')
          .eq('name', schoolName)
          .maybeSingle();
        
        if (existingSchool) {
          schoolId = existingSchool.school_id;
        } else {
          // Create new school
          const { data: newSchool, error: schoolError } = await supabaseAdmin
            .from('schools')
            .insert({ name: schoolName })
            .select('school_id')
            .single();
          
          if (schoolError) {
            console.error('[ensure-profile] Error creating school:', schoolError);
            // Continue without school - don't fail profile creation
          } else {
            schoolId = newSchool.school_id;
          }
        }
      } catch (error) {
        console.error('[ensure-profile] School creation error:', error);
        // Continue without school
      }
    }
    
    // Create the teacher profile
    const { data: newProfile, error: createError } = await supabaseAdmin
      .from('teacher_profiles')
      .insert({
        user_id: user.id,
        email: user.email,
        full_name: fullName,
        country_code: countryCode,
        school_id: schoolId,
        subscription_tier: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (createError) {
      console.error('[ensure-profile] Error creating profile:', createError);
      
      // Check if it's a unique constraint violation (profile was created by trigger in the meantime)
      if (createError.code === '23505') {
        // Try to fetch the profile again
        const { data: profileAfterConflict } = await supabaseAdmin
          .from('teacher_profiles')
          .select('user_id, email, full_name, school_id, country_code')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profileAfterConflict) {
          return NextResponse.json({
            profile: profileAfterConflict,
            created: false,
            message: 'Profile was created by another process'
          });
        }
      }
      
      return NextResponse.json(
        { error: 'Failed to create profile', details: createError.message },
        { status: 500 }
      );
    }
    
    console.log('[ensure-profile] Profile created successfully for user:', user.id);
    
    return NextResponse.json({
      profile: newProfile,
      created: true,
      message: 'Profile created successfully'
    });
    
  } catch (error) {
    console.error('[ensure-profile] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}