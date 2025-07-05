// Unified Card Component System
import React from 'react';
import styled, { css } from 'styled-components';
import { motion, HTMLMotionProps } from 'framer-motion';

// Card variants
export type CardVariant = 'default' | 'stats' | 'content' | 'action' | 'minimal' | 'pastel';
export type CardSize = 'small' | 'medium' | 'large';
export type PastelColor = 'blue' | 'purple' | 'green' | 'pink' | 'yellow' | 'orange' | 'cyan' | 'gray';

interface CardProps extends HTMLMotionProps<"div"> {
  variant?: CardVariant;
  size?: CardSize;
  hoverable?: boolean;
  noPadding?: boolean;
  gradient?: boolean;
  accentColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  pastelColor?: PastelColor;
  className?: string;
  children: React.ReactNode;
}

// Consistent padding scales - more generous for modern design
const paddingScales = {
  small: css`
    padding: 24px;
    
    @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
      padding: 20px;
    }
    
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      padding: 16px;
    }
  `,
  medium: css`
    padding: 40px;
    
    @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
      padding: 32px;
    }
    
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      padding: 24px;
    }
  `,
  large: css`
    padding: 60px;
    
    @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
      padding: 48px;
    }
    
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      padding: 32px;
    }
  `
};

// Variant styles - Modern glass-morphism design
const variantStyles = {
  default: css`
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(152, 93, 215, 0.1);
    box-shadow: 0 8px 32px rgba(152, 93, 215, 0.05);
  `,
  stats: css`
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(152, 93, 215, 0.1);
    box-shadow: 0 8px 32px rgba(152, 93, 215, 0.05);
  `,
  content: css`
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(152, 93, 215, 0.1);
    box-shadow: 0 8px 32px rgba(152, 93, 215, 0.05);
  `,
  action: css`
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(152, 93, 215, 0.1);
    box-shadow: 0 8px 32px rgba(152, 93, 215, 0.05);
  `,
  minimal: css`
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(15px);
    border: 1px solid rgba(152, 93, 215, 0.08);
    box-shadow: 0 4px 20px rgba(152, 93, 215, 0.03);
  `,
  pastel: css<{ $pastelColor?: PastelColor; theme: any }>`
    background: ${({ $pastelColor, theme }) => {
      const colors = {
        blue: theme.colors.ui.pastelBlue,
        purple: theme.colors.ui.pastelPurple,
        green: theme.colors.ui.pastelGreen,
        pink: theme.colors.ui.pastelPink,
        yellow: theme.colors.ui.pastelYellow,
        orange: theme.colors.ui.pastelOrange,
        cyan: theme.colors.ui.pastelCyan,
        gray: theme.colors.ui.pastelGray
      };
      return colors[$pastelColor || 'gray'] || theme.colors.ui.pastelGray;
    }};
    backdrop-filter: blur(15px);
    border: 1px solid rgba(152, 93, 215, 0.08);
    box-shadow: 0 4px 20px rgba(152, 93, 215, 0.03);
  `
};

const StyledCard = styled(motion.div)<{
  $variant: CardVariant;
  $size: CardSize;
  $hoverable: boolean;
  $noPadding: boolean;
  $gradient: boolean;
  $accentColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  $pastelColor?: PastelColor;
}>`
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  
  ${({ $variant }) => $variant !== 'pastel' && variantStyles[$variant]}
  ${({ $variant, $pastelColor, theme }) => $variant === 'pastel' && css`
    background: ${(() => {
      const colors = {
        blue: theme.colors.ui.pastelBlue,
        purple: theme.colors.ui.pastelPurple,
        green: theme.colors.ui.pastelGreen,
        pink: theme.colors.ui.pastelPink,
        yellow: theme.colors.ui.pastelYellow,
        orange: theme.colors.ui.pastelOrange,
        cyan: theme.colors.ui.pastelCyan,
        gray: theme.colors.ui.pastelGray
      };
      return colors[$pastelColor || 'gray'] || theme.colors.ui.pastelGray;
    })()};
    backdrop-filter: blur(15px);
    border: 1px solid rgba(152, 93, 215, 0.08);
    box-shadow: 0 4px 20px rgba(152, 93, 215, 0.03);
  `}
  ${({ $size, $noPadding }) => !$noPadding && paddingScales[$size]}
  
  ${({ $hoverable }) => $hoverable && css`
    cursor: pointer;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(152, 93, 215, 0.15);
      border-color: rgba(152, 93, 215, 0.2);
    }
  `}
  
  ${({ $gradient, $accentColor, theme }) => $gradient && css`
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: ${() => {
        const gradients = {
          primary: `linear-gradient(135deg, ${theme.colors.brand.primary}, ${theme.colors.brand.magenta})`,
          secondary: `linear-gradient(135deg, ${theme.colors.brand.magenta}, ${theme.colors.brand.accent})`,
          success: `linear-gradient(135deg, ${theme.colors.brand.accent}, ${theme.colors.brand.primary})`,
          warning: `linear-gradient(135deg, ${theme.colors.brand.magenta}, ${theme.colors.brand.coral})`,
          danger: `linear-gradient(135deg, ${theme.colors.brand.coral}, ${theme.colors.brand.magenta})`
        };
        return gradients[$accentColor || 'primary'];
      }};
    }
  `}
  
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle,
      ${({ theme, $accentColor }) => {
        const colors = {
          primary: theme.colors.brand.primary,
          secondary: theme.colors.brand.magenta,
          success: theme.colors.brand.accent,
          warning: theme.colors.brand.magenta,
          danger: theme.colors.brand.coral
        };
        return colors[$accentColor || 'primary'];
      }}05 0%,
      transparent 70%
    );
    pointer-events: none;
  }
`;

// Card Header Component
export const CardHeader = styled.div<{ noBorder?: boolean }>`
  position: relative;
  padding-bottom: 16px;
  margin-bottom: 16px;
  
  ${({ noBorder }) => !noBorder && css`
    border-bottom: 1px solid rgba(152, 93, 215, 0.1);
  `}
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding-bottom: 12px;
    margin-bottom: 12px;
  }
`;

// Card Body Component
export const CardBody = styled.div`
  position: relative;
  z-index: 1;
`;

// Card Footer Component
export const CardFooter = styled.div<{ noBorder?: boolean }>`
  position: relative;
  padding-top: 16px;
  margin-top: 16px;
  
  ${({ noBorder }) => !noBorder && css`
    border-top: 1px solid rgba(152, 93, 215, 0.1);
  `}
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding-top: 12px;
    margin-top: 12px;
  }
`;

// Main Card Component
export const Card: React.FC<CardProps> = ({
  variant = 'default',
  size = 'medium',
  hoverable = false,
  noPadding = false,
  gradient = false,
  accentColor,
  pastelColor,
  className,
  children,
  ...motionProps
}) => {
  return (
    <StyledCard
      $variant={variant}
      $size={size}
      $hoverable={hoverable}
      $noPadding={noPadding}
      $gradient={gradient}
      $accentColor={accentColor}
      $pastelColor={pastelColor}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      {...motionProps}
    >
      {children}
    </StyledCard>
  );
};

// Stats Card Specific Component
interface StatsCardProps extends Omit<CardProps, 'variant' | 'children'> {
  icon?: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  onClick?: () => void;
}

const StatsCardContent = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 12px;
  }
`;

const StatsIconWrapper = styled.div<{ $color?: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $color, theme }) => $color ? `${$color}15` : `${theme.colors.brand.primary}15`};
  flex-shrink: 0;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    width: 36px;
    height: 36px;
    border-radius: 8px;
  }
  
  svg {
    width: 24px;
    height: 24px;
    color: ${({ $color, theme }) => $color || theme.colors.brand.primary};
    
    @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
      width: 18px;
      height: 18px;
    }
  }
`;

const StatsInfo = styled.div`
  flex: 1;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
`;

const StatsTitle = styled.h3`
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: ${({ theme }) => theme.fonts.heading};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: 11px;
    letter-spacing: 0;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    order: 1;
  }
`;

const StatsValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.2;
  margin: 4px 0;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    font-size: 18px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin: 0;
    order: 2;
  }
`;

const StatsSubtitle = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.muted};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`;

// Create a dedicated StatsCard styled component that matches the students page design
const StyledStatsCard = styled(motion.div)<{ $accentColor: string }>`
  background: white;
  border-radius: 16px;
  padding: 24px;
  padding-right: 80px; /* Add space for icon */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 4px solid ${({ $accentColor }) => $accentColor};
  min-height: 140px;
  display: flex;
  flex-direction: column;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
`;

const StatsHeader = styled.div`
  min-height: 45px;
  margin-bottom: 8px;
  display: flex;
  align-items: flex-start;
`;

const StatsIconCircle = styled.div<{ $accentColor: string }>`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${({ $accentColor }) => $accentColor};
  opacity: 0.1;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: ${({ $accentColor }) => $accentColor};
    opacity: 0.2;
  }
`;

const StatsIcon = styled.div<{ $accentColor: string }>`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $accentColor }) => $accentColor};
  z-index: 1;
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const StatsContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  z-index: 1;
`;

export const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  trend,
  onClick,
  accentColor = 'primary',
  ...cardProps
}) => {
  const accentColors = {
    primary: '#6366F1',
    secondary: '#C848AF',
    success: '#4CBEF3',
    warning: '#F97316',
    danger: '#FE4372'
  };
  
  const color = accentColors[accentColor] || accentColors.primary;
  
  return (
    <StyledStatsCard
      $accentColor={color}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      {...cardProps}
    >
      <StatsIconCircle $accentColor={color} />
      <StatsIcon $accentColor={color}>
        {icon}
      </StatsIcon>
      
      <StatsHeader>
        <StatsTitle>{title}</StatsTitle>
      </StatsHeader>
      
      <StatsContent>
        <StatsValue>{value}</StatsValue>
        {subtitle && <StatsSubtitle>{subtitle}</StatsSubtitle>}
      </StatsContent>
    </StyledStatsCard>
  );
};

export default Card;