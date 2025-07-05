// src/components/layout/Footer.tsx
'use client';

import styled, { css } from 'styled-components';
import Link from 'next/link';
import { APP_NAME } from '@/lib/utils/constants';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
const FooterWrapper = styled.footer`
  background: ${({ theme }) => theme.colors.ui.backgroundDark};
  backdrop-filter: blur(20px);
  border-top: 1px solid ${({ theme }) => theme.colors.ui.border};
  padding: 40px 0 24px 0;
  margin-top: auto;
  position: relative;
  
  /* Subtle gradient overlay */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent,
      ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.3)} 20%,
      ${({ theme }) => hexToRgba(theme.colors.brand.accent, 0.3)} 50%,
      ${({ theme }) => hexToRgba(theme.colors.brand.magenta, 0.3)} 80%,
      transparent
    );
  }
`;

const FooterContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0 16px;
  }
`;

const FooterContent = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 32px;
  margin-bottom: 32px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    text-align: center;
  }
`;

const FooterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FooterBrand = styled.div`
  h3 {
    font-size: 20px;
    font-weight: 700;
    font-family: ${({ theme }) => theme.fonts.display};
    text-transform: uppercase;
    margin: 0 0 8px 0;
    background: linear-gradient(135deg, 
      ${({ theme }) => theme.colors.brand.primary}, 
      ${({ theme }) => theme.colors.brand.accent}
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  p {
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 13px;
    line-height: 1.5;
    margin: 0;
    opacity: 0.8;
  }
`;

const FooterHeading = styled.h4`
  font-size: 14px;
  font-weight: 600;
  font-family: ${({ theme }) => theme.fonts.heading};
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.primaryInverse};
  margin: 0 0 12px 0;
  letter-spacing: 1px;
`;

const FooterLinks = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  a {
    color: ${({ theme }) => theme.colors.text.secondary};
    text-decoration: none;
    font-size: 13px;
    transition: all ${({ theme }) => theme.transitions.fast};
    opacity: 0.7;
    
    &:hover {
      color: ${({ theme }) => theme.colors.brand.primary};
      opacity: 1;
      transform: translateX(4px);
    }
  }
`;

const FooterBottom = styled.div`
  padding-top: 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.ui.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    text-align: center;
  }
`;

const Copyright = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 12px;
  margin: 0;
  opacity: 0.6;
`;

const LegalLinks = styled.div`
  display: flex;
  gap: 20px;
  
  a {
    color: ${({ theme }) => theme.colors.text.secondary};
    text-decoration: none;
    font-size: 12px;
    transition: all ${({ theme }) => theme.transitions.fast};
    opacity: 0.6;
    
    &:hover {
      color: ${({ theme }) => theme.colors.brand.primary};
      opacity: 1;
    }
  }
`;

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <FooterWrapper>
      <FooterContainer>
        <FooterContent>
          <FooterBrand>
            <h3>{APP_NAME}</h3>
            <p>
              Empowering education through AI-powered learning companions. 
              Create engaging, personalized learning experiences for every student.
            </p>
          </FooterBrand>
          
          <FooterSection>
            <FooterHeading>For Teachers</FooterHeading>
            <FooterLinks>
              <Link href="/auth?type=teacher_signup">Sign Up</Link>
              <Link href="/auth?type=teacher_login">Login</Link>
              <Link href="/teacher-dashboard">Dashboard</Link>
              <Link href="/features/teachers">Features</Link>
            </FooterLinks>
          </FooterSection>
          
          <FooterSection>
            <FooterHeading>For Students</FooterHeading>
            <FooterLinks>
              <Link href="/student-access">Student Login</Link>
              <Link href="/join-room">Join a Room</Link>
              <Link href="/student/dashboard">My Rooms</Link>
              <Link href="/features/students">How It Works</Link>
            </FooterLinks>
          </FooterSection>
          
          <FooterSection>
            <FooterHeading>Resources</FooterHeading>
            <FooterLinks>
              <Link href="/help">Help Center</Link>
              <Link href="/safety">Safety</Link>
              <Link href="/contact">Contact Us</Link>
              <Link href="/about">About</Link>
            </FooterLinks>
          </FooterSection>
        </FooterContent>
        
        <FooterBottom>
          <Copyright>
            © {currentYear} {APP_NAME}. All rights reserved.
          </Copyright>
          <LegalLinks>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/cookies">Cookie Policy</Link>
          </LegalLinks>
        </FooterBottom>
      </FooterContainer>
    </FooterWrapper>
  );
}