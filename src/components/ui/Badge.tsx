// Unified Badge Components
import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};

export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeProps {
  $variant?: BadgeVariant;
  $size?: BadgeSize;
  $gradient?: boolean;
}

const sizeStyles = {
  small: {
    padding: '4px 8px',
    fontSize: '11px',
    iconSize: '12px'
  },
  medium: {
    padding: '6px 12px',
    fontSize: '12px',
    iconSize: '14px'
  },
  large: {
    padding: '8px 16px',
    fontSize: '14px',
    iconSize: '16px'
  }
};

const variantStyles = (theme: any) => ({
  default: {
    background: 'rgba(0, 0, 0, 0.05)',
    color: theme.colors.text.primary,
    border: `1px solid ${theme.colors.ui.border}`
  },
  primary: {
    background: hexToRgba(theme.colors.brand.primary, 0.1),
    color: theme.colors.brand.primary,
    border: `1px solid ${hexToRgba(theme.colors.brand.primary, 0.2)}`
  },
  secondary: {
    background: hexToRgba(theme.colors.brand.secondary, 0.1),
    color: theme.colors.brand.secondary,
    border: `1px solid ${hexToRgba(theme.colors.brand.secondary, 0.2)}`
  },
  success: {
    background: hexToRgba(theme.colors.status.success, 0.1),
    color: theme.colors.status.success,
    border: `1px solid ${hexToRgba(theme.colors.status.success, 0.2)}`
  },
  warning: {
    background: hexToRgba(theme.colors.status.warning, 0.1),
    color: theme.colors.status.warning,
    border: `1px solid ${hexToRgba(theme.colors.status.warning, 0.2)}`
  },
  error: {
    background: hexToRgba(theme.colors.status.danger, 0.1),
    color: theme.colors.status.danger,
    border: `1px solid ${hexToRgba(theme.colors.status.danger, 0.2)}`
  },
  info: {
    background: hexToRgba(theme.colors.status.info, 0.1),
    color: theme.colors.status.info,
    border: `1px solid ${hexToRgba(theme.colors.status.info, 0.2)}`
  }
});

export const Badge = styled(motion.span)<BadgeProps>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: ${({ $size = 'medium' }) => sizeStyles[$size].padding};
  font-size: ${({ $size = 'medium' }) => sizeStyles[$size].fontSize};
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.2s ease;
  
  ${({ theme, $variant = 'default' }) => {
    const styles = variantStyles(theme)[$variant];
    return `
      background: ${styles.background};
      color: ${styles.color};
      border: ${styles.border};
    `;
  }}
  
  ${({ theme, $gradient, $variant = 'default' }) => $gradient && $variant === 'primary' && `
    background: linear-gradient(135deg, 
      ${hexToRgba(theme.colors.brand.primary, 0.1)}, 
      ${hexToRgba(theme.colors.brand.magenta, 0.1)}
    );
  `}
  
  svg {
    width: ${({ $size = 'medium' }) => sizeStyles[$size].iconSize};
    height: ${({ $size = 'medium' }) => sizeStyles[$size].iconSize};
  }
`;

interface StatusBadgeProps {
  isActive?: boolean;
  size?: BadgeSize;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  isActive = false,
  size = 'medium',
  icon,
  children,
  className,
  style
}) => {
  return (
    <Badge
      $variant={isActive ? 'success' : 'error'}
      $size={size}
      className={className}
      style={style}
    >
      {icon}
      {children}
    </Badge>
  );
};

export const CodeBadge = styled(Badge)`
  font-family: ${({ theme }) => theme.fonts.mono};
  cursor: pointer;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;