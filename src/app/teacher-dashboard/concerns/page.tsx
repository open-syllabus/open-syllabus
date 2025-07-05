// src/app/teacher-dashboard/concerns/page.tsx
'use client';

import styled from 'styled-components';
import { motion } from 'framer-motion';
import ConcernsList from '@/components/teacher/ConcernsList';

const PageWrapper = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.ui.background};
  position: relative;
  padding: ${({ theme }) => theme.spacing.xl} 0;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.lg} 0;
  }
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.xl};
  position: relative;
  z-index: 1;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0 ${({ theme }) => theme.spacing.md};
  }
`;

const Header = styled(motion.div)`
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-bottom: ${({ theme }) => theme.spacing.xl};
  }
`;

const Title = styled(motion.h1)`
  margin: 0;
  font-size: 36px;
  font-weight: 800;
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.text.primary};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: 32px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 28px;
  }
`;

const Subtitle = styled(motion.p)`
  margin: ${({ theme }) => theme.spacing.sm} 0 0 0;
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.125rem;
  }
`;

const ContentWrapper = styled(motion.div)`
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.soft};
  padding: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.lg};
    border-radius: ${({ theme }) => theme.borderRadius.large};
  }
`;

const AlertBanner = styled(motion.div)`
  background: ${({ theme }) => theme.colors.ui.pastelPink};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  border-left: 4px solid ${({ theme }) => theme.colors.brand.coral};
  
  h3 {
    margin: 0 0 ${({ theme }) => theme.spacing.xs} 0;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 1.125rem;
    font-weight: 600;
  }
  
  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 1rem;
    line-height: 1.5;
  }
`;

export default function ConcernsPage() {
  return (
    <PageWrapper>
      <Container>
        <Header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Title>Student Welfare Concerns</Title>
          <Subtitle>Monitor and respond to safety alerts from your classrooms</Subtitle>
        </Header>
        
        <AlertBanner
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3>Important: Immediate Action Required</h3>
          <p>
            All concerns marked as "Pending" or "High Priority" should be reviewed promptly. 
            The system automatically flags messages that may indicate student welfare issues.
          </p>
        </AlertBanner>
        
        <ContentWrapper
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ConcernsList /> 
        </ContentWrapper>
      </Container>
    </PageWrapper>
  );
}