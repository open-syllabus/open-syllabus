// src/app/room/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styled from 'styled-components';
import { ModernStudentNav } from '@/components/student/ModernStudentNav';

const LayoutContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
`;

const MainContent = styled.main<{ $hasNav: boolean }>`
  flex: 1;
  margin-left: ${({ $hasNav }) => $hasNav ? '80px' : '0'};
  transition: margin-left 0.3s ease;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    margin-left: ${({ $hasNav }) => $hasNav ? '80px' : '0'};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-left: 0;
  }
`;

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const [showNav, setShowNav] = useState(false);
  
  useEffect(() => {
    // Check if we should show the nav based on URL params
    const uid = searchParams.get('uid');
    const isStudent = !!uid || searchParams.get('role') === 'student';
    setShowNav(isStudent);
  }, [searchParams]);
  
  return (
    <LayoutContainer>
      <ContentWrapper>
        {showNav && <ModernStudentNav />}
        <MainContent $hasNav={showNav}>
          {children}
        </MainContent>
      </ContentWrapper>
    </LayoutContainer>
  );
}