// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://skolr.app';
  const code = searchParams.get('code');
  const codeVerifier = searchParams.get('code_verifier');

  if (code) {
    console.log('[Auth Callback] Processing code:', code.substring(0, 10) + '...');
    console.log('[Auth Callback] Full URL:', request.url);
    console.log('[Auth Callback] Search params:', Object.fromEntries(searchParams.entries()));
    
    const supabase = await createServerSupabaseClient();
    let authResult;
    
    // Check if code_verifier is provided (PKCE flow)
    // Handle API compatibility issues between Supabase versions
    try {
      if (codeVerifier) {
        // Newer Supabase versions accept the code verifier as an option
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        authResult = await (supabase.auth as any).exchangeCodeForSession(code, { 
          codeVerifier: codeVerifier 
        });
      } else {
        authResult = await supabase.auth.exchangeCodeForSession(code);
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // If above fails, try the older method
      authResult = await supabase.auth.exchangeCodeForSession(code);
    }
    
    const { error } = authResult;
    
    if (error) {
      console.error('Error exchanging code for session:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.redirect(new URL('/auth?error=auth_callback_failed', origin));
    }
    
    // Get user data to determine redirect
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      console.log(`[Auth Callback] User authenticated: ${user.id}`);
      console.log(`[Auth Callback] User metadata:`, user.user_metadata);
      console.log(`[Auth Callback] User app_metadata:`, user.app_metadata);
      console.log(`[Auth Callback] User email:`, user.email);
      console.log(`[Auth Callback] Auth provider:`, user.app_metadata?.provider);
      
      // We don't need to handle password reset here anymore since it's handled by
      // redirectTo in resetPasswordForEmail which takes users straight to update-password
      
      // Check for existing profiles (no polling - just a single check)
      const { data: studentProfile } = await supabase
        .from('students')
        .select('student_id, auth_user_id')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      
      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const profile = teacherProfile ? { role: 'teacher' } : studentProfile ? { role: 'student' } : null;
      const profileError = !profile ? new Error('No profile found') : null;
      
      console.log('[Auth Callback] Profile check results:', {
        hasTeacherProfile: !!teacherProfile,
        hasStudentProfile: !!studentProfile,
        profileRole: profile?.role,
        profileError: !!profileError
      });
      
      // Get redirect URL from query params or use role-based default
      const redirectToParam = searchParams.get('redirect');
      let redirectTarget = '';
      
      // First, check safe redirect parameter
      if (redirectToParam && (redirectToParam.startsWith('/') || redirectToParam.startsWith(origin))) {
        try {
            const finalRedirectUrl = redirectToParam.startsWith('/') 
                                    ? new URL(redirectToParam, origin) 
                                    : new URL(redirectToParam);

            if (finalRedirectUrl.origin === origin) {
                console.log(`[Auth Callback] Will redirect to specified param: ${finalRedirectUrl.toString()}`);
                redirectTarget = finalRedirectUrl.toString();
            }
        } catch (e) {
            console.warn(`[Auth Callback] Error parsing redirect param: ${redirectToParam}`, e);
        }
      }
      
      // If no redirect param or it wasn't valid, determine by role
      if (!redirectTarget) {
        // Check profile role first
        const profileRole = profile?.role;
        
        // If profile has no role or profile error, check user metadata
        const metadataRole = user.user_metadata?.role;
        
        console.log(`[Auth Callback] Profile role: "${profileRole}", Metadata role: "${metadataRole}"`);
        
        // If no profile was found after polling, log the issue
        // Do NOT attempt to create profiles here - let the database trigger handle it
        if (profileError) {
          console.error(`[Auth Callback] No profile found for user ${user.id} after polling. User metadata:`, {
            role: metadataRole,
            email: user.email,
            full_name: user.user_metadata?.full_name
          });
        }
        
        // Determine final redirect based on role (with fallbacks)
        const effectiveRole = profileRole || metadataRole;
        
        if (effectiveRole === 'teacher') {
          // If no profile exists, redirect to verify-profile page
          if (!teacherProfile) {
            redirectTarget = `/auth/verify-profile?_t=${Date.now()}`;
            console.log('[Auth Callback] No teacher profile found, redirecting to verify-profile');
          } else {
            // Profile exists, check admin status
            const [superAdminCheck, schoolAdminCheck] = await Promise.all([
              supabase.rpc('is_super_admin', { p_user_id: user.id }),
              supabase
                .from('school_admins')
                .select('school_id')
                .eq('user_id', user.id)
                .maybeSingle()
            ]);
            
            const isSuperAdmin = !!superAdminCheck.data;
            const isSchoolAdmin = !!schoolAdminCheck.data;
            
            console.log('[Auth Callback] Admin status:', { isSuperAdmin, isSchoolAdmin });
            
            // Redirect admins to their respective dashboards
            if (isSuperAdmin) {
              redirectTarget = `/super-admin?_t=${Date.now()}`;
              console.log('[Auth Callback] Redirecting to super admin dashboard');
            } else if (isSchoolAdmin) {
              redirectTarget = `/admin?_t=${Date.now()}`;
              console.log('[Auth Callback] Redirecting to school admin dashboard');
            } else {
              // Regular teacher flow - get profile details
              const { data: teacherData } = await supabase
                .from('teacher_profiles')
                .select('country_code, school_id')
                .eq('user_id', user.id)
                .maybeSingle();
              
              if (!teacherData) {
                // This shouldn't happen if teacherProfile exists, but handle it
                redirectTarget = `/auth/verify-profile?_t=${Date.now()}`;
              } else if (!teacherData.country_code || !teacherData.school_id) {
                // Missing required data - redirect to onboarding
                redirectTarget = `/teacher-onboarding?_t=${Date.now()}`;
                console.log('[Auth Callback] Teacher profile missing country/school data, redirecting to onboarding');
              } else {
                // Has all required data - go to dashboard
                redirectTarget = `/teacher-dashboard?_t=${Date.now()}`;
                console.log('[Auth Callback] Teacher has complete profile, redirecting to dashboard');
              }
            }
          }
        } else if (effectiveRole === 'student') {
          redirectTarget = `/student/dashboard?_t=${Date.now()}`;
          console.log('[Auth Callback] Redirecting student to dashboard');
        } else {
          // No role found - check if this is a Google OAuth user
          // Google OAuth users from SignInDropdown are marked as teachers
          const isGoogleUser = user.app_metadata?.provider === 'google' || 
                              user.app_metadata?.providers?.includes('google') ||
                              user.identities?.some(id => id.provider === 'google');
          
          console.log('[Auth Callback] Checking for Google user:', {
            provider: user.app_metadata?.provider,
            providers: user.app_metadata?.providers,
            identities: user.identities?.map(id => id.provider),
            isGoogleUser
          });
          
          if (isGoogleUser) {
            console.log('[Auth Callback] Google user detected without profile. Redirecting to verify-profile.');
            // For Google users, we know they're teachers, so send them to verify-profile
            redirectTarget = `/auth/verify-profile?_t=${Date.now()}`;
          } else {
            // Non-Google users without role - still redirect to verify-profile to attempt profile creation
            redirectTarget = `/auth/verify-profile?_t=${Date.now()}`;
            console.warn(`[Auth Callback] No role found for user ${user.id}. Redirecting to verify-profile.`);
          }
        }
      }
      
      // Final redirect
      return NextResponse.redirect(new URL(redirectTarget, origin));
    } else {
      console.log('[Auth Callback] No user found after exchanging code. Redirecting to /auth.');
      return NextResponse.redirect(new URL('/auth', origin));
    }
  }

  // Check if this is a password reset flow (no code but has token and type parameters)
  const token = searchParams.get('token');
  const type = searchParams.get('type');
  
  if (token && type === 'recovery') {
    console.log('[Auth Callback] Password reset flow detected, processing token');
    
    try {
      const supabase = await createServerSupabaseClient();
      
      // Process the password reset token to establish session
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery'
      });
      
      if (error) {
        console.error('[Auth Callback] Error verifying reset token:', error);
        return NextResponse.redirect(new URL('/auth?error=invalid_reset_token', origin));
      }
      
      console.log('[Auth Callback] Reset token verified, redirecting to update-password');
      return NextResponse.redirect(new URL('/auth/update-password', origin));
    } catch (err) {
      console.error('[Auth Callback] Exception processing reset token:', err);
      return NextResponse.redirect(new URL('/auth?error=reset_token_error', origin));
    }
  }
  
  console.log('[Auth Callback] No code found in request. Redirecting to /.');
  // Default redirect if no code or other issues
  return NextResponse.redirect(new URL('/', origin));
}