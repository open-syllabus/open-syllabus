// Modern button component with pastel theme
import React from 'react';
import styled, { css, DefaultTheme } from 'styled-components';
import { motion, HTMLMotionProps } from 'framer-motion';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'small' | 'medium' | 'large';

interface StyledButtonProps {
  $variant?: ButtonVariant;
  $size?: ButtonSize;
  $fullWidth?: boolean;
  disabled?: boolean;
}

interface ModernButtonProps extends Omit<HTMLMotionProps<"button">, 'ref'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  as?: any;
}

// Helper function to generate darker shades (copied from theme.ts for now)
const darken = (color: string, percent: number): string => {
  const num = parseInt(color.replace("#",""), 16),
    amt = Math.round(2.55 * percent),
    R = Math.max(0, (num >> 16) - amt),
    G = Math.max(0, (num >> 8 & 0x00FF) - amt),
    B = Math.max(0, (num & 0x0000FF) - amt);
  return "#" + (0x1000000 + R*0x10000 + G*0x100 + B).toString(16).slice(1);
};

const getVariantStyles = (variant: ButtonVariant, theme: DefaultTheme) => {
  const styles: Record<ButtonVariant, any> = {
    primary: css`
      background: linear-gradient(135deg, ${theme.colors.brand.primary}, #C848AF);
      color: white;
      border: none;
      box-shadow: 0 4px 14px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.25)};
      
      &:hover:not(:disabled) {
        background: linear-gradient(135deg, ${darken(theme.colors.brand.primary, 10)}, ${darken('#C848AF', 10)});
        box-shadow: 0 6px 20px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.35)};
        transform: translateY(-2px);
      }
      
      &:active:not(:disabled) {
        transform: translateY(0);
        box-shadow: 0 2px 8px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.2)};
      }
    `,
    secondary: css`
      background: ${theme.colors.ui.background};
      color: ${theme.colors.brand.primary};
      border: 2px solid ${theme.colors.brand.primary};
      
      &:hover:not(:disabled) {
        background: ${theme.colors.ui.pastelPurple};
        transform: translateY(-2px);
        box-shadow: 0 4px 12px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.15)};
      }
    `,
    ghost: css`
      background: transparent;
      color: ${theme.colors.text.primary};
      border: 2px solid transparent;
      
      &:hover:not(:disabled) {
        background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.08)};
        color: ${theme.colors.brand.primary};
        transform: translateY(-1px);
      }
    `,
    danger: css`
      background: ${theme.colors.status.danger};
      color: white;
      border: none;
      box-shadow: 0 4px 14px ${({ theme }) => hexToRgba(theme.colors.status.danger, 0.25)};
      
      &:hover:not(:disabled) {
        background: ${darken(theme.colors.status.danger, 10)};
        transform: translateY(-2px);
        box-shadow: 0 6px 20px ${({ theme }) => hexToRgba(theme.colors.status.danger, 0.35)};
      }
    `,
    success: css`
      background: ${theme.colors.status.success};
      color: white;
      border: none;
      box-shadow: 0 4px 14px ${({ theme }) => hexToRgba(theme.colors.status.success, 0.25)};
      
      &:hover:not(:disabled) {
        background: ${darken(theme.colors.status.success, 10)};
        transform: translateY(-2px);
        box-shadow: 0 6px 20px ${({ theme }) => hexToRgba(theme.colors.status.success, 0.35)};
      }
    `,
  };
  
  return styles[variant];
};

const getSizeStyles = (size: ButtonSize) => {
  const sizes: Record<ButtonSize, any> = {
    small: css`
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 500;
      border-radius: 6px;
      
      svg {
        width: 14px;
        height: 14px;
      }
      
      @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        padding: 7px 14px;
        font-size: 12px;
      }
    `,
    medium: css`
      padding: 12px 28px;
      font-size: 15px;
      font-weight: 500;
      border-radius: 8px;
      
      svg {
        width: 18px;
        height: 18px;
      }
      
      @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        padding: 10px 22px;
        font-size: 14px;
      }
    `,
    large: css`
      padding: 16px 36px;
      font-size: 17px;
      font-weight: 600;
      border-radius: 10px;
      
      svg {
        width: 20px;
        height: 20px;
      }
      
      @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        padding: 14px 30px;
        font-size: 16px;
      }
    `,
  };
  
  return sizes[size];
};

const StyledMotionButton = styled(motion.button)<StyledButtonProps>`
  ${({ $variant = 'primary', theme }) => getVariantStyles($variant, theme)}
  ${({ $size = 'medium' }) => getSizeStyles($size)}
  
  width: ${({ $fullWidth }) => $fullWidth ? '100%' : 'auto'};
  font-family: ${({ theme }) => theme.fonts.body};
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  position: relative;
  white-space: nowrap;
  letter-spacing: 0.02em;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.ui.background},
                0 0 0 4px ${({ theme }) => theme.colors.brand.primary};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
`;

// Wrapper component to handle prop conversion
export const ModernButton = React.forwardRef<HTMLButtonElement, ModernButtonProps>(
  ({ variant, size, fullWidth, as, ...rest }, ref) => {
    return (
      <StyledMotionButton
        ref={ref}
        $variant={variant}
        $size={size}
        $fullWidth={fullWidth}
        as={as}
        whileTap={{ scale: 0.98 }}
        {...rest}
      />
    );
  }
);

ModernButton.displayName = 'ModernButton';

// Icon button variant
interface IconButtonProps extends StyledButtonProps {
  $rounded?: boolean;
}

export const IconButton = styled(StyledMotionButton)<IconButtonProps>`
  padding: ${({ $size = 'medium' }) => 
    $size === 'small' ? '8px' : $size === 'large' ? '14px' : '10px'
  };
  border-radius: ${({ $rounded = true }) => 
    $rounded ? '50%' : '8px'
  };
  
  svg {
    margin: 0;
  }
`;

// Button group container
export const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`;