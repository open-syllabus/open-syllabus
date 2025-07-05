// src/app/teacher-dashboard/layout.tsx
'use client';

import styled from 'styled-components';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient as createStandardSupabaseClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import TeacherProfileCheck from '@/components/auth/teacherProfileCheck';
import { ModernNavWithOnboarding } from '@/components/teacher/ModernNavWrapper';
import { FullPageLoader } from '@/components/shared/AnimatedLoader';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/layout/Header';
import MinimalFooter from '@/components/layout/MinimalFooter';
import { OnboardingProvider } from '@/contexts/OnboardingContext';

const DashboardLayoutContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.ui.background};
  position: relative;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    /* Hide desktop header on mobile */
    > header:first-child {
      display: none;
    }
  }
`;

const MainContent = styled(motion.main)`
  flex: 1;
  position: relative;
  margin-left: 80px; /* Just the sidebar width */
  padding: 20px 0 40px 0; /* Reduced top padding since header provides space */
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    margin-left: 80px;
    padding: 20px 0 32px 0;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-left: 0;
    padding: 100px 0 24px 0; /* Keep increased padding for mobile header */
  }
`;

const ContentContainer = styled.div`
  max-width: 1200px; /* Same as header Container */
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.lg}; /* 24px - same as header */
  width: 100%;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0 ${({ theme }) => theme.spacing.md}; /* 16px - same as header */
  }
`;

type AuthStatus = 'loading' | 'authorised' | 'unauthorised';

export default function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const router = useRouter();
  const supabase = createStandardSupabaseClient();
  const hasCheckedAuth = useRef(false);
  const authCheckInProgress = useRef(false);
  const mountCountRef = useRef(0);

  useEffect(() => {
    mountCountRef.current += 1;
    console.log(`[TDL] useEffect for auth check triggered. Mount count: ${mountCountRef.current}`);

    const checkAuth = async (sessionUser: User | null) => {
      // Prevent duplicate auth checks
      if (authCheckInProgress.current) {
        console.log('[TDL] Auth check already in progress, skipping.');
        return;
      }
      
      // If we've already successfully authorised, skip further checks
      if (hasCheckedAuth.current && authStatus === 'authorised') {
        console.log('[TDL] Already authorised, skipping duplicate check.');
        return;
      }
      
      authCheckInProgress.current = true;

      if (sessionUser) {
        console.log('[TDL] User found. Fetching profile for user_id:', sessionUser.id);
        try {
          // Check if user is a teacher
          const { data: teacherProfile, error: profileError } = await supabase
            .from('teacher_profiles')
            .select('user_id')
            .eq('user_id', sessionUser.id)
            .maybeSingle();

          if (profileError || !teacherProfile) {
            if (profileError) {
              console.error('[TDL] Teacher profile fetch error:', profileError.message);
            } else {
              console.log('[TDL] No teacher profile found for user.');
            }
            
            // Check if they're a student instead
            const { data: studentProfile } = await supabase
              .from('students')
              .select('auth_user_id')
              .eq('auth_user_id', sessionUser.id)
              .maybeSingle();
              
            if (studentProfile) {
              console.log('[TDL] User is a student. Redirecting to student dashboard.');
              setAuthStatus('unauthorised');
              router.push('/student/dashboard');
            } else {
              console.log('[TDL] No profile found. Redirecting to /auth/verify-profile.');
              setAuthStatus('unauthorised');
              router.push('/auth/verify-profile');
            }
          } else if (teacherProfile) {
            console.log('[TDL] User is teacher. Authorised.');
            setAuthStatus('authorised');
            hasCheckedAuth.current = true;
          } else {
            console.log('[TDL] No teacher profile found. Unauthorised. Redirecting to /.');
            setAuthStatus('unauthorised');
            router.push('/');
          }
        } catch (e) {
          console.error('[TDL] Exception during profile fetch:', e, 'Redirecting to /auth.');
          setAuthStatus('unauthorised');
          router.push('/auth');
        }
      } else {
        console.log('[TDL] No user in session. Unauthorised. Redirecting to /auth.');
        setAuthStatus('unauthorised');
        router.push('/auth');
      }
      
      authCheckInProgress.current = false;
    };

    // Initial auth check
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!hasCheckedAuth.current) {
        checkAuth(user);
      }
    });
    
    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`[TDL] onAuthStateChange event: ${event}`, session);
        // Only check auth on sign in/out events to avoid unnecessary re-checks
        // Skip INITIAL_SESSION since we already do an initial check above
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          // Reset the flag on sign in/out so we re-check
          hasCheckedAuth.current = false;
          checkAuth(session?.user || null);
        }
      }
    );

    return () => {
      console.log('[TDL] Unsubscribing from onAuthStateChange.');
      authListener.subscription?.unsubscribe();
    };
  }, [router]); // Removed authStatus to prevent re-checks when state changes

  console.log('[TDL] Render. AuthStatus:', authStatus);

  if (authStatus === 'loading') {
    return <FullPageLoader message="Loading Teacher Dashboard..." variant="dots" />;
  }

  if (authStatus === 'unauthorised') {
    console.log('[TDL] Rendering null because unauthorised (redirect initiated).');
    return null; 
  }

  // authStatus === 'authorised'
  console.log('[TDL] Rendering dashboard content.');
  return (
    <OnboardingProvider>
      <DashboardLayoutContainer>
        {/* Desktop header - hidden on mobile */}
        <Header />
        
        {/* Add the profile check component that will automatically repair
            teacher profiles if needed */}
        <TeacherProfileCheck />
        
        {/* Modern navigation sidebar */}
        <ModernNavWithOnboarding />
        
        <MainContent
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <ContentContainer>
            <AnimatePresence mode="wait">
              {children}
            </AnimatePresence>
          </ContentContainer>
        </MainContent>
        
        {/* Minimal footer at the bottom */}
        <MinimalFooter />
      </DashboardLayoutContainer>
    </OnboardingProvider>
  );
}