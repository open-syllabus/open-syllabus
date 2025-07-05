import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      primaryLight: string;
      primaryDark: string;
      secondary: string;
      secondaryLight: string;
      secondaryDark: string;
      
      // Pastel backgrounds
      pastelBlue: string;
      pastelPurple: string;
      pastelGreen: string;
      pastelPink: string;
      pastelYellow: string;
      pastelOrange: string;
      pastelCyan: string;
      pastelGray: string;
      
      // Neutral colors
      background: string;
      backgroundDark: string;
      backgroundCard: string;
      text: string;
      textLight: string;
      textMuted: string;
      
      // Status colors
      success: string;
      warning: string;
      danger: string;
      info: string;
      
      // Core accent colors
      purple: string;
      blue: string;
      pink: string;
      magenta: string;
      
      // Legacy colors
      green: string;
      red: string;
      orange: string;
      
      // UI colors
      border: string;
      borderDark: string;
      focus: string;
      shadow: string;
    };
    
    fonts: {
      heading: string;
      body: string;
      mono: string;
      display: string;
    };
    
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
      xxxl: string;
      xxxxl: string;
      xxxxxl: string;
    };
    
    borderRadius: {
      small: string;
      medium: string;
      large: string;
      xl: string;
      xxl: string;
      round: string;
      pill: string;
    };
    
    shadows: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      soft: string;
      softLg: string;
    };
    
    gradients: {
      primary: string;
      secondary: string;
      animatedPurple: string;
      animatedWarm: string;
      animatedCool: string;
    };
    
    glassmorphism: {
      light: {
        background: string;
        backdropFilter: string;
        border: string;
        boxShadow: string;
      };
      medium: {
        background: string;
        backdropFilter: string;
        border: string;
        boxShadow: string;
      };
      dark: {
        background: string;
        backdropFilter: string;
        border: string;
        boxShadow: string;
      };
      colored: {
        purple: {
          background: string;
          backdropFilter: string;
          border: string;
          boxShadow: string;
        };
        cyan: {
          background: string;
          backdropFilter: string;
          border: string;
          boxShadow: string;
        };
      };
    };
    
    breakpoints: {
      mobile: string;
      tablet: string;
      desktop: string;
      wide: string;
    };
    
    transitions: {
      fast: string;
      normal: string;
      slow: string;
    };
  }
}