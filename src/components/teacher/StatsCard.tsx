// src/components/teacher/StatsCard.tsx
'use client';

import styled, { DefaultTheme } from 'styled-components'; // Ensure DefaultTheme is imported
import { GlassCard, glassCardVariants } from '@/components/shared/GlassCard';

// Make sure this interface matches what DashboardOverview expects and provides
export interface StatsCardProps { 
  title: string;
  value: string | number;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'info' | 'warning' | 'danger'; 
}

// Helper function to get the actual color from the variant
const getVariantColor = (theme: DefaultTheme, variant: StatsCardProps['variant']): string => {
  switch (variant) {
    case 'primary': 
      return theme.colors.brand.primary;
    case 'secondary': 
      return theme.colors.brand.secondary;
    case 'accent': 
      return theme.colors.brand.accent;
    case 'info': 
      return theme.colors.status.info;
    case 'warning': 
      return theme.colors.status.warning;
    case 'danger': 
      return theme.colors.status.danger;
    default:
      return theme.colors.brand.primary;
  }
};

// Make sure the $variant prop passed from the component is correctly typed here
const StyledStatsCard = styled(GlassCard)<{ $clickable: boolean; $variant: StatsCardProps['variant'] }>`
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  transition: all ${({ theme }) => theme.transitions.normal};
  position: relative;
  overflow: hidden;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 12px;
    gap: 12px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 12px;
    gap: 12px;
  }
  
  /* Gradient border effect */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: ${({ theme, $variant }) => getVariantColor(theme, $variant)};
    transition: height ${({ theme }) => theme.transitions.normal};
  }
  
  &:hover::before {
    height: ${({ $clickable }) => ($clickable ? '8px' : '5px')};
  }

  .icon-wrapper {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${({ theme, $variant }) => `${getVariantColor(theme, $variant)}15`};
    border-radius: 12px;
    flex-shrink: 0;
    
    @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
      width: 36px;
      height: 36px;
      border-radius: 8px;
    }
    
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      width: 36px;
      height: 36px;
      border-radius: 8px;
    }
  }

  .icon {
    font-size: 24px;
    color: ${({ theme, $variant }) => getVariantColor(theme, $variant)};
    
    @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
      font-size: 18px;
    }
    
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 18px;
    }
  }
  
  .content {
    flex: 1;
    
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  }
  
  h3 { // Title
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 13px;
    font-family: ${({ theme }) => theme.fonts.heading};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 4px 0;
    font-weight: 500;
    
    @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
      font-size: 11px;
      letter-spacing: 0;
    }
    
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 11px;
      letter-spacing: 0;
      margin: 0;
      order: 1;
    }
  }

  .value {
    font-size: 24px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text.primary};
    line-height: 1.2;
    margin: 0;
    
    @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
      font-size: 18px;
    }
    
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 18px;
      order: 2;
    }
  }
`;

export default function StatsCard({ title, value, onClick, icon, variant = 'primary' }: StatsCardProps) {
  // The 'variant' prop received here is passed as '$variant' to StyledStatsCard
  return (
    <StyledStatsCard 
      onClick={onClick} 
      $clickable={!!onClick} 
      $variant={variant}
      variant="light"
      $hoverable={!!onClick}
      initial="hidden"
      animate="visible"
      whileHover={onClick ? "hover" : undefined}
      variants={glassCardVariants}
    >
      {icon && (
        <div className="icon-wrapper">
          <div className="icon">{icon}</div>
        </div>
      )}
      <div className="content">
        <h3>{title}</h3>
        <div className="value">{value}</div>
      </div>
    </StyledStatsCard>
  );
}
