// src/lib/config/auth.ts
export const authConfig = {
  // Use your custom domain for all user-facing URLs
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://skolr.app',
  
  // OAuth settings
  oauth: {
    // This should match exactly what's in Google Cloud Console
    redirectTo: process.env.NEXT_PUBLIC_SUPABASE_URL 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`
      : 'https://geafwqcjiopeinpqykpk.supabase.co/auth/v1/callback',
    
    // Custom OAuth appearance
    appearance: {
      theme: 'light',
      variables: {
        default: {
          colors: {
            brand: '#985DD7',
            brandAccent: '#7C3AED',
          },
        },
      },
    },
  },
  
  // Email settings for magic links and password resets
  email: {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://skolr.app'}/auth/update-password`,
    
    // Custom email templates can be configured in Supabase dashboard
    templates: {
      subject: {
        confirmation: 'Welcome to Skolr - Confirm your email',
        recovery: 'Reset your Skolr password',
        invite: 'You have been invited to Skolr',
      },
    },
  },
};

// Helper to get OAuth options with consistent branding
export function getOAuthOptions(additionalOptions?: any) {
  return {
    redirectTo: authConfig.oauth.redirectTo,
    options: {
      ...additionalOptions,
      // This helps with branding in OAuth consent screens
      redirectTo: authConfig.oauth.redirectTo,
    },
  };
}