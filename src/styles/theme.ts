// src/styles/theme.ts
import { DefaultTheme } from 'styled-components';

// New Skolr Brand Colors (defined for clarity and easy reference)
const skolrPurple = '#6366F1';
const skolrCyan = '#4CBEF3';
const skolrMagenta = '#C848AF';
const skolrGreen = '#7BBC44';
const skolrCoral = '#FE4372';
const skolrOrange = '#FFB612';

// Helper function to generate lighter/darker shades (basic example, you might use a tool)
// This is a very simplistic way to generate shades. For best results, pick them manually or use a color tool.
const lighten = (color: string, percent: number): string => {
  const num = parseInt(color.replace("#",""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    G = (num >> 8 & 0x00FF) + amt,
    B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
};

// Darken function removed as it's not used in this file
// It's defined in StyledComponents.ts where it's actually used


const theme: DefaultTheme = {
  colors: {
    brand: {
      primary: skolrPurple,
      secondary: skolrOrange,
      accent: skolrCyan,
      magenta: skolrMagenta,
      coral: skolrCoral,
      green: skolrGreen,
    },
    ui: {
      background: '#FFFFFF',
      backgroundLight: '#F9FAFB',
      backgroundDark: '#121212',
      border: '#E5E7EB',
      borderDark: '#D1D5DB',
      focus: skolrPurple,
      shadow: '0, 0, 0',
      pastelBlue: '#E0F2FE',
      pastelPurple: '#EDE9FE',
      pastelGreen: '#D1FAE5',
      pastelPink: '#FCE7F3',
      pastelYellow: '#FEF3C7',
      pastelOrange: '#FED7AA',
      pastelCyan: '#CFFAFE',
      pastelGray: '#F3F4F6',
    },
    text: {
      primary: '#1A1E2E',
      secondary: '#5E6C7A',
      muted: '#9CA3AF',
      primaryInverse: '#FFFFFF',
    },
    status: {
      success: skolrCyan,
      warning: skolrMagenta,
      danger: skolrCoral,
      info: skolrCyan,
    },
  },
  
  fonts: {
    heading: "'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    body: "'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'SF Mono', 'Fira Code', Consolas, monospace",
    display: "'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    xxxl: '64px',
    xxxxl: '80px',
    xxxxxl: '100px',
  },
  
  borderRadius: {
    small: '8px',
    medium: '12px',
    large: '16px',
    xl: '20px',
    xxl: '24px',
    round: '50%',
    pill: '9999px',
  },
  
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.04)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07)',
    lg: '0 10px 20px rgba(0, 0, 0, 0.08)',
    xl: '0 20px 40px rgba(0, 0, 0, 0.1)',
    soft: '0 2px 20px rgba(0, 0, 0, 0.04)',
    softLg: '0 10px 40px rgba(0, 0, 0, 0.06)',
  },
  
  gradients: {
    primary: `linear-gradient(135deg, ${skolrPurple}, ${lighten(skolrPurple, 20)})`, // Updated
    secondary: `linear-gradient(135deg, ${skolrOrange}, ${lighten(skolrOrange, 15)})`, // Updated
    // New animated gradient backgrounds
    animatedPurple: `linear-gradient(45deg, ${skolrPurple}, ${skolrMagenta}, ${skolrCyan})`,
    animatedWarm: `linear-gradient(45deg, ${skolrOrange}, ${skolrCoral}, ${skolrMagenta})`,
    animatedCool: `linear-gradient(45deg, ${skolrCyan}, ${skolrPurple}, ${skolrGreen})`,
  },
  
  glassmorphism: {
    // Glass effects with different intensities
    light: {
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    },
    medium: {
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    },
    dark: {
      background: 'rgba(26, 30, 46, 0.8)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    },
    colored: {
      purple: {
        background: `rgba(152, 93, 215, 0.15)`,
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(152, 93, 215, 0.3)',
        boxShadow: '0 8px 32px rgba(152, 93, 215, 0.2)',
      },
      cyan: {
        background: `rgba(76, 190, 243, 0.15)`,
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(76, 190, 243, 0.3)',
        boxShadow: '0 8px 32px rgba(76, 190, 243, 0.2)',
      },
    },
  },
  
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
  },
  
  transitions: {
    fast: '0.15s ease',
    normal: '0.25s ease',
    slow: '0.35s ease',
  },
};

export default theme;
