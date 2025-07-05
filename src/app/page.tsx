// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import styled, { useTheme, keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/utils/constants';
import { ModernButton } from '@/components/shared/ModernButton';
import Footer from '@/components/layout/Footer';
import { FiUsers, FiBookOpen, FiArrowRight, FiUser, FiLogIn, FiHeart, FiZap, FiStar, FiAward, FiActivity, FiBarChart2 } from 'react-icons/fi';
import Image from 'next/image';

import TerminalText from '@/components/shared/TerminalText';
import RotatingSubtitle from '@/components/shared/RotatingSubtitle';

// Animations
const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(-2deg); }
  50% { transform: translateY(-20px) rotate(2deg); }
`;

const glow = keyframes`
  0%, 100% { filter: brightness(1) drop-shadow(0 0 20px rgba(255, 220, 120, 0.5)); }
  50% { filter: brightness(1.2) drop-shadow(0 0 40px rgba(255, 220, 120, 0.8)); }
`;

const sparkle = keyframes`
  0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
  50% { opacity: 1; transform: scale(1) rotate(180deg); }
`;

const HomePage = styled.div`
  display: grid;
  grid-template-rows: 20px 1fr 20px;
  align-items: center;
  justify-items: center;
  min-height: 100svh;
  padding: 40px;
  gap: 40px;
  font-family: ${({ theme }) => theme.fonts.body};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 20px;
    padding-bottom: 60px;
  }

  background: linear-gradient(180deg, #FAFBFC 0%, #F3F4F6 100%);
  position: relative;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  width: 100%;
  
  /* Animated gradient background */
  &::before {
    content: '';
    position: fixed;
    top: -50%;
    left: -50%;
    right: -50%;
    bottom: -50%;
    background: 
      radial-gradient(circle at 20% 30%, rgba(124, 58, 237, 0.05) 0%, transparent 40%),
      radial-gradient(circle at 80% 60%, rgba(251, 191, 36, 0.05) 0%, transparent 40%),
      radial-gradient(circle at 60% 90%, rgba(34, 197, 94, 0.05) 0%, transparent 40%),
      radial-gradient(circle at 40% 10%, rgba(239, 68, 68, 0.05) 0%, transparent 40%);
    pointer-events: none;
    z-index: 1;
    animation: rotate 60s linear infinite;
  }
  
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const MainSection = styled.main`
  display: flex;
  flex-direction: column;
  gap: 32px;
  grid-row-start: 2;

  ol {
    font-family: ${({ theme }) => theme.fonts.mono};
    padding-left: 0;
    margin: 0;
    font-size: 14px;
    line-height: 24px;
    letter-spacing: -0.01em;
    list-style-position: inside;
  }

  li:not(:last-of-type) {
    margin-bottom: 8px;
  }

  code {
    font-family: inherit;
    background: ${({ theme }) => theme.colors.ui.backgroundLight};
    padding: 2px 4px;
    border-radius: 4px;
    font-weight: 600;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    align-items: center;
    ol {
      text-align: center;
    }
  }
`;

const CTAButtonsStyled = styled.div`
  display: flex;
  gap: 16px;

  a {
    appearance: none;
    border-radius: 128px;
    height: 48px;
    padding: 0 20px;
    border: none;
    border: 1px solid transparent;
    transition:
      background 0.2s,
      color 0.2s,
      border-color 0.2s;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    line-height: 20px;
    font-weight: 500;
  }

  a.primary {
    background: ${({ theme }) => theme.colors.text.primary};
    color: ${({ theme }) => theme.colors.ui.background};
    gap: 8px;
  }

  a.secondary {
    border-color: ${({ theme }) => theme.colors.ui.border};
    min-width: 158px;
  }

  @media (hover: hover) and (pointer: fine) {
    a.primary:hover {
      background: ${({ theme }) => theme.colors.brand.primary};
      border-color: transparent;
    }

    a.secondary:hover {
      background: ${({ theme }) => theme.colors.ui.backgroundLight};
      border-color: transparent;
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    a {
      font-size: 14px;
      height: 40px;
      padding: 0 16px;
    }
    a.secondary {
      min-width: auto;
    }
  }
`;

const FooterStyled = styled.footer`
  grid-row-start: 3;
  display: flex;
  gap: 24px;

  a {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  img {
    /* filter removed as theme.colors.dark.grayRgb is not defined */
    flex-shrink: 0;
  }

  @media (hover: hover) and (pointer: fine) {
    a:hover {
      text-decoration: underline;
      text-underline-offset: 4px;
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
  }
`;

const QuoteSection = styled(motion.div)`
  text-align: center;
  margin: 48px auto;
  max-width: 800px;
  padding: 0 24px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    margin: 36px auto;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin: 24px auto;
    padding: 0 16px;
  }
`;

const Quote = styled.blockquote`
  font-size: 1.5rem;
  font-style: italic;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 16px 0;
  line-height: 1.6;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: 1.25rem;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.125rem;
  }
  
  &::before,
  &::after {
    content: '"';
    color: ${({ theme }) => theme.colors.brand.primary};
    font-size: 1.5em;
    line-height: 0;
    vertical-align: -0.4em;
  }
`;

const Author = styled.cite`
  font-size: 1.125rem;
  font-style: normal;
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 600;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1rem;
  }
  
  &::before {
    content: '— ';
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const HeroSection = styled.section`
  position: relative;
  z-index: 10;
  padding: 40px 0 60px 0;
  width: 100%;
  min-height: 90vh;
  display: flex;
  align-items: center;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 30px 0 40px 0;
    min-height: 80vh;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 20px 0 30px 0;
    min-height: 70vh;
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  width: 100%;
  box-sizing: border-box;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0 16px;
  }
`;

const HeroContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }
`;

const HeroLeft = styled.div`
  text-align: left;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    text-align: center;
  }
`;

const HeroRight = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 500px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    height: 400px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    height: 300px;
  }
`;

const HeroImageWrapper = styled(motion.div)`
  position: relative;
  width: 500px;
  height: 500px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: 400px;
    height: 400px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 320px;
    height: 320px;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const Sparkles = styled.div`
  position: absolute;
  inset: -50px;
  pointer-events: none;
`;

const Sparkle = styled(motion.div)`
  position: absolute;
  width: 20px;
  height: 20px;
  
  &::before {
    content: '✨';
    position: absolute;
    animation: ${sparkle} 3s ease-in-out infinite;
    animation-delay: var(--delay);
    font-size: var(--size);
  }
`;

const HeroTitle = styled(motion.h1)`
  font-size: 72px;
  font-weight: 800;
  font-family: ${({ theme }) => theme.fonts.heading};
  margin: 0 0 24px 0;
  line-height: 1.1;
  letter-spacing: -0.03em;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: 56px;
    margin: 0 0 20px 0;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 42px;
    margin: 0 0 16px 0;
    line-height: 1.2;
  }
`;

const HeroSubtitle = styled(motion.p)`
  font-size: 28px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 32px 0;
  line-height: 1.5;
  font-weight: 500;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: 24px;
    margin: 0 0 28px 0;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 20px;
    margin: 0 0 24px 0;
  }
`;

const HeroDescription = styled(motion.p)`
  font-size: 20px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 48px 0;
  line-height: 1.7;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: 18px;
    margin: 0 0 36px 0;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 16px;
    margin: 0 0 32px 0;
  }
`;

const CTAButtons = styled.div`
  display: flex;
  gap: 20px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    gap: 16px;
    justify-content: center;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    width: 100%;
    
    button {
      width: 100%;
    }
  }
`;

const MainContent = styled.div`
  flex: 1;
  position: relative;
  z-index: 1;
`;

const FeaturesSection = styled.section`
  padding: ${({ theme }) => `${theme.spacing.xxxxl} 0`};
  width: 100%;
  position: relative;
  z-index: 10;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: ${({ theme }) => `${theme.spacing.xxxl} 0`};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => `${theme.spacing.xxl} 0`};
  }
`;

const SectionHeader = styled(motion.div)`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xxxxl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-bottom: ${({ theme }) => theme.spacing.xxxl};
  }
`;

const SectionTitle = styled.h2`
  font-size: 48px;
  font-weight: 800;
  font-family: ${({ theme }) => theme.fonts.heading};
  margin: 0 0 ${({ theme }) => theme.spacing.lg} 0;
  line-height: 1.2;
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: -0.02em;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: 40px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 32px;
  }
`;

const SectionSubtitle = styled.p`
  font-size: 20px;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 18px;
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${({ theme }) => theme.spacing.lg};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

const FeatureCard = styled(motion.div)`
  background: white;
  border-radius: 24px;
  padding: ${({ theme }) => theme.spacing.xl};
  border: 2px solid ${({ theme }) => theme.colors.ui.border};
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: ${({ theme }) => theme.spacing.lg};
  }
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.12);
    border-color: ${({ theme }) => theme.colors.brand.primary}20;
    
    .feature-icon {
      transform: scale(1.1) rotate(5deg);
    }
  }
`;

const FeatureIcon = styled.div<{ $color: string }>`
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: ${({ $color }) => $color}15;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  transition: all 0.3s ease;
  
  svg {
    width: 40px;
    height: 40px;
    color: ${({ $color }) => $color};
  }
`;

const FeatureTitle = styled.h3`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  line-height: 1.3;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 20px;
  }
`;

const FeatureDescription = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
  margin: 0;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 15px;
  }
`;

// Stats Section
const StatsSection = styled.section`
  padding: ${({ theme }) => `${theme.spacing.xxxl} 0`};
  background: white;
  position: relative;
  z-index: 10;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => `${theme.spacing.xxl} 0`};
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${({ theme }) => theme.spacing.lg};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

const StatCard = styled(motion.div)`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.lg};
  }
`;

const StatNumber = styled.div`
  font-size: 56px;
  font-weight: 800;
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.brand.primary};
  line-height: 1;
`;

const StatLabel = styled.div`
  font-size: 18px;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: 500;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 16px;
  }
`;

const PathCardsSection = styled.section`
  padding: ${({ theme }) => `${theme.spacing.xxxl} 0`};
  width: 100%;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: ${({ theme }) => `${theme.spacing.xxl} 0`};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => `${theme.spacing.xl} 0`};
  }
`;

const PathCardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 60px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 30px;
  }
`;

const PathCard = styled(motion.div)`
  background: white;
  border-radius: 24px;
  padding: ${({ theme }) => theme.spacing.xl};
  border: 2px solid ${({ theme }) => theme.colors.ui.border};
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: visible;
  cursor: pointer;
  transition: all 0.3s ease;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: ${({ theme }) => theme.spacing.lg};
    min-height: 260px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.lg};
    min-height: 240px;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--gradient);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.12);
    border-color: ${({ theme }) => theme.colors.brand.primary}20;
    
    &::before {
      opacity: 1;
    }
    
    .path-icon {
      transform: scale(1.1) rotate(5deg);
    }
    
    .arrow-icon {
      transform: translateX(4px);
    }
  }
`;

const PathCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const PathCardIcon = styled.div<{ $color: string }>`
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: ${props => props.$color}15;
  color: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  
  svg {
    width: 32px;
    height: 32px;
    color: ${({ $color }) => $color};
  }
`;

const PathCardContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const PathCardTitle = styled.h3`
  font-size: 28px;
  font-weight: 700;
  font-family: ${({ theme }) => theme.fonts.heading};
  margin: 0 0 12px 0;
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.2;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: 24px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 22px;
    margin: 0 0 8px 0;
  }
`;

const PathCardDescription = styled.p`
  font-size: 17px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 ${({ theme }) => theme.spacing.lg} 0;
  line-height: 1.6;
  flex: 1;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: 16px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 15px;
    line-height: 1.5;
  }
`;

const PathCardAction = styled.div<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.$color};
  font-weight: 600;
  font-size: 16px;
  margin-top: auto;
  
  .arrow-icon {
    transition: transform 0.3s ease;
    flex-shrink: 0;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 15px;
  }
`;

const QuickJoinCard = styled(motion.div)`
  background: white;
  border-radius: 24px;
  padding: ${({ theme }) => theme.spacing.xl};
  border: 2px solid ${({ theme }) => theme.colors.brand.primary}20;
  box-shadow: 0 4px 24px rgba(124, 58, 237, 0.1);
  max-width: 400px;
  margin: 60px auto 0;
  text-align: center;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 24px;
    background: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%);
    opacity: 0;
    z-index: -1;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    &::before {
      opacity: 0.1;
    }
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: ${({ theme }) => theme.spacing.lg};
    max-width: 360px;
    margin-top: 40px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.lg};
    max-width: 100%;
  }
`;

const QuickJoinTitle = styled.h3`
  font-size: 24px;
  font-weight: 700;
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 20px 0;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 20px;
    margin: 0 0 16px 0;
  }
`;

const QuickJoinInput = styled.input`
  width: 100%;
  padding: 16px 20px;
  border: 2px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: 12px;
  font-size: 18px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 3px;
  font-weight: 600;
  transition: all 0.2s ease;
  background: ${({ theme }) => theme.colors.ui.background};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 14px 16px;
    font-size: 16px;
    letter-spacing: 2px;
  }
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 4px ${({ theme }) => theme.colors.brand.primary}15;
    background: white;
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.text.secondary};
    letter-spacing: 2px;
  }
`;

// Testimonials Section
const TestimonialsSection = styled.section`
  padding: ${({ theme }) => `${theme.spacing.xxxxl} 0`};
  background: ${({ theme }) => theme.colors.ui.pastelPurple};
  position: relative;
  z-index: 10;
  overflow: hidden;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => `${theme.spacing.xxxl} 0`};
  }
`;

const TestimonialsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.lg};
  }
`;

const TestimonialCard = styled(motion.div)`
  background: white;
  border-radius: 24px;
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  position: relative;
  
  &::before {
    content: '"';
    position: absolute;
    top: ${({ theme }) => theme.spacing.md};
    left: ${({ theme }) => theme.spacing.lg};
    font-size: 60px;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.brand.primary}15;
    font-family: serif;
  }
`;

const TestimonialText = styled.p`
  font-size: 18px;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing.lg} 0;
  font-style: italic;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 16px;
  }
`;

const TestimonialAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const AuthorAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.ui.pastelBlue};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 20px;
  color: ${({ theme }) => theme.colors.brand.accent};
`;

const AuthorInfo = styled.div``;

const AuthorName = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 2px;
`;

const AuthorRole = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;


export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const router = useRouter();
  const supabase = createClient();
  const theme = useTheme();

  useEffect(() => {
    setMounted(true);
    
    const checkUserAndRedirect = async () => {
      setIsRedirecting(false);

      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
        
        if (currentUser) {
          setIsRedirecting(true);
          
          // Check if user is a teacher
          const { data: teacherProfile } = await supabase
            .from('teacher_profiles')
            .select('user_id')
            .eq('user_id', currentUser.id)
            .maybeSingle();

          if (teacherProfile) {
            // Prefetch the teacher dashboard for faster navigation
            router.prefetch('/teacher-dashboard');
            router.push('/teacher-dashboard');
            return;
          }

          // Check if user is a student
          console.log('[Homepage] Checking if user is a student:', currentUser.id);
          const { data: studentProfile, error: studentError } = await supabase
            .from('students')
            .select('student_id, auth_user_id')
            .eq('auth_user_id', currentUser.id)
            .maybeSingle();

          console.log('[Homepage] Student check result:', { 
            hasProfile: !!studentProfile, 
            error: studentError?.message 
          });

          if (studentProfile) {
            console.log('[Homepage] Student found, redirecting to dashboard');
            router.push('/student/dashboard');
            return;
          }

          // No profile found - likely a teacher without profile
          // Redirect to verify-profile to create their profile
          console.log('[Homepage] No profile found for user, redirecting to verify-profile');
          router.push('/auth/verify-profile');
          return;
        }
      } catch (error) {
        console.error('Error in checkUserAndRedirect on homepage:', error);
        setIsRedirecting(false);
      }
    };

    checkUserAndRedirect();
  }, [router, supabase]);


  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      router.push(`/join-room?code=${roomCode.trim().toUpperCase()}`);
    }
  };

  // Show nothing or a minimal shell while mounting to avoid hydration mismatch
  if (!mounted || isRedirecting) {
    return (
      <HomePage>
        <HeroSection>
          <Container>
          </Container>
        </HeroSection>
      </HomePage>
    );
  }

  // Sparkle positions for the lightbulb
  const sparklePositions = [
    { top: '10%', left: '20%', delay: '0s', size: '20px' },
    { top: '15%', right: '25%', delay: '1s', size: '16px' },
    { top: '70%', left: '15%', delay: '2s', size: '18px' },
    { top: '80%', right: '20%', delay: '1.5s', size: '14px' },
    { top: '40%', left: '10%', delay: '0.5s', size: '22px' },
    { top: '50%', right: '10%', delay: '2.5s', size: '16px' },
  ];

  const features = [
    {
      icon: <FiBookOpen />,
      title: 'Smart AI Tutors',
      description: 'Create custom AI tutors that understand your curriculum',
      color: theme.colors.brand.primary
    },
    {
      icon: <FiUsers />,
      title: 'Safe Learning Spaces',
      description: 'Secure, monitored environments where students can learn at their own pace',
      color: theme.colors.brand.accent
    },
    {
      icon: <FiBarChart2 />,
      title: 'Progress Tracking',
      description: 'Real-time insights into student engagement and learning outcomes',
      color: theme.colors.brand.green
    },
    {
      icon: <FiHeart />,
      title: 'Student Wellbeing',
      description: 'Built-in safety features that prioritise student mental health',
      color: theme.colors.brand.coral
    },
    {
      icon: <FiZap />,
      title: 'Instant Feedback',
      description: '24/7 availability for homework help and concept clarification',
      color: theme.colors.brand.secondary
    },
    {
      icon: <FiAward />,
      title: 'Personalised Learning',
      description: 'Adaptive responses that match each student\'s level and needs',
      color: theme.colors.brand.magenta
    }
  ];


  return (
    <HomePage>
      {/* Prefetch links for logged-in users */}
      {user && (
        <>
          <Link href="/teacher-dashboard" prefetch={true} style={{ display: 'none' }} />
          <Link href="/student/dashboard" prefetch={true} style={{ display: 'none' }} />
        </>
      )}
      <MainSection>
        <HeroSection>
          <Container>
            <HeroContent>
              <HeroLeft>
                <HeroTitle
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <TerminalText />
                </HeroTitle>
                <HeroSubtitle
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <RotatingSubtitle />
                </HeroSubtitle>
                <HeroDescription
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  Build custom AI-powered learning assistants for your classroom in minutes. 
                  Safe, smart, and designed with learners in mind.
                </HeroDescription>
                
                {!user && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <CTAButtonsStyled>
                      <ModernButton                   
                        variant="primary"
                        size="large"
                        onClick={() => router.push('/auth?type=teacher_signup')}
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          fontSize: '1.125rem',
                          padding: '16px 32px',
                          boxShadow: '0 4px 24px rgba(124, 58, 237, 0.3)'
                        }}
                      >
                        <FiUser />
                        Start Teaching
                      </ModernButton>
                      <ModernButton                   
                        variant="secondary"
                        size="large"
                        onClick={() => router.push('/student-access')}
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          fontSize: '1.125rem',
                          padding: '16px 32px'
                        }}
                      >
                        <FiLogIn />
                        Student Login
                      </ModernButton>
                    </CTAButtonsStyled>
                  </motion.div>
                )}
              </HeroLeft>
              
              <HeroRight>
                <HeroImageWrapper
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <Image
                    src="/images/robot_hero.png"
                    alt="Skolr - Your AI Learning Assistant"
                    width={500}
                    height={500}
                    priority
                  />
                  <Sparkles>
                    {sparklePositions.map((pos, index) => (
                      <Sparkle
                        key={index}
                        style={{
                          top: pos.top,
                          left: pos.left,
                          right: pos.right,
                          '--delay': pos.delay,
                          '--size': pos.size
                        } as React.CSSProperties}
                      />
                    ))}
                  </Sparkles>
                </HeroImageWrapper>
              </HeroRight>
            </HeroContent>
          </Container>
        </HeroSection>

        {/* Features Section */}
        <FeaturesSection>
          <Container>
            <SectionHeader
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <SectionTitle>Everything You Need to Transform Learning</SectionTitle>
              <SectionSubtitle>
                Powerful features designed to make teaching easier and learning more engaging
              </SectionSubtitle>
            </SectionHeader>
            
            <FeaturesGrid>
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                >
                  <FeatureIcon className="feature-icon" $color={feature.color}>
                    {feature.icon}
                  </FeatureIcon>
                  <FeatureTitle>{feature.title}</FeatureTitle>
                  <FeatureDescription>{feature.description}</FeatureDescription>
                </FeatureCard>
              ))}
            </FeaturesGrid>
          </Container>
        </FeaturesSection>



        {/* Path Cards Section */}
        <PathCardsSection>
          <Container>
            <SectionHeader
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <SectionTitle>Ready to Get Started?</SectionTitle>
              <SectionSubtitle>
                Choose your path and begin transforming education today
              </SectionSubtitle>
            </SectionHeader>
            
            <PathCardsGrid style={{ gridTemplateColumns: 'repeat(2, 1fr)', maxWidth: '800px', margin: '0 auto' }}>
              <PathCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onClick={() => router.push('/auth?type=teacher_signup')}
                style={{ '--gradient': 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)' } as React.CSSProperties}
              >
                <PathCardIcon $color={theme.colors.brand.primary} className="path-icon">
                  <FiUser />
                </PathCardIcon>
                <PathCardContent>
                  <PathCardTitle>I'm a Teacher</PathCardTitle>
                  <PathCardDescription>
                    Create AI-powered learning rooms, upload materials, and monitor student progress in real-time
                  </PathCardDescription>
                </PathCardContent>
                <PathCardAction $color={theme.colors.brand.primary}>
                  Get Started <FiArrowRight className="arrow-icon" />
                </PathCardAction>
              </PathCard>

              <PathCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => router.push('/student-access')}
                style={{ '--gradient': 'linear-gradient(135deg, #3B82F6 0%, #10B981 100%)' } as React.CSSProperties}
              >
                <PathCardIcon $color={theme.colors.brand.accent} className="path-icon">
                  <FiBookOpen />
                </PathCardIcon>
                <PathCardContent>
                  <PathCardTitle>I'm a Student</PathCardTitle>
                  <PathCardDescription>
                    Access your learning space, chat with AI tutors, and track your progress
                  </PathCardDescription>
                </PathCardContent>
                <PathCardAction $color={theme.colors.brand.accent}>
                  Access Learning <FiArrowRight className="arrow-icon" />
                </PathCardAction>
              </PathCard>
            </PathCardsGrid>

          </Container>
        </PathCardsSection>

      </MainSection>

      <FooterStyled />
    </HomePage>
  );
}