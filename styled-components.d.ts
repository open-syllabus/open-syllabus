// styled-components.d.ts
import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      brand: {
        primary: string;
        secondary: string;
        accent: string;
        magenta: string;
        coral: string;
        green: string;
      };
      ui: {
        background: string;
        backgroundLight: string;
        backgroundDark: string;
        border: string;
        borderDark: string;
        focus: string;
        shadow: string;
        pastelBlue: string;
        pastelPurple: string;
        pastelGreen: string;
        pastelPink: string;
        pastelYellow: string;
        pastelOrange: string;
        pastelCyan: string;
        pastelGray: string;
      };
      text: {
        primary: string;
        secondary: string;
        muted: string;
        primaryInverse: string;
      };
      status: {
        success: string;
        warning: string;
        danger: string;
        info: string;
      };
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