'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { createClient } from '@/lib/supabase/client';
import { ModernButton } from '@/components/shared/ModernButton';
import { FiCheck, FiAlertCircle } from 'react-icons/fi';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(180deg, #FAFBFC 0%, #F3F4F6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const OnboardingCard = styled.div`
  background: white;
  border-radius: 24px;
  padding: 48px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 32px 24px;
  }
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 800;
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 16px;
  text-align: center;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 28px;
  }
`;

const Subtitle = styled.p`
  font-size: 18px;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  margin-bottom: 40px;
  line-height: 1.6;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 16px;
    margin-bottom: 32px;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 2px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: 12px;
  font-size: 16px;
  background: white;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.primary}20;
  }
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.brand.primary}50;
  }
`;

const HelpText = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  display: flex;
  align-items: flex-start;
  gap: 8px;
  line-height: 1.5;
  
  svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const ErrorMessage = styled.div`
  background: ${({ theme }) => theme.colors.status.danger}10;
  color: ${({ theme }) => theme.colors.status.danger};
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SuccessMessage = styled.div`
  background: ${({ theme }) => theme.colors.status.success}10;
  color: ${({ theme }) => theme.colors.status.success};
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export default function TeacherOnboarding() {
  const [countryCode, setCountryCode] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [needsSchool, setNeedsSchool] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth?type=teacher_signup');
          return;
        }

        // Check if user already has a teacher profile with country code and school
        const { data: profile } = await supabase
          .from('teacher_profiles')
          .select('country_code, school_id')
          .eq('user_id', user.id)
          .single();

        // Check if they need to add school
        if (!profile?.school_id) {
          setNeedsSchool(true);
        }

        // If they have both country code and school, redirect to dashboard
        if (profile?.country_code && profile?.school_id) {
          router.push(`/teacher-dashboard?_t=${Date.now()}`);
          return;
        }

        setCheckingAuth(false);
      } catch (error) {
        console.error('Error checking auth:', error);
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!countryCode) {
      setError('Please select your country');
      return;
    }

    if (needsSchool && !schoolName.trim()) {
      setError('Please enter your school name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      // If they need a school, create it first
      let schoolId = null;
      if (needsSchool && schoolName.trim()) {
        const { data: schoolData, error: schoolError } = await supabase
          .from('schools')
          .insert({ name: schoolName.trim() })
          .select('school_id')
          .single();

        if (schoolError) throw schoolError;
        schoolId = schoolData.school_id;
      }

      // Update teacher profile with country code and school_id if needed
      const updateData: any = {
        country_code: countryCode === 'OTHER' ? null : countryCode,
        updated_at: new Date().toISOString()
      };

      if (schoolId) {
        updateData.school_id = schoolId;
      }

      const { error: updateError } = await supabase
        .from('teacher_profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setSuccess(true);
      
      // Set onboarding state to start the guided tour
      localStorage.setItem('teacher_onboarding_state', JSON.stringify({
        currentStep: 'navigate_to_students',
        isOnboarding: true
      }));
      console.log('[TeacherOnboarding] Set onboarding state to start guided tour');
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push(`/teacher-dashboard?_t=${Date.now()}`);
      }, 1500);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <PageContainer>
        <OnboardingCard>
          <Title>Loading...</Title>
        </OnboardingCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <OnboardingCard>
        <Title>Welcome to Skolr! 👋</Title>
        <Subtitle>
          {needsSchool ? 'Please complete your school and location setup' : 'One quick step to complete your setup'}
        </Subtitle>

        {error && (
          <ErrorMessage>
            <FiAlertCircle />
            {error}
          </ErrorMessage>
        )}

        {success && (
          <SuccessMessage>
            <FiCheck />
            Profile updated! Redirecting to your dashboard...
          </SuccessMessage>
        )}

        <Form onSubmit={handleSubmit}>
          {needsSchool && (
            <FormGroup>
              <Label htmlFor="school">School Name</Label>
              <input
                type="text"
                id="school"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Enter your school name"
                required={needsSchool}
                disabled={loading || success}
                style={{
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  fontSize: '16px',
                  background: 'white',
                  transition: 'all 0.2s ease',
                  width: '100%'
                }}
              />
            </FormGroup>
          )}
          
          <FormGroup>
            <Label htmlFor="country">Where are you based?</Label>
            <Select
              id="country"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              required
              disabled={loading || success}
            >
              <option value="">Select your country</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="MY">Malaysia</option>
              <option value="NZ">New Zealand</option>
              <option value="AE">United Arab Emirates</option>
              <option value="IE">Ireland</option>
              <option value="FR">France</option>
              <option value="ES">Spain</option>
              <option value="IT">Italy</option>
              <option value="PT">Portugal</option>
              <option value="DE">Germany</option>
              <option value="GR">Greece</option>
              <option value="OTHER">Other Country</option>
            </Select>
            <HelpText>
              <FiAlertCircle size={16} />
              This helps us provide localized safety resources for your students if a concern is flagged.
            </HelpText>
          </FormGroup>

          <ModernButton
            type="submit"
            variant="primary"
            size="large"
            disabled={loading || !countryCode || success}
            style={{ width: '100%', marginTop: '16px' }}
          >
            {loading ? 'Saving...' : 'Complete Setup'}
          </ModernButton>
        </Form>
      </OnboardingCard>
    </PageContainer>
  );
}