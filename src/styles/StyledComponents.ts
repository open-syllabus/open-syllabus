// src/styles/StyledComponents.ts
import styled, { css } from 'styled-components'; // Added css import
import Link from 'next/link'; // Import Link for the new StyledLink
import { ModernButton } from '@/components/shared/ModernButton';

export const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.lg};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0 ${({ theme }) => theme.spacing.md};
  }
`;

export const Card = styled.div<{ $accentColor?: string; $accentSide?: 'top' | 'left' }>` // Added optional accent props
  background: ${({ theme }) => theme.colors.ui.backgroundLight};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  position: relative; // Needed for pseudo-elements if we go that route, or direct border

  // Subtle accent border using the $accentColor prop or defaulting to a light primary
  // You can choose 'top' or 'left' (or add more)
  ${({ theme, $accentColor, $accentSide = 'top' }) => {
    const color = $accentColor || theme.colors.brand.primary + '70'; // Default to semi-transparent primary
    if ($accentSide === 'top') {
      return css`
        border-top: 4px solid ${color};
      `;
    }
    if ($accentSide === 'left') {
      return css`
        border-left: 4px solid ${color};
      `;
    }
    return ''; // No accent border if side is not specified or matched
  }}


  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.lg};
  }
`;

export const Button = styled.button<{
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'magenta' | 'cyan' | 'text'; // Added magenta, cyan, text
    size?: 'small' | 'medium' | 'large';
  }>`
    background: ${({ theme, variant = 'primary' }) => {
      if (variant === 'primary') return theme.colors.brand.primary;
      if (variant === 'secondary') return theme.colors.brand.secondary;
      if (variant === 'danger') return theme.colors.status.danger;
      if (variant === 'magenta') return theme.colors.brand.magenta;
      if (variant === 'cyan') return theme.colors.brand.accent; // Assuming theme.colors.blue is your skolrCyan
      return 'transparent'; // For 'outline', 'text', or default
    }};
    color: ${({ theme, variant = 'primary' }) => {
      if (variant === 'outline') return theme.colors.brand.primary;
      if (variant === 'text') return theme.colors.brand.primary; // Text buttons often use primary color
      // For solid backgrounds (primary, secondary, danger, magenta, cyan), text is usually white
      return 'white'; 
    }};
    border: ${({ theme, variant = 'primary' }) => { // Added default to 'primary' for variant
      if (variant === 'outline') return `2px solid ${theme.colors.brand.primary}`;
      if (variant === 'danger') return `2px solid ${theme.colors.status.danger}`;
      if (variant === 'magenta') return `2px solid ${theme.colors.brand.magenta}`;
      if (variant === 'cyan') return `2px solid ${theme.colors.brand.accent}`;
      // For 'primary', 'secondary', 'text' -> no border by default
      return 'none'; 
    }};
    padding: ${({ theme, size = 'medium', variant }) => {
      if (variant === 'text') return `${theme.spacing.xs} ${theme.spacing.sm}`; // Smaller padding for text buttons
      return size === 'small' ? `${theme.spacing.xs} ${theme.spacing.md}` :
             size === 'large' ? `${theme.spacing.md} ${theme.spacing.xl}` :
             `${theme.spacing.sm} ${theme.spacing.lg}`;
    }};
    border-radius: ${({ theme }) => theme.borderRadius.large};
    font-weight: 600; // Slightly bolder
    transition: all ${({ theme }) => theme.transitions.fast};
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1.2;
    text-decoration: none;

    &:hover:not(:disabled) {
      background: ${({ theme, variant = 'primary' }) => {
        if (variant === 'primary') return darken(theme.colors.brand.primary, 15);
        if (variant === 'secondary') return darken(theme.colors.brand.secondary, 10);
        if (variant === 'danger') return darken(theme.colors.status.danger, 10); // Use darken helper
        if (variant === 'magenta') return darken(theme.colors.brand.magenta, 10);
        if (variant === 'cyan') return darken(theme.colors.brand.accent, 10);
        if (variant === 'outline') return theme.colors.brand.primary; 
        if (variant === 'text') return theme.colors.ui.backgroundDark; // Subtle background on hover for text
        return undefined;
      }};
      border-color: ${({ theme, variant = 'primary' }) => {
        if (variant === 'danger') return darken(theme.colors.status.danger, 10);
        if (variant === 'magenta') return darken(theme.colors.brand.magenta, 10);
        if (variant === 'cyan') return darken(theme.colors.brand.accent, 10);
        if (variant === 'outline') return theme.colors.brand.primary;
        return undefined;
      }};
      color: ${({ theme, variant = 'primary' }) => { // Added theme to access colors
        if (variant === 'outline') return 'white';
        if (variant === 'text') return darken(theme.colors.brand.primary, 10); // Darker text on hover for text button
        return 'white'; 
      }};
      transform: translateY(-1px);
      box-shadow: ${({ theme, variant }) => (variant !== 'text' ? theme.shadows.md : 'none')}; // No shadow for text buttons
    }

    &:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: none;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `;

// Inherit from Button for consistency
export const SecondaryButton = styled(ModernButton).attrs({ variant: 'secondary' })``;
export const OutlineButton = styled(ModernButton).attrs({ variant: 'ghost' })``;
export const DangerButton = styled(ModernButton).attrs({ variant: 'danger' })``;
export const MagentaButton = styled(ModernButton).attrs({ variant: 'primary' })``; // New MagentaButton
export const CyanButton = styled(ModernButton).attrs({ variant: 'secondary' })``;     // New CyanButton
export const TextButton = styled(ModernButton).attrs({ variant: 'ghost' })``;       // New TextButton


export const FormGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

export const Label = styled.label`
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 0.9rem;
`;

export const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.ui.border}; // Thinner border for inputs
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.ui.background};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1rem;
  line-height: 1.5;
  transition: border-color ${({ theme }) => theme.transitions.fast}, box-shadow ${({ theme }) => theme.transitions.fast};
  min-height: 44px;

  &:focus {
    border-color: ${({ theme }) => theme.colors.ui.focus};
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.primary + '30'}; // Adjusted focus shadow
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    background-color: ${({ theme }) => theme.colors.ui.backgroundDark};
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.ui.border}; // Thinner border
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.ui.background};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1rem;
  line-height: 1.6;
  transition: border-color ${({ theme }) => theme.transitions.fast}, box-shadow ${({ theme }) => theme.transitions.fast};
  min-height: 100px;
  resize: vertical;

  &:focus {
    border-color: ${({ theme }) => theme.colors.ui.focus};
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.primary + '30'}; // Adjusted focus shadow
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }

   &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    background-color: ${({ theme }) => theme.colors.ui.backgroundDark};
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.ui.border}; // Thinner border
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background-color: ${({ theme }) => theme.colors.ui.background};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 1rem;
  line-height: 1.5;
  transition: border-color ${({ theme }) => theme.transitions.fast}, box-shadow ${({ theme }) => theme.transitions.fast};
  min-height: 44px;
  cursor: pointer;
  appearance: none;
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23${({ theme }) => theme.colors.text.muted.replace('#', '')}%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
  background-repeat: no-repeat;
  background-position: right ${({ theme }) => theme.spacing.md} center;
  background-size: 0.65em auto;
  padding-right: ${({ theme }) => `calc(${theme.spacing.md} * 2.5 + 1em)`};

  &:focus {
    border-color: ${({ theme }) => theme.colors.ui.focus};
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.primary + '30'}; // Adjusted focus shadow
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    background-color: ${({ theme }) => theme.colors.ui.backgroundDark};
    background-image: none;
  }

  option {
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.ui.background};
  }
`;

export const Alert = styled.div<{ variant?: 'info' | 'success' | 'warning' | 'error' }>`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  border-left: 4px solid;
  font-size: 0.9rem;

  ${({ variant, theme }) => {
    switch (variant) {
      case 'success':
        return `
          background: rgba(${theme.colors.status.success.replace('#', '').match(/.{2}/g)?.map(c => parseInt(c, 16)).join(', ')}, 0.15);
          border-color: ${theme.colors.status.success};
          color: ${darken(theme.colors.status.success, 25)}; // Darker text for better contrast
        `;
      case 'warning':
        return `
          background: rgba(${theme.colors.brand.secondary.replace('#', '').match(/.{2}/g)?.map(c => parseInt(c, 16)).join(', ')}, 0.15);
          border-color: ${theme.colors.brand.secondary};
          color: ${darken(theme.colors.brand.secondary, 10)}; // Darker text
        `;
      case 'error':
        return `
          background: rgba(${theme.colors.status.danger.replace('#', '').match(/.{2}/g)?.map(c => parseInt(c, 16)).join(', ')}, 0.15);
          border-color: ${theme.colors.status.danger};
          color: ${darken(theme.colors.status.danger, 20)}; // Darker text
        `;
      default: // info (uses theme.colors.brand.accent which is our skolrCyan)
        return `
          background: rgba(${theme.colors.status.info.replace('#', '').match(/.{2}/g)?.map(c => parseInt(c, 16)).join(', ')}, 0.15);
          border-color: ${theme.colors.status.info};
          color: ${darken(theme.colors.status.info, 25)}; // Darker text
        `;
    }
  }}
`;

export const Badge = styled.span<{ variant?: 'default' | 'success' | 'warning' | 'error' | 'magenta' | 'cyan' }>`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.round};
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  ${({ variant, theme }) => {
    switch (variant) {
      case 'success':
        return `background: rgba(${theme.colors.status.success.replace('#', '').match(/.{2}/g)?.map(c => parseInt(c, 16)).join(', ')}, 0.2); color: ${theme.colors.status.success};`;
      case 'warning':
        return `background: rgba(${theme.colors.brand.secondary.replace('#', '').match(/.{2}/g)?.map(c => parseInt(c, 16)).join(', ')}, 0.2); color: ${darken(theme.colors.brand.secondary, 10)};`;
      case 'error':
        return `background: rgba(${theme.colors.status.danger.replace('#', '').match(/.{2}/g)?.map(c => parseInt(c, 16)).join(', ')}, 0.2); color: ${theme.colors.status.danger};`;
      case 'magenta': // New magenta badge
        return `background: rgba(${theme.colors.brand.magenta.replace('#', '').match(/.{2}/g)?.map(c => parseInt(c, 16)).join(', ')}, 0.2); color: ${theme.colors.brand.magenta};`;
      case 'cyan':    // New cyan badge (uses theme.colors.brand.accent)
        return `background: rgba(${theme.colors.brand.accent.replace('#', '').match(/.{2}/g)?.map(c => parseInt(c, 16)).join(', ')}, 0.2); color: ${theme.colors.brand.accent};`;
      default: // default uses primary
        return `background: rgba(${theme.colors.brand.primary.replace('#', '').match(/.{2}/g)?.map(c => parseInt(c, 16)).join(', ')}, 0.2); color: ${theme.colors.brand.primary};`;
    }
  }}
`;

// New StyledLink component
export const StyledLink = styled(Link)<{ $variant?: 'primary' | 'secondary' | 'magenta' | 'cyan' | 'default' }>`
  color: ${({ theme, $variant = 'primary' }) => {
    if ($variant === 'secondary') return theme.colors.text.secondary;
    if ($variant === 'magenta') return theme.colors.brand.magenta;
    if ($variant === 'cyan') return theme.colors.brand.accent; // theme.colors.brand.accent is skolrCyan
    if ($variant === 'default') return theme.colors.text.primary;
    return theme.colors.brand.primary;
  }};
  text-decoration: none;
  font-weight: 500;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    text-decoration: underline;
    color: ${({ theme, $variant = 'primary' }) => {
      if ($variant === 'secondary') return darken(theme.colors.text.secondary, 10);
      if ($variant === 'magenta') return darken(theme.colors.brand.magenta, 10);
      if ($variant === 'cyan') return darken(theme.colors.brand.accent, 10);
      if ($variant === 'default') return theme.colors.brand.primary; // Default text link hovers to primary
      return darken(theme.colors.brand.primary, 10);
    }};
  }
`;

// Helper function (can be moved to a utils file if used elsewhere)
const darken = (color: string, percent: number): string => {
  const num = parseInt(color.replace("#",""), 16),
    amt = Math.round(2.55 * percent),
    R = Math.max(0, (num >> 16) - amt),
    G = Math.max(0, (num >> 8 & 0x00FF) - amt),
    B = Math.max(0, (num & 0x0000FF) - amt);
  return "#" + (0x1000000 + R*0x10000 + G*0x100 + B).toString(16).slice(1);
};