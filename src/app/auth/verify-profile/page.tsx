'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { createClient } from '@/lib/supabase/client';
import { FiLoader, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { ModernButton } from '@/components/shared/ModernButton';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.ui.background};
  padding: 20px;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.ui.backgroundLight};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: 48px;
  max-width: 480px;
  width: 100%;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  text-align: center;
`;

const IconContainer = styled.div<{ $status: 'loading' | 'success' | 'error' | 'timeout' }>`
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: ${({ theme, $status }) => 
    $status === 'loading' ? `${theme.colors.brand.primary}20` :
    $status === 'success' ? `${theme.colors.status.success}20` :
    ($status === 'error' || $status === 'timeout') ? `${theme.colors.status.danger}20` :
    `${theme.colors.status.danger}20`
  };
  color: ${({ theme, $status }) => 
    $status === 'loading' ? theme.colors.brand.primary :
    $status === 'success' ? theme.colors.status.success :
    ($status === 'error' || $status === 'timeout') ? theme.colors.status.danger :
    theme.colors.status.danger
  };
  
  svg {
    width: 40px;
    height: 40px;
  }
`;

const LoadingIcon = styled(FiLoader)`
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 12px;
`;

const Message = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 32px;
  line-height: 1.5;
`;

const ErrorDetails = styled.pre`
  background: ${({ theme }) => theme.colors.ui.background};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: 16px;
  margin-bottom: 24px;
  text-align: left;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

type ProfileStatus = 'loading' | 'success' | 'error' | 'timeout';

export default function VerifyProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState<ProfileStatus>('loading');
  const [message, setMessage] = useState('Setting up your profile...');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  
  const maxAttempts = 3;
  const timeoutDuration = 10000; // 10 seconds
  
  const ensureProfile = async () => {
    try {
      setStatus('loading');
      setMessage('Creating your teacher profile...');
      setErrorDetails(null);
      
      // Call the ensure-profile API
      const response = await fetch('/api/auth/ensure-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create profile');
      }
      
      if (data.profile) {
        setStatus('success');
        setMessage(data.created ? 'Profile created successfully!' : 'Profile verified!');
        
        // Get the latest user data to check for required fields
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not found');
        }
        
        // Check if onboarding is needed
        const profileData = data.profile;
        if (!profileData.country_code || !profileData.school_id) {
          // Redirect to onboarding
          setTimeout(() => {
            router.push('/teacher-onboarding');
          }, 1500);
        } else {
          // Check admin status
          const { data: isSuperAdmin } = await supabase.rpc('is_super_admin', { 
            p_user_id: user.id 
          });
          
          if (isSuperAdmin) {
            setTimeout(() => {
              router.push('/super-admin');
            }, 1500);
          } else {
            // Check school admin
            const { data: schoolAdmin } = await supabase
              .from('school_admins')
              .select('school_id')
              .eq('user_id', user.id)
              .maybeSingle();
            
            if (schoolAdmin) {
              setTimeout(() => {
                router.push('/admin');
              }, 1500);
            } else {
              // Regular teacher
              setTimeout(() => {
                router.push('/teacher-dashboard');
              }, 1500);
            }
          }
        }
      } else {
        throw new Error('No profile returned from API');
      }
    } catch (error) {
      console.error('[verify-profile] Error:', error);
      setStatus('error');
      setMessage('Failed to create your profile');
      setErrorDetails(error instanceof Error ? error.message : 'Unknown error');
      setAttempts(prev => prev + 1);
    }
  };
  
  useEffect(() => {
    // Start the profile creation process
    ensureProfile();
    
    // Set a timeout for the entire process
    const timeout = setTimeout(() => {
      if (status === 'loading') {
        setStatus('timeout');
        setMessage('This is taking longer than expected...');
      }
    }, timeoutDuration);
    
    return () => clearTimeout(timeout);
  }, []);
  
  const handleRetry = () => {
    if (attempts < maxAttempts) {
      ensureProfile();
    } else {
      // Too many attempts - redirect to home
      router.push('/');
    }
  };
  
  const handleContactSupport = () => {
    window.location.href = 'mailto:support@skolr.app?subject=Profile Creation Issue';
  };
  
  return (
    <Container>
      <Card>
        <IconContainer $status={status}>
          {status === 'loading' && <LoadingIcon />}
          {status === 'success' && <FiCheckCircle />}
          {(status === 'error' || status === 'timeout') && <FiAlertCircle />}
        </IconContainer>
        
        <Title>
          {status === 'loading' && 'Setting Up Your Account'}
          {status === 'success' && 'Success!'}
          {status === 'error' && 'Something Went Wrong'}
          {status === 'timeout' && 'Taking Too Long'}
        </Title>
        
        <Message>{message}</Message>
        
        {errorDetails && (
          <ErrorDetails>{errorDetails}</ErrorDetails>
        )}
        
        {(status === 'error' || status === 'timeout') && (
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {attempts < maxAttempts && (
              <ModernButton
                variant="primary"
                onClick={handleRetry}
              >
                Try Again ({maxAttempts - attempts} attempts left)
              </ModernButton>
            )}
            <ModernButton
              variant="secondary"
              onClick={handleContactSupport}
            >
              Contact Support
            </ModernButton>
          </div>
        )}
      </Card>
    </Container>
  );
}