// src/components/layout/MinimalFooter.tsx
'use client';

import styled from 'styled-components';
import Link from 'next/link';
import { APP_NAME } from '@/lib/utils/constants';

const FooterWrapper = styled.footer`
  background: ${({ theme }) => theme.colors.ui.backgroundLight};
  border-top: 1px solid ${({ theme }) => theme.colors.ui.border};
  padding: 16px 0;
  margin-top: auto;
`;

const FooterContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    text-align: center;
    padding: 0 16px;
    gap: 8px;
  }
`;

const Copyright = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 12px;
  margin: 0;
  opacity: 0.7;
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 12px;
  }
  
  a {
    color: ${({ theme }) => theme.colors.text.secondary};
    text-decoration: none;
    font-size: 12px;
    transition: all ${({ theme }) => theme.transitions.fast};
    opacity: 0.7;
    
    &:hover {
      color: ${({ theme }) => theme.colors.brand.primary};
      opacity: 1;
    }
  }
`;

export default function MinimalFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <FooterWrapper>
      <FooterContainer>
        <Copyright>
          © {currentYear} {APP_NAME}
        </Copyright>
        <FooterLinks>
          <Link href="/help">Help</Link>
          <Link href="/safety">Safety</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
        </FooterLinks>
      </FooterContainer>
    </FooterWrapper>
  );
}