'use client';

import React from 'react';
import styled, { DefaultTheme } from 'styled-components';
import { GlassCard, glassCardVariants } from '@/components/shared/GlassCard';
import { motion } from 'framer-motion';

// Shared types
export type CardVariant = 'primary' | 'secondary' | 'accent' | 'info' | 'warning' | 'danger' | 'success';

// Helper function to get variant color
const getVariantColor = (theme: DefaultTheme, variant: CardVariant): string => {
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
    case 'success':
      return theme.colors.status.success;
    default:
      return theme.colors.brand.primary;
  }
};

// 1. Basic Stats Card - for simple metrics
export interface StatsCardProps { 
  title: string;
  value: string | number;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: CardVariant;
}

const StyledStatsCard = styled(GlassCard)<{ $clickable: boolean; $variant: CardVariant }>`
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
    background: ${({ theme, $variant }) => `${getVariantColor(theme, $variant)}20`};
    border-radius: 12px;
    flex-shrink: 0;
    
    @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
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
    
    svg {
      stroke: ${({ theme, $variant }) => getVariantColor(theme, $variant)};
      fill: ${({ theme, $variant }) => getVariantColor(theme, $variant)};
    }
  }
  
  .content {
    flex: 1;
  }
  
  h3 {
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 13px;
    font-family: ${({ theme }) => theme.fonts.heading};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 4px 0;
    font-weight: 500;
    
    @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
      font-size: 11px;
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
  }
`;

export const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  onClick, 
  icon, 
  variant = 'primary' 
}) => {
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
};

// 2. Content Card - for items with more details (rooms, chatbots, etc.)
export interface ContentCardProps {
  title: string;
  subtitle?: string | React.ReactNode;
  description?: string;
  metadata?: Array<{ label: string; value: string | number; icon?: React.ReactNode }>;
  actions?: React.ReactNode;
  onClick?: () => void;
  variant?: CardVariant;
  icon?: React.ReactNode;
}

const StyledContentCard = styled(GlassCard)<{ $clickable: boolean; $variant: CardVariant }>`
  padding: 16px;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  transition: all ${({ theme }) => theme.transitions.normal};
  position: relative;
  overflow: hidden;
  min-height: 200px;
  height: 100%;
  display: flex;
  flex-direction: column;
  
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

  .header {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 10px;
  }

  .icon-wrapper {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${({ theme, $variant }) => `${getVariantColor(theme, $variant)}20`};
    border-radius: 10px;
    flex-shrink: 0;
    
    .icon {
      font-size: 20px;
      color: ${({ theme, $variant }) => getVariantColor(theme, $variant)};
      
      svg {
        stroke: ${({ theme, $variant }) => getVariantColor(theme, $variant)};
        fill: ${({ theme, $variant }) => getVariantColor(theme, $variant)};
      }
    }
  }

  .header-content {
    flex: 1;
  }

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    font-family: ${({ theme }) => theme.fonts.heading};
    color: ${({ theme }) => theme.colors.text.primary};
    line-height: 1.2;
  }

  .subtitle {
    margin: 4px 0 0 0;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-weight: 500;
  }

  .description {
    margin: 0 0 10px 0;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 13px;
    line-height: 1.5;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .metadata {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 10px;
  }

  .metadata-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.secondary};

    svg {
      width: 14px;
      height: 14px;
    }

    .label {
      color: ${({ theme }) => theme.colors.text.muted};
    }

    .value {
      font-weight: 600;
      color: ${({ theme }) => theme.colors.text.primary};
    }
  }

  .actions {
    margin-top: auto;
    padding-top: 12px;
  }
`;

export const ContentCard: React.FC<ContentCardProps> = ({
  title,
  subtitle,
  description,
  metadata,
  actions,
  onClick,
  variant = 'primary',
  icon
}) => {
  return (
    <StyledContentCard
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
      <div className="header">
        {icon && (
          <div className="icon-wrapper">
            <div className="icon">{icon}</div>
          </div>
        )}
        <div className="header-content">
          <h3>{title}</h3>
          {subtitle && <div className="subtitle">{subtitle}</div>}
        </div>
      </div>
      
      {description && <p className="description">{description}</p>}
      
      {metadata && metadata.length > 0 && (
        <div className="metadata">
          {metadata.map((item, index) => (
            <div key={index} className="metadata-item">
              {item.icon}
              <span className="label">{item.label}:</span>
              <span className="value">{item.value}</span>
            </div>
          ))}
        </div>
      )}
      
      {actions && <div className="actions">{actions}</div>}
    </StyledContentCard>
  );
};

// 3. Summary Card - for displaying overview information with multiple metrics
export interface SummaryCardProps {
  title: string;
  icon?: React.ReactNode;
  metrics: Array<{
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
  }>;
  actions?: React.ReactNode;
  variant?: CardVariant;
}

const StyledSummaryCard = styled(GlassCard)<{ $variant: CardVariant }>`
  padding: 24px;
  transition: all ${({ theme }) => theme.transitions.normal};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: ${({ theme, $variant }) => getVariantColor(theme, $variant)};
  }

  .header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }

  .icon-wrapper {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${({ theme, $variant }) => `${getVariantColor(theme, $variant)}20`};
    border-radius: 10px;
    
    .icon {
      font-size: 18px;
      color: ${({ theme, $variant }) => getVariantColor(theme, $variant)};
      
      svg {
        stroke: ${({ theme, $variant }) => getVariantColor(theme, $variant)};
        fill: ${({ theme, $variant }) => getVariantColor(theme, $variant)};
      }
    }
  }

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    font-family: ${({ theme }) => theme.fonts.heading};
    color: ${({ theme }) => theme.colors.text.primary};
    flex: 1;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
  }

  .metric-item {
    .metric-label {
      font-size: 12px;
      color: ${({ theme }) => theme.colors.text.secondary};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .metric-value {
      font-size: 20px;
      font-weight: 700;
      color: ${({ theme }) => theme.colors.text.primary};
      line-height: 1.2;
    }

    .metric-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 4px;
      font-size: 11px;

      &.up {
        color: ${({ theme }) => theme.colors.status.success};
      }

      &.down {
        color: ${({ theme }) => theme.colors.status.danger};
      }

      &.neutral {
        color: ${({ theme }) => theme.colors.text.secondary};
      }
    }
  }

  .actions {
    margin-top: auto;
    padding-top: 16px;
    border-top: 1px solid ${({ theme }) => theme.colors.ui.border};
  }
`;

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  icon,
  metrics,
  actions,
  variant = 'primary'
}) => {
  return (
    <StyledSummaryCard
      $variant={variant}
      variant="light"
      initial="hidden"
      animate="visible"
      variants={glassCardVariants}
    >
      <div className="header">
        {icon && (
          <div className="icon-wrapper">
            <div className="icon">{icon}</div>
          </div>
        )}
        <h3>{title}</h3>
      </div>

      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-item">
            <div className="metric-label">{metric.label}</div>
            <div className="metric-value">{metric.value}</div>
            {metric.trend && (
              <div className={`metric-trend ${metric.trend}`}>
                {metric.trend === 'up' && '↑'}
                {metric.trend === 'down' && '↓'}
                {metric.trend === 'neutral' && '→'}
                {metric.trendValue && ` ${metric.trendValue}`}
              </div>
            )}
          </div>
        ))}
      </div>

      {actions && <div className="actions">{actions}</div>}
    </StyledSummaryCard>
  );
};