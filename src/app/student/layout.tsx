// src/app/student/layout.tsx
'use client';

import styled from 'styled-components';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Container } from '@/styles/StyledComponents';
import Header from '@/components/layout/Header';
import MinimalFooter from '@/components/layout/MinimalFooter';
import StudentProfileCheck from '@/components/student/StudentProfileCheck';
import { ModernStudentNav } from '@/components/student/ModernStudentNav';
import LightbulbLoader from '@/components/shared/LightbulbLoader';

const StudentLayout = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.ui.background};
`;

const MainWrapper = styled.div`
  display: flex;
  flex: 1;
  position: relative;
`;

const ContentArea = styled.div`
  flex: 1;
  margin-left: 80px;
  margin-right: 80px;
  transition: margin-left 0.3s ease, margin-right 0.3s ease;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    margin-left: 0;
    margin-right: 0;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding-top: 80px; /* Increased top padding for mobile header */
    margin-left: 0;
    margin-right: 0;
  }
`;

const MainContent = styled.main`
  padding: 0;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${({ theme }) => theme.colors.ui.background};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

export default function StudentLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only run on client after mounting
    if (!isMounted) return;
    
    // Check if this is a direct redirect from login
    const url = new URL(window.location.href);
    // Check multiple patterns of direct access
    const isDirectLoginRedirect = url.searchParams.has('_t') || 
                                 url.searchParams.has('direct') || 
                                 url.searchParams.has('uid') || 
                                 url.searchParams.has('user_id') ||
                                 url.searchParams.has('access_signature') ||
                                 url.searchParams.has('pin_verified');
    
    // Check if this is a teacher preview
    const isTeacherPreview = url.searchParams.has('teacher_preview');
    
    // If this is a direct login redirect, skip the usual checks to prevent loops
    if (isDirectLoginRedirect) {
      console.log('Direct access detected - skipping auth check');
      
      // Check for student ID in URL or localStorage and store it
      const urlUserId = url.searchParams.get('user_id');
      const urlUid = url.searchParams.get('uid');
      
      // Try to get and save student ID
      if (urlUserId || urlUid) {
        const studentId = urlUserId || urlUid;
        console.log('Storing student ID from URL:', studentId);
        if (typeof window !== 'undefined' && studentId) {
          localStorage.setItem('student_direct_access_id', studentId);
          localStorage.setItem('current_student_id', studentId);
        }
      }
      
      setIsAuthorized(true);
      setIsLoading(false);
      return;
    }
    
    // If this is a teacher preview, allow access
    if (isTeacherPreview) {
      console.log('[Student Layout] Teacher preview mode - allowing access');
      setIsAuthorized(true);
      setIsLoading(false);
      return;
    }
    
    const checkAccess = async () => {
      console.log('[Student Layout] Checking student access...');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('[Student Layout] Auth check result:', !!user, user?.id);
        
        if (!user) {
          console.log('[Student Layout] No user found, redirecting to login');
          // Redirect to the auth page with student login tab active instead of join
          router.push('/auth?login=student');
          return;
        }

        // Check if user is a student in the students table
        const { data: studentProfile, error } = await supabase
          .from('students')
          .select('student_id, username, pin_code, auth_user_id')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        console.log('[Student Layout] User has authenticated, checking student profile:', { 
          userId: user.id, 
          hasProfile: !!studentProfile, 
          error: error?.message
        });

        if (studentProfile) {
          // User is a valid student
          console.log('[Student Layout] Valid student profile found');
          setIsAuthorized(true);
          setIsLoading(false);
          return;
        }

        // If no student profile, check if they're a teacher
        console.log('[Student Layout] No student profile found for user:', user.id);
        
        const { data: teacherProfile } = await supabase
          .from('teacher_profiles')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (teacherProfile) {
          // Check if this is a teacher previewing content
          const currentPath = window.location.pathname;
          const isPreviewingContent = currentPath.includes('/courses/') && currentPath.includes('/lessons/');
          
          console.log('[Student Layout] Teacher detected:', {
            userId: user.id,
            currentPath,
            isPreviewingContent,
            referrer: document.referrer
          });
          
          if (isPreviewingContent) {
            console.log('[Student Layout] Teacher is previewing lesson content - allowing access');
            setIsAuthorized(true);
            setIsLoading(false);
            return;
          }
          
          console.log('[Student Layout] User is a teacher - redirecting to teacher dashboard');
          router.push('/teacher-dashboard');
          return;
        }

        // User has no valid profile
        console.log('[Student Layout] No valid profile found, redirecting to home');
        router.push('/');
      } catch (error) {
        console.error('Error checking access:', error);
        // Redirect to student login page instead of join
        router.push('/auth?login=student');
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [router, supabase, isMounted]);

  if (isLoading) {
    return (
      <LoadingOverlay>
        <LightbulbLoader />
      </LoadingOverlay>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect
  }

  return (
    <StudentLayout>
      {/* Desktop header - hidden on mobile */}
      <Header />
      
      {/* Add StudentProfileCheck to automatically repair profiles if needed */}
      <StudentProfileCheck />
      <MainWrapper>
        <ModernStudentNav />
        <ContentArea>
          <Container>
            <MainContent>
              {children}
            </MainContent>
          </Container>
        </ContentArea>
      </MainWrapper>
      <MinimalFooter />
    </StudentLayout>
  );
}