// Teacher Nerve Center - A delightful command center for educators
'use client';

import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  FiAlertTriangle, 
  FiUsers, 
  FiActivity,
  FiMessageSquare,
  FiTrendingUp,
  FiTrendingDown,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiSettings,
  FiPlus,
  FiZap,
  FiBookOpen,
  FiShield,
  FiBarChart,
  FiChevronRight,
  FiCircle,
  FiHome
} from 'react-icons/fi';
import { StatsCard } from '@/components/ui/UnifiedCards';
import { useOnboarding, OnboardingStep } from '@/contexts/OnboardingContext';
import { Highlight } from '@/components/onboarding/Highlight';
import { Tooltip } from '@/components/onboarding/Tooltip';

// Quirky welcome messages that rotate daily
const welcomeMessages = [
  "Ready to sprinkle some educational magic",
  "Time to conduct today's learning symphony",
  "Let's turn curious minds into brilliant ones",
  "Your mission: inspire the uninspirable",
  "Ready to cultivate some grey matter",
  "Time to architect some beautiful minds",
  "Let's brew up some enlightenment",
  "Ready to choreograph today's aha moments",
  "Time to navigate uncharted knowledge",
  "Let's decode the mysteries of learning",
  "Ready to engineer some breakthroughs",
  "Time to curate today's wisdom collection",
  "Let's sculpt some masterpiece minds",
  "Ready to ignite intellectual fireworks",
  "Time to orchestrate educational excellence",
  "Let's paint today's learning canvas",
  "Ready to weave knowledge into understanding",
  "Time to craft some cognitive adventures",
  "Let's build bridges to brilliance",
  "Ready to tune up those thinking engines",
  "Time to harvest today's insights",
  "Let's stir up some synaptic storms",
  "Ready to unlock hidden potential",
  "Time to serve up some brain food",
  "Let's design today's learning journey",
  "Ready to troubleshoot confusion",
  "Time to amplify those curious voices",
  "Let's construct knowledge skyscrapers",
  "Ready to pilot this learning expedition",
  "Time to cultivate intellectual courage",
  "Let's remix education into something extraordinary"
];

// Get a different message based on the day
const getDailyWelcome = (name?: string): string => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  const messageIndex = dayOfYear % welcomeMessages.length;
  const message = welcomeMessages[messageIndex];
  
  return name ? `${message}, ${name.split(' ')[0]}!` : `${message}!`;
};

// Main container with subtle gradient background
const NerveCenterContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #FAFBFC 0%, #F3F4F6 100%);
  padding: 32px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -200px;
    left: -200px;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, #EDE9FE 0%, transparent 70%);
    opacity: 0.2;
    pointer-events: none;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 24px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 16px;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

// Header with greeting and date
const Header = styled.header`
  margin-bottom: 32px;
`;

const Greeting = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
  font-family: ${({ theme }) => theme.fonts.heading};
  display: flex;
  align-items: center;
  gap: 12px;
  
  svg {
    width: 32px;
    height: 32px;
    color: #7C3AED;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.5rem;
    
    svg {
      width: 24px;
      height: 24px;
    }
  }
`;

const DateSubtext = styled.p`
  font-size: 1rem;
  color: #6B7280;
  margin: 0 0 12px 0;
  
  span {
    color: #111827;
    font-weight: 600;
  }
`;

const QuickStatsBar = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 16px;
  }
`;

const QuickStat = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
`;

const StatDot = styled.div<{ $status: 'active' | 'inactive' | 'alert' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $status }) => {
    switch ($status) {
      case 'active': return '#10B981';
      case 'alert': return '#F59E0B';
      case 'inactive': return '#9CA3AF';
      default: return '#9CA3AF';
    }
  }};
  animation: ${({ $status }) => $status === 'active' ? 'pulse 2s infinite' : 'none'};
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

// Alert Section
const AlertSection = styled(motion.section)`
  margin-bottom: 32px;
`;

const AlertContainer = styled(motion.div)<{ $severity: 'critical' | 'warning' }>`
  background: ${({ $severity }) => 
    $severity === 'critical' 
      ? 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)' 
      : 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)'};
  border: 1px solid ${({ $severity }) => 
    $severity === 'critical' ? '#FCA5A5' : '#FCD34D'};
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: ${({ $severity }) => 
      $severity === 'critical' ? '#DC2626' : '#F59E0B'};
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px ${({ $severity }) => 
      $severity === 'critical' 
        ? 'rgba(220, 38, 38, 0.15)' 
        : 'rgba(245, 158, 11, 0.15)'};
  }
`;

const AlertIcon = styled.div<{ $severity: 'critical' | 'warning' }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${({ $severity }) => 
    $severity === 'critical' ? '#DC2626' : '#F59E0B'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 24px;
    height: 24px;
  }
`;

const AlertContent = styled.div`
  flex: 1;
`;

const AlertTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
`;

const AlertSubtext = styled.p`
  font-size: 0.875rem;
  color: #4B5563;
  margin: 0;
`;

const AlertAction = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #374151;
  font-weight: 500;
  
  svg {
    transition: transform 0.2s ease;
  }
  
  ${AlertContainer}:hover & svg {
    transform: translateX(4px);
  }
`;

// Live Activity Section
const LiveActivitySection = styled(motion.section)`
  background: linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%);
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
  border: 1px solid #E5E7EB;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, #D1FAE5 0%, transparent 70%);
    opacity: 0.3;
    pointer-events: none;
  }
`;

// Recent Activity Section
const RecentActivitySection = styled(motion.section)`
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #E5E7EB;
  height: 100%;
`;

const ViewAllLink = styled.a`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  color: #6366F1;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: auto;
  
  &:hover {
    color: #4F46E5;
    transform: translateX(2px);
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const ActivityTimeline = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
`;

const ActivityIcon = styled.div<{ $type: string }>`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${({ $type }) => {
    switch ($type) {
      case 'student': return '#EDE9FE';
      case 'assessment': return '#D1FAE5';
      case 'concern': return '#FEF3C7';
      case 'room': return '#DBEAFE';
      default: return '#F3F4F6';
    }
  }};
  color: ${({ $type }) => {
    switch ($type) {
      case 'student': return '#6366F1';
      case 'assessment': return '#10B981';
      case 'concern': return '#F59E0B';
      case 'room': return '#3B82F6';
      default: return '#6B7280';
    }
  }};
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const ActivityContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ActivityText = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
  line-height: 1.4;
`;

const ActivityTime = styled.span`
  font-size: 0.75rem;
  color: #9CA3AF;
  margin-top: 2px;
  display: block;
`;

const ActivityItem = styled(motion.div)<{ $clickable: boolean; $type: string }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.ui.pastelGray};
  cursor: ${({ $clickable }) => $clickable ? 'pointer' : 'default'};
  transition: all 0.2s ease;
  
  ${({ $clickable }) => $clickable && `
    &:hover {
      background: #F9FAFB;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
  `}
  
  & > svg:last-child {
    color: #9CA3AF;
    flex-shrink: 0;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
`;

const SectionIcon = styled.div<{ $color?: string }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${({ $color }) => $color || '#ECFDF5'};
  color: ${({ $color }) => {
    switch ($color) {
      case '#EDE9FE': return '#6B21A8';
      case '#E0F2FE': return '#0369A1';
      case '#FCE7F3': return '#BE185D';
      case '#D1FAE5': return '#059669';
      default: return '#10B981';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  flex: 1;
`;

const LiveIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #10B981;
  font-weight: 500;
  
  svg {
    width: 8px;
    height: 8px;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`;

const RoomGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const RoomCard = styled(motion.div)`
  background: linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%);
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #6366F1 0%, #EC4899 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    background: white;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    
    &::before {
      opacity: 1;
    }
  }
`;

const RoomHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 12px;
`;

const RoomName = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
`;

const RoomStats = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 8px;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: #6B7280;
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const ActiveIndicator = styled.div<{ $count: number }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: ${({ $count }) => $count > 0 ? '#ECFDF5' : '#F3F4F6'};
  color: ${({ $count }) => $count > 0 ? '#10B981' : '#6B7280'};
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
`;

// Quick Actions Bar
const QuickActionsBar = styled(motion.section)`
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
  flex-wrap: wrap;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

const QuickActionButton = styled(motion.button)<{ $color?: 'purple' | 'blue' | 'pink' | 'green' }>`
  background: ${({ $color }) => {
    switch ($color) {
      case 'purple': return '#EDE9FE';
      case 'blue': return '#E0F2FE';
      case 'pink': return '#FCE7F3';
      case 'green': return '#D1FAE5';
      default: return 'white';
    }
  }};
  border: 2px solid ${({ $color }) => {
    switch ($color) {
      case 'purple': return '#DDD6FE';
      case 'blue': return '#BAE6FD';
      case 'pink': return '#F9A8D4';
      case 'green': return '#A7F3D0';
      default: return '#E5E7EB';
    }
  }};
  border-radius: 12px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ $color }) => {
    switch ($color) {
      case 'purple': return '#6B21A8';
      case 'blue': return '#0369A1';
      case 'pink': return '#BE185D';
      case 'green': return '#059669';
      default: return '#374151';
    }
  }};
  cursor: pointer;
  transition: all 0.2s ease;
  
  svg {
    width: 18px;
    height: 18px;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${({ $color }) => {
      switch ($color) {
        case 'purple': return 'rgba(139, 92, 246, 0.2)';
        case 'blue': return 'rgba(59, 130, 246, 0.2)';
        case 'pink': return 'rgba(236, 72, 153, 0.2)';
        case 'green': return 'rgba(16, 185, 129, 0.2)';
        default: return 'rgba(0, 0, 0, 0.1)';
      }
    }};
    background: ${({ $color }) => {
      switch ($color) {
        case 'purple': return '#DDD6FE';
        case 'blue': return '#BAE6FD';
        case 'pink': return '#F9A8D4';
        case 'green': return '#A7F3D0';
        default: return '#F3F4F6';
      }
    }};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    width: 100%;
    justify-content: center;
  }
`;

// Performance Metrics Section
const MetricsSection = styled(motion.section)`
  margin-bottom: 32px;
`;

// Stats Cards Grid - Consistent with other pages
const StatsCardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    gap: 16px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
`;

// Split Layout for Quick Actions and Recent Activity
const SplitSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: 1fr;
  }
`;

// Analysis Overview Section
const AnalysisOverviewSection = styled(motion.section)`
  background: white;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
  border: 1px solid #E5E7EB;
`;

const AnalysisGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 24px;
`;

const AnalysisCard = styled.div`
  background: #F9FAFB;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #E5E7EB;
`;

const AnalysisTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    width: 18px;
    height: 18px;
    color: #6366F1;
  }
`;

const AnalysisContent = styled.div`
  font-size: 0.875rem;
  color: #6B7280;
  line-height: 1.5;
`;

const AnalysisMetric = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  
  span:first-child {
    color: #6B7280;
  }
  
  span:last-child {
    font-weight: 600;
    color: #111827;
    text-align: right;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 50%;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
`;

const MetricCard = styled(motion.div)<{ $accentColor?: string }>`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #E5E7EB;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: ${({ $accentColor }) => $accentColor || '#6366F1'};
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: ${({ $accentColor }) => $accentColor || '#6366F1'}20;
  }
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 12px;
`;

const MetricTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 500;
  color: #6B7280;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MetricTrend = styled.div<{ $trend: 'up' | 'down' | 'neutral' }>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ $trend }) => 
    $trend === 'up' ? '#10B981' : 
    $trend === 'down' ? '#EF4444' : 
    '#6B7280'};
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const MetricValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
  margin-bottom: 4px;
`;

const MetricSubtext = styled.p`
  font-size: 0.875rem;
  color: #9CA3AF;
  margin: 0 0 8px 0;
`;

const MetricComparison = styled.div<{ $trend: 'up' | 'down' | 'neutral' }>`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ $trend }) => 
    $trend === 'up' ? '#10B981' : 
    $trend === 'down' ? '#EF4444' : 
    '#6B7280'};
  display: flex;
  align-items: center;
  gap: 4px;
  
  svg {
    width: 12px;
    height: 12px;
  }
`;

const MetricSparkline = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(to top, rgba(99, 102, 241, 0.1), transparent);
  opacity: 0.5;
`;

// Getting Started Section
const GettingStartedSection = styled(motion.section)`
  background: white;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
  border: 1px solid #E5E7EB;
`;

const StepsGrid = styled.div`
  display: grid;
  gap: 16px;
  margin-top: 24px;
`;

const StepCard = styled(motion.div)<{ $stepNumber: string; $status: 'completed' | 'active' | 'disabled' }>`
  background: ${({ $status }) => 
    $status === 'completed' ? '#F0FDF4' : 
    $status === 'active' ? '#F9FAFB' : 
    '#F9FAFB'};
  border: 2px solid ${({ $status }) => 
    $status === 'completed' ? '#86EFAC' : 
    $status === 'active' ? '#7C3AED' : 
    '#E5E7EB'};
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: ${({ $status }) => $status === 'disabled' ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  opacity: ${({ $status }) => $status === 'disabled' ? 0.6 : 1};
  
  &:hover {
    ${({ $status }) => $status !== 'disabled' && `
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    `}
  }
`;

const StepNumber = styled.div<{ $status: 'completed' | 'active' | 'disabled' }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${({ $status }) => 
    $status === 'completed' ? '#10B981' : 
    $status === 'active' ? '#7C3AED' : 
    '#E5E7EB'};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  flex-shrink: 0;
  
  svg {
    width: 24px;
    height: 24px;
  }
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
`;

const StepDescription = styled.p`
  font-size: 0.875rem;
  color: #6B7280;
  margin: 0;
`;

const StepAction = styled.div`
  color: #6B7280;
  
  svg {
    width: 20px;
    height: 20px;
    transition: transform 0.2s ease;
  }
  
  ${StepCard}:hover & svg {
    transform: translateX(4px);
  }
`;

// Quick Actions Section - Compact bar style
const QuickActionsSection = styled(motion.section)`
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #E5E7EB;
  height: 100%;
`;

const QuickActionsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ActionCard = styled(motion.div)<{ $color: 'purple' | 'blue' | 'pink' | 'green' }>`
  background: ${({ $color }) => {
    switch ($color) {
      case 'purple': return '#FAF5FF';
      case 'blue': return '#EFF6FF';
      case 'pink': return '#FDF2F8';
      case 'green': return '#F0FDF4';
      default: return '#F9FAFB';
    }
  }};
  border: 1px solid ${({ $color }) => {
    switch ($color) {
      case 'purple': return '#E9D5FF';
      case 'blue': return '#DBEAFE';
      case 'pink': return '#FBCFE8';
      case 'green': return '#BBF7D0';
      default: return '#E5E7EB';
    }
  }};
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  width: 100%;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${({ $color }) => {
      switch ($color) {
        case 'purple': return 'rgba(139, 92, 246, 0.15)';
        case 'blue': return 'rgba(59, 130, 246, 0.15)';
        case 'pink': return 'rgba(236, 72, 153, 0.15)';
        case 'green': return 'rgba(16, 185, 129, 0.15)';
        default: return 'rgba(0, 0, 0, 0.1)';
      }
    }};
  }
  
  svg:last-child {
    color: #9CA3AF;
    transition: all 0.2s ease;
  }
  
  &:hover svg:last-child {
    color: #6B7280;
    transform: translateX(4px);
  }
`;

const ActionIcon = styled.div<{ $color: 'purple' | 'blue' | 'pink' | 'green' }>`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${({ $color }) => {
    switch ($color) {
      case 'purple': return '#F3E8FF';
      case 'blue': return '#DBEAFE';
      case 'pink': return '#FCE7F3';
      case 'green': return '#D1FAE5';
      default: return '#F3F4F6';
    }
  }};
  color: ${({ $color }) => {
    switch ($color) {
      case 'purple': return '#7C3AED';
      case 'blue': return '#3B82F6';
      case 'pink': return '#EC4899';
      case 'green': return '#10B981';
      default: return '#6B7280';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

// ActionContent removed - no longer needed with compact design

const ActionTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
`;

const ActionDescription = styled.p`
  font-size: 0.75rem;
  color: #6B7280;
  margin: 0;
  display: none;
`;

// Empty State Component
const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #9CA3AF;
  
  svg {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
    opacity: 0.3;
  }
  
  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #6B7280;
    margin: 0 0 8px 0;
  }
  
  p {
    margin: 0;
    font-size: 0.875rem;
  }
`;

interface NerveCenterProps {
  stats: {
    totalStudents: number;
    activeRooms: number;
    totalRooms: number;
    totalChatbots: number;
    assessmentsCompleted: number;
    activeConcerns: number;
    roomEngagement?: any[];
  };
  recentActivity: Array<{
    id: string;
    type: string;
    content: string;
    time: string;
    navigationPath?: string;
  }>;
  teacherName: string | null;
  userId?: string;
  liveRoomData?: Array<{
    roomId: string;
    roomName: string;
    activeStudents: number;
    totalStudents: number;
    recentChats: number;
  }>;
}

export const TeacherNerveCenter: React.FC<NerveCenterProps> = ({ 
  stats, 
  recentActivity, 
  teacherName,
  userId,
  liveRoomData = []
}) => {
  const router = useRouter();
  const { currentStep, isOnboarding, completeStep, isLoading, startOnboarding } = useOnboarding();
  
  // Calculate meaningful metrics
  const engagementRate = stats.totalStudents > 0 
    ? Math.round((stats.assessmentsCompleted / stats.totalStudents) * 100) 
    : 0;
  
  const activeStudentsCount = liveRoomData.reduce((sum, room) => sum + room.activeStudents, 0);
  
  // Determine if there are alerts
  const hasAlerts = stats.activeConcerns > 0 || 
    recentActivity.some(a => a.type === 'concern') ||
    recentActivity.some(a => a.content.includes('waiting'));

  // Calculate additional metrics for analysis
  const averageEngagementRate = stats.totalStudents > 0
    ? Math.round((stats.assessmentsCompleted / stats.totalStudents) * 100)
    : 0;
    
  const completionRate = stats.totalStudents > 0
    ? Math.round((stats.assessmentsCompleted / (stats.totalStudents * stats.totalChatbots)) * 100)
    : 0;

  return (
    <NerveCenterContainer>
      <ContentWrapper>
        {/* Header */}
        <Header>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Greeting>
              <FiHome />
              {getDailyWelcome(teacherName || undefined)}
            </Greeting>
            <DateSubtext>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </DateSubtext>
            {userId && (
              <QuickStatsBar>
                {/* Usage display removed - unlimited in open source */}
              </QuickStatsBar>
            )}
          </motion.div>
        </Header>

        {/* Stats Cards - Consistent with other pages */}
        <StatsCardsGrid>
          <StatsCard
            icon={<FiUsers />}
            title="Total Students"
            value={stats.totalStudents}
            variant="primary"
            onClick={() => router.push('/teacher-dashboard/students')}
          />
          
          <StatsCard
            icon={<FiHome />}
            title="Active Rooms"
            value={`${stats.activeRooms}/${stats.totalRooms}`}
            variant="success"
            onClick={() => router.push('/teacher-dashboard/rooms')}
          />
          
          <StatsCard
            icon={<FiMessageSquare />}
            title="AI Skolrs"
            value={stats.totalChatbots}
            variant="secondary"
            onClick={() => router.push('/teacher-dashboard/chatbots')}
          />
          
          <StatsCard
            icon={<FiCheckCircle />}
            title="Assessments Done"
            value={stats.assessmentsCompleted}
            variant="warning"
            onClick={() => router.push('/teacher-dashboard/assessments')}
          />
        </StatsCardsGrid>

        {/* Alert Section */}
        {hasAlerts && (
          <AlertSection
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <AnimatePresence>
              {stats.activeConcerns > 0 && (
                <AlertContainer
                  $severity="critical"
                  onClick={() => router.push('/teacher-dashboard/concerns')}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <AlertIcon $severity="critical">
                    <FiAlertTriangle />
                  </AlertIcon>
                  <AlertContent>
                    <AlertTitle>
                      {stats.activeConcerns} Safety {stats.activeConcerns === 1 ? 'Concern' : 'Concerns'}
                    </AlertTitle>
                    <AlertSubtext>
                      Review flagged student messages immediately
                    </AlertSubtext>
                  </AlertContent>
                  <AlertAction>
                    Review Now <FiChevronRight />
                  </AlertAction>
                </AlertContainer>
              )}
            </AnimatePresence>
          </AlertSection>
        )}

        {/* Live Activity Monitor - Primary Focus */}
        {(stats.totalRooms > 0 || liveRoomData.length > 0) && (
          <LiveActivitySection
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <SectionHeader>
              <SectionIcon>
                <FiActivity />
              </SectionIcon>
              <SectionTitle>Room Activity Overview</SectionTitle>
              {activeStudentsCount > 0 && (
                <LiveIndicator>
                  <FiCircle fill="currentColor" />
                  {activeStudentsCount} {activeStudentsCount === 1 ? 'student' : 'students'} active this week
                </LiveIndicator>
              )}
            </SectionHeader>

            {liveRoomData.length > 0 ? (
              <RoomGrid>
                {liveRoomData.map((room, index) => (
                  <RoomCard
                    key={room.roomId}
                    onClick={() => router.push(`/teacher-dashboard/rooms/${room.roomId}`)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 + (index * 0.05) }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RoomHeader>
                      <RoomName>{room.roomName}</RoomName>
                      <ActiveIndicator $count={room.activeStudents}>
                        {room.activeStudents > 0 ? `${room.activeStudents} active` : 'Inactive'}
                      </ActiveIndicator>
                    </RoomHeader>
                    <RoomStats>
                      <StatItem>
                        <FiUsers />
                        {room.totalStudents} students
                      </StatItem>
                      <StatItem>
                        <FiMessageSquare />
                        {room.recentChats} chats today
                      </StatItem>
                    </RoomStats>
                  </RoomCard>
                ))}
              </RoomGrid>
            ) : (
              <EmptyState>
                <FiHome />
                <h3>No Recent Activity</h3>
                <p>Room activity from the past week will appear here</p>
                <motion.div style={{ marginTop: '24px' }}>
                  <QuickActionButton
                    onClick={() => router.push('/teacher-dashboard/rooms')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ margin: '0 auto' }}
                    $color="blue"
                  >
                    <FiPlus />
                    Create Your First Room
                  </QuickActionButton>
                </motion.div>
              </EmptyState>
            )}
          </LiveActivitySection>
        )}

        {/* Getting Started Section - Show when no data */}
        {stats.totalStudents === 0 && stats.totalChatbots === 0 && stats.totalRooms === 0 && (
          <GettingStartedSection
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <SectionHeader>
              <SectionIcon $color="#EDE9FE">
                <FiZap />
              </SectionIcon>
              <SectionTitle>Getting Started with Skolr</SectionTitle>
            </SectionHeader>
            
            <StepsGrid>
              <StepCard
                id="add-students-step"
                onClick={() => {
                  // If not in onboarding mode but user is new, start onboarding
                  if (!isOnboarding && stats.totalStudents === 0 && stats.totalChatbots === 0 && stats.totalRooms === 0) {
                    console.log('[TeacherNerveCenter] Starting onboarding for new user');
                    startOnboarding();
                  } else if (isOnboarding && currentStep === OnboardingStep.NAVIGATE_TO_STUDENTS) {
                    completeStep(OnboardingStep.NAVIGATE_TO_STUDENTS);
                  }
                  router.push('/teacher-dashboard/students');
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                $stepNumber="1"
                $status={stats.totalStudents > 0 ? 'completed' : 'active'}
              >
                <StepNumber $status={stats.totalStudents > 0 ? 'completed' : 'active'}>
                  {stats.totalStudents > 0 ? <FiCheckCircle /> : '1'}
                </StepNumber>
                <StepContent>
                  <StepTitle>Add Your Students</StepTitle>
                  <StepDescription>
                    Upload a CSV or add students individually to build your class list
                  </StepDescription>
                </StepContent>
                <StepAction>
                  <FiChevronRight />
                </StepAction>
              </StepCard>

              <StepCard
                onClick={() => router.push('/teacher-dashboard/rooms')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                $stepNumber="2"
                $status={stats.totalRooms > 0 ? 'completed' : stats.totalStudents > 0 ? 'active' : 'disabled'}
              >
                <StepNumber $status={stats.totalRooms > 0 ? 'completed' : stats.totalStudents > 0 ? 'active' : 'disabled'}>
                  {stats.totalRooms > 0 ? <FiCheckCircle /> : '2'}
                </StepNumber>
                <StepContent>
                  <StepTitle>Create Rooms</StepTitle>
                  <StepDescription>
                    Organise your students into classroom groups
                  </StepDescription>
                </StepContent>
                <StepAction>
                  <FiChevronRight />
                </StepAction>
              </StepCard>

              <StepCard
                onClick={() => router.push('/teacher-dashboard/chatbots')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                $stepNumber="3"
                $status={stats.totalChatbots > 0 ? 'completed' : stats.totalRooms > 0 ? 'active' : 'disabled'}
              >
                <StepNumber $status={stats.totalChatbots > 0 ? 'completed' : stats.totalRooms > 0 ? 'active' : 'disabled'}>
                  {stats.totalChatbots > 0 ? <FiCheckCircle /> : '3'}
                </StepNumber>
                <StepContent>
                  <StepTitle>Add Skolrs to Rooms</StepTitle>
                  <StepDescription>
                    Add AI learning assistants to your classroom rooms
                  </StepDescription>
                </StepContent>
                <StepAction>
                  <FiChevronRight />
                </StepAction>
              </StepCard>
            </StepsGrid>
          </GettingStartedSection>
        )}

        {/* Split Section: Quick Actions + Recent Activity */}
        <SplitSection>
          {/* Quick Actions - Left Side */}
          {(stats.totalStudents > 0 || stats.totalRooms > 0 || stats.totalChatbots > 0) && (
            <QuickActionsSection
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
            <SectionHeader>
              <SectionIcon $color="#FCE7F3">
                <FiPlus />
              </SectionIcon>
              <SectionTitle>Quick Actions</SectionTitle>
            </SectionHeader>
            
            <QuickActionsGrid>
              <ActionCard
                onClick={() => router.push('/teacher-dashboard/students')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                $color="purple"
              >
                <ActionIcon $color="purple">
                  <FiUsers />
                </ActionIcon>
                <ActionTitle>
                  {stats.totalStudents > 0 ? 'Manage Students' : 'Add Students'}
                </ActionTitle>
              </ActionCard>

              <ActionCard
                onClick={() => router.push('/teacher-dashboard/rooms')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                $color="blue"
              >
                <ActionIcon $color="blue">
                  <FiHome />
                </ActionIcon>
                <ActionTitle>
                  {stats.totalRooms > 0 ? 'Manage Rooms' : 'Create Rooms'}
                </ActionTitle>
              </ActionCard>

              <ActionCard
                onClick={() => router.push('/teacher-dashboard/chatbots')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                $color="pink"
              >
                <ActionIcon $color="pink">
                  <FiMessageSquare />
                </ActionIcon>
                <ActionTitle>Manage Skolrs</ActionTitle>
              </ActionCard>

              <ActionCard
                onClick={() => router.push('/teacher-dashboard/assessments')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                $color="green"
              >
                <ActionIcon $color="green">
                  <FiBookOpen />
                </ActionIcon>
                <ActionTitle>View Assessments</ActionTitle>
              </ActionCard>
            </QuickActionsGrid>
          </QuickActionsSection>
          )}
          
          {/* Recent Activity - Right Side */}
          {recentActivity.length > 0 && (
            <RecentActivitySection
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <SectionHeader>
                <SectionIcon $color="#F3F4F6">
                  <FiClock />
                </SectionIcon>
                <SectionTitle>Recent Activity</SectionTitle>
                <ViewAllLink onClick={() => router.push('/teacher-dashboard/activity')}>
                  View all
                  <FiChevronRight />
                </ViewAllLink>
              </SectionHeader>
            
            <ActivityTimeline>
              {recentActivity.slice(0, 5).map((activity, index) => (
                <ActivityItem
                  key={activity.id}
                  onClick={() => activity.navigationPath && router.push(activity.navigationPath)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * index }}
                  whileHover={{ x: 4 }}
                  $clickable={!!activity.navigationPath}
                  $type={activity.type}
                >
                  <ActivityIcon $type={activity.type}>
                    {activity.type === 'student' && <FiUsers />}
                    {activity.type === 'assessment' && <FiCheckCircle />}
                    {activity.type === 'concern' && <FiAlertTriangle />}
                    {activity.type === 'room' && <FiHome />}
                  </ActivityIcon>
                  <ActivityContent>
                    <ActivityText>{activity.content}</ActivityText>
                    <ActivityTime>{activity.time}</ActivityTime>
                  </ActivityContent>
                  {activity.navigationPath && <FiChevronRight size={16} />}
                </ActivityItem>
              ))}
            </ActivityTimeline>
          </RecentActivitySection>
          )}
        </SplitSection>

        {/* Analysis Overview Section */}
        {stats.totalStudents > 0 && (
          <AnalysisOverviewSection
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <SectionHeader>
              <SectionIcon $color="#EDE9FE">
                <FiBarChart />
              </SectionIcon>
              <SectionTitle>Analysis Overview</SectionTitle>
            </SectionHeader>
            
            <AnalysisGrid>
              <AnalysisCard>
                <AnalysisTitle>
                  <FiTrendingUp />
                  Engagement Overview
                </AnalysisTitle>
                <AnalysisContent>
                  <AnalysisMetric>
                    <span>Average Engagement</span>
                    <span>{averageEngagementRate}%</span>
                  </AnalysisMetric>
                  <AnalysisMetric>
                    <span>Active Students (Past Week)</span>
                    <span>{activeStudentsCount}</span>
                  </AnalysisMetric>
                  <AnalysisMetric>
                    <span>Completion Rate</span>
                    <span>{completionRate}%</span>
                  </AnalysisMetric>
                </AnalysisContent>
              </AnalysisCard>

              <AnalysisCard>
                <AnalysisTitle>
                  <FiActivity />
                  Learning Activity
                </AnalysisTitle>
                <AnalysisContent>
                  <AnalysisMetric>
                    <span>Most Active Room (This Week)</span>
                    <span>{liveRoomData.length > 0 ? liveRoomData.sort((a, b) => b.activeStudents - a.activeStudents)[0].roomName : 'N/A'}</span>
                  </AnalysisMetric>
                  <AnalysisMetric>
                    <span>Chats (Last 24 Hours)</span>
                    <span>{liveRoomData.reduce((sum, room) => sum + room.recentChats, 0)}</span>
                  </AnalysisMetric>
                  <AnalysisMetric>
                    <span>Avg Students per Room</span>
                    <span>{stats.totalRooms > 0 ? Math.round(stats.totalStudents / stats.totalRooms) : 0}</span>
                  </AnalysisMetric>
                </AnalysisContent>
              </AnalysisCard>

              <AnalysisCard>
                <AnalysisTitle>
                  <FiBookOpen />
                  Assessment Insights
                </AnalysisTitle>
                <AnalysisContent>
                  <AnalysisMetric>
                    <span>Assessments per Student</span>
                    <span>{stats.totalStudents > 0 ? (stats.assessmentsCompleted / stats.totalStudents).toFixed(1) : 0}</span>
                  </AnalysisMetric>
                  <AnalysisMetric>
                    <span>Total Completed</span>
                    <span>{stats.assessmentsCompleted}</span>
                  </AnalysisMetric>
                  <AnalysisMetric>
                    <span>Skolr Utilisation</span>
                    <span>{stats.totalChatbots > 0 ? Math.round((stats.assessmentsCompleted / stats.totalChatbots) * 10) : 0}%</span>
                  </AnalysisMetric>
                </AnalysisContent>
              </AnalysisCard>
            </AnalysisGrid>
          </AnalysisOverviewSection>
        )}

      </ContentWrapper>
      
      {/* Onboarding Highlight and Tooltip - rendered at the end to ensure proper z-index */}
      {!isLoading && (
        <>
          <Highlight
            selector="#add-students-step"
            show={isOnboarding && currentStep === OnboardingStep.NAVIGATE_TO_STUDENTS}
            cutout={true}
          />
          <Tooltip
            key={`tooltip-${currentStep}`}
            selector="#add-students-step"
            title="Welcome to Skolr!"
            text="Let's start by adding your students. Click this button to begin building your class list."
            buttonText="Got it"
            onButtonClick={() => {
              console.log('Tooltip dismissed, but highlight remains');
              // Don't complete the step here - let the button click do it
            }}
            show={isOnboarding && currentStep === OnboardingStep.NAVIGATE_TO_STUDENTS}
            placement="bottom"
          />
        </>
      )}
    </NerveCenterContainer>
  );
};