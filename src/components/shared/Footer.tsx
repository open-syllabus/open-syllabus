'use client';

import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';

const FooterContainer = styled.footer`
  background-color: #000000;
  color: #ffffff;
  padding: 20px 0;
  margin-top: auto;
  width: 100%;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
`;

const FooterWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
`;

const FooterLink = styled(Link)`
  color: #999999;
  text-decoration: none;
  display: inline-block;
  padding: 2px 0;
  font-size: 12px;
  transition: color 0.2s ease;
  margin-right: 16px;
  
  &:hover {
    color: #ffffff;
  }
  
  &:last-child {
    margin-right: 0;
  }
`;

const Copyright = styled.p`
  color: #666666;
  font-size: 12px;
  margin: 0;
`;

const CompanyInfo = styled.div`
  color: #666666;
  font-size: 12px;
  text-align: right;
  
  @media (max-width: 768px) {
    text-align: center;
  }
`;

const FooterLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
`;

const CopyrightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Separator = styled.span`
  color: #333;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <FooterContainer>
      <FooterContent>
        <FooterWrapper>
          <FooterLinks>
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href="/terms">Terms</FooterLink>
            <FooterLink href="/cookies">Cookies</FooterLink>
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
          </FooterLinks>
          
          <CopyrightSection>
            <Copyright>
              © {currentYear} Skolr
            </Copyright>
            <Separator>•</Separator>
            <CompanyInfo>
              Registered in England and Wales
            </CompanyInfo>
          </CopyrightSection>
        </FooterWrapper>
      </FooterContent>
    </FooterContainer>
  );
}