# Google Authentication Setup Guide for Skolr

## Prerequisites Completed
1. ✅ Google Cloud Project created
2. ✅ OAuth consent screen configured
3. ✅ OAuth 2.0 credentials generated (Client ID & Secret)
4. ✅ Supabase Google provider configured

## Step 6: Add Google Sign-In Button to AuthForm

Add this code to your AuthForm component (`src/components/auth/AuthForm.tsx`):

### 1. Import Google icon (add to imports section):
```tsx
import { FiMail } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc'; // Add this line
```

### 2. Add styled component for OAuth buttons (after other styled components):
```tsx
const OAuthContainer = styled.div`
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const OAuthButton = styled(ModernButton)`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 16px;
  
  svg {
    font-size: 20px;
  }
`;

const OrDivider = styled.div`
  text-align: center;
  margin: 20px 0;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 14px;
  position: relative;
  
  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    width: calc(50% - 30px);
    height: 1px;
    background: ${({ theme }) => theme.colors.border};
  }
  
  &::before {
    left: 0;
  }
  
  &::after {
    right: 0;
  }
`;
```

### 3. Add Google sign-in handler (inside AuthForm component):
```tsx
const handleGoogleSignIn = async () => {
  setLoading(true);
  setError('');
  
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    if (error) throw error;
  } catch (error) {
    console.error('Google sign-in error:', error);
    setError('Failed to sign in with Google. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

### 4. Add Google button to the form (add before the submit button):
```tsx
{/* Add this before the existing form */}
<OAuthContainer>
  <OAuthButton
    type="button"
    variant="secondary"
    onClick={handleGoogleSignIn}
    disabled={loading}
  >
    <FcGoogle />
    Continue with Google
  </OAuthButton>
</OAuthContainer>

<OrDivider>or</OrDivider>

{/* Existing email/password form continues here */}
```

## Step 7: Update Auth Callback Route

Your callback route at `src/app/auth/callback/route.ts` should handle the Google OAuth callback:

```tsx
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirect = requestUrl.searchParams.get('redirect') || '/';

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    
    // Check if user has a profile and redirect accordingly
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Check for teacher profile
      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single();
        
      if (teacherProfile) {
        return NextResponse.redirect(new URL('/teacher-dashboard', requestUrl.origin));
      }
      
      // Check for student profile
      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single();
        
      if (studentProfile) {
        return NextResponse.redirect(new URL('/student/dashboard', requestUrl.origin));
      }
      
      // No profile exists - redirect to profile setup
      return NextResponse.redirect(new URL('/auth?setup=profile', requestUrl.origin));
    }
  }

  // Return to homepage if no code or error
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}
```

## Step 8: Handle First-Time Google Users

For users signing in with Google for the first time, you'll need to create their profile. Add this to your AuthForm:

```tsx
// Check if this is a new Google user who needs profile setup
useEffect(() => {
  const checkNewGoogleUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && !user.user_metadata.full_name && searchParams?.get('setup') === 'profile') {
      // This is a new Google user - show profile setup
      setShowProfileSetup(true);
    }
  };
  
  checkNewGoogleUser();
}, [supabase, searchParams]);
```

## Step 9: Test Your Implementation

1. Clear your browser cookies/cache
2. Go to your app and click "Continue with Google"
3. You should be redirected to Google's sign-in page
4. After signing in, you'll be redirected back to your app
5. The app should create a profile and redirect to the appropriate dashboard

## Troubleshooting

### Common Issues:

1. **Redirect URI mismatch**: Make sure the redirect URI in Google Console matches exactly:
   - Development: `https://geafwqcjiopeinpqykpk.supabase.co/auth/v1/callback`

2. **CORS errors**: These usually indicate the redirect URI is misconfigured

3. **User not redirected after sign-in**: Check your callback route logic

4. **Profile not created**: Ensure your database has proper RLS policies for profile creation

## Security Notes

1. Never expose your Client Secret in client-side code
2. Always use HTTPS in production
3. Implement proper error handling for failed authentications
4. Consider implementing rate limiting for auth endpoints

## Next Steps

1. Add profile completion flow for Google users without full profiles
2. Implement account linking (allow users to connect Google to existing email accounts)
3. Add more OAuth providers (Microsoft, Apple, etc.)
4. Implement proper session management and refresh token handling