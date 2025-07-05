// src/components/layout/Header.tsx
'use client';

import styled from 'styled-components';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client'; // Your client import
import { Container } from '@/styles/StyledComponents';
import HeaderNavigation from '@/components/layout/HeaderNavigation';
import { ModernButton } from '@/components/shared/ModernButton';
import SignInDropdown from '@/components/auth/SignInDropdown';
import { APP_NAME } from '@/lib/utils/constants';
import type { User } from '@supabase/supabase-js';
import { usePathname } from 'next/navigation';

const HeaderWrapper = styled.header`
  background: ${({ theme }) => theme.colors.ui.background};
  border-bottom: 1px solid ${({ theme }) => theme.colors.ui.border};
  padding: 12px 0;
  position: sticky;
  top: 0;
  z-index: 100;
  min-height: 60px;
  display: flex;
  align-items: center;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    min-height: 56px;
    padding: 8px 0;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative; /* For absolute positioning of Nav */
  min-height: 48px; /* Reduced from 60px */
  width: 100%;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.spacing.sm};
    /* Ensure logo and user section stay on first row */
    > *:nth-child(1) { /* Logo */
      flex: 1;
      min-width: 0;
    }
    > *:nth-child(2) { /* Navigation */
      order: 3;
      width: 100%;
    }
    > *:nth-child(3) { /* User section */
      flex-shrink: 0;
    }
  }
`;

const Logo = styled(Link)`
  font-size: 1.6rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.brand.primary};
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
  flex-shrink: 1; /* Allow logo to shrink if needed */
  min-width: 0; /* Allow shrinking below content size */
  max-width: 100%; /* Prevent overflow */
  
  /* Create a proper container for logo images */
  > * {
    display: flex;
    align-items: center;
  }
  
  &:hover {
    color: ${({ theme }) => theme.colors.brand.primary};
  }
  
  /* Adjust logo on mobile */
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 0;
    padding: ${({ theme }) => theme.spacing.xs} 0;
    flex: 1; /* Take available space but don't overflow */
    min-width: 0;
    max-width: calc(100% - 120px); /* Leave space for user section */
  }
  
  @media (max-width: 480px) {
    max-width: calc(100% - 100px); /* More space on very small screens */
  }
`;

const LogoImage = styled(Image)`
  height: auto;
  width: auto;
  max-height: 65px;
  max-width: 180px;
  object-fit: contain;
  flex-shrink: 0; /* Don't allow shrinking */
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    max-height: 55px;
    max-width: 150px;
  }
  
  @media (max-width: 480px) {
    max-height: 48px;
    max-width: 120px;
  }
  
  @media (max-width: 380px) {
    max-height: 42px;
    max-width: 100px;
  }
`;

const SiteTitleImage = styled(Image)`
  height: auto;
  width: auto;
  max-height: 48px; /* Reduced from 56px */
  object-fit: contain;
  display: block;
  position: relative;
  /* Allow the image to maintain its natural aspect ratio */
  flex-shrink: 0;
  margin-left: -8px; /* Increased negative margin to bring closer to logo */
  
  /* Mobile responsiveness */
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    max-height: 40px; /* Reduced from 45px */
    margin-left: -5px; /* Less negative margin on mobile */
  }
  
  /* Very small screens */
  @media (max-width: 380px) {
    max-height: 38px;
    margin-left: -3px;
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  flex-shrink: 0; /* Prevent shrinking */
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: ${({ theme }) => theme.spacing.sm};
    justify-content: flex-end;
    /* Reduced min-width to give more space to logo */
  }
  
  @media (max-width: 480px) {
    gap: ${({ theme }) => theme.spacing.xs};
  }
`;

const HeaderButton = styled(ModernButton)`
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
    font-size: 0.9rem;
  }
`;


const ProfileButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.ui.backgroundLight};
  color: ${({ theme }) => theme.colors.text.primary};
  text-decoration: none;
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-weight: 500;
  font-size: 0.9rem;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.ui.backgroundDark};
    border-color: ${({ theme }) => theme.colors.brand.primary};
    color: ${({ theme }) => theme.colors.brand.primary};
    transform: translateY(-1px);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
    font-size: 0.8rem;
    gap: 4px;
    
    span {
      font-size: 0.7rem;
    }
  }
`;

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const supabase = createClient(); // Supabase client initialized here
  const pathname = usePathname();

  // --- START OF CODE TO ADD/VERIFY ---
  useEffect(() => {
    // Expose supabase client to the window object FOR TESTING PURPOSES ONLY
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      // @ts-expect-error // TypeScript might complain, ignore for testing
      window.supabaseClientInstance = supabase;
      console.log("Supabase client instance EXPOSED to window.supabaseClientInstance for testing.");
    }
  }, [supabase]); // Dependency array includes supabase
  // --- END OF CODE TO ADD/VERIFY ---

  useEffect(() => {
    const getUserInfo = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      if (currentUser) {
        // Check students table first
        const { data: studentProfile, error: studentError } = await supabase
          .from('students')
          .select('student_id, auth_user_id')
          .eq('auth_user_id', currentUser.id)
          .maybeSingle();
        
        if (studentProfile && !studentError) {
          setUserRole('student');
        } else {
          // Check teacher_profiles
          const { data: teacherProfile, error: teacherError } = await supabase
            .from('teacher_profiles')
            .select('user_id')
            .eq('user_id', currentUser.id)
            .maybeSingle();
            
          if (teacherProfile && !teacherError) {
            setUserRole('teacher');
          } else {
            setUserRole(null);
          }
        }
      } else {
        setUserRole(null);
      }
    };
    
    getUserInfo();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user || null;
      setUser(sessionUser);
      
      if (sessionUser) {
        // Check students table first
        supabase
          .from('students')
          .select('student_id, auth_user_id')
          .eq('auth_user_id', sessionUser.id)
          .maybeSingle()
          .then(({ data: studentData, error: studentError }) => {
            if (studentData) {
              setUserRole('student');
            } else {
              // Check teacher_profiles
              supabase
                .from('teacher_profiles')
                .select('user_id')
                .eq('user_id', sessionUser.id)
                .maybeSingle()
                .then(({ data: teacherData, error: profileError }) => {
                  if (profileError) {
                    console.warn("Error fetching profile on auth state change:", profileError.message);
                    setUserRole(null);
                    return;
                  }
                  if (teacherData) {
                    setUserRole('teacher');
                  } else {
                    setUserRole(null);
                  }
                });
            }
          });
      } else {
        setUserRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]); // supabase is already a dependency here

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; 
  };


  return (
    <HeaderWrapper>
      <Container>
        <HeaderContent>
          <Logo href="/">
            <LogoImage 
              src="/images/skolr_bulb.png?v=2" 
              alt="Skolr Logo" 
              width={140} 
              height={90} 
              priority
              unoptimized={true}
              style={{
                maxWidth: '100%',
                height: 'auto'
              }}
            />
          </Logo>
          
          <HeaderNavigation 
            user={user} 
            userRole={userRole} 
            pathname={pathname} 
          />
          
          <UserSection>
            {!user ? (
              <SignInDropdown />
            ) : (
              userRole !== 'teacher' && (
                <HeaderButton variant="ghost" onClick={handleSignOut}>
                  Sign Out
                </HeaderButton>
              )
            )}
          </UserSection>
        </HeaderContent>
      </Container>
    </HeaderWrapper>
  );
}