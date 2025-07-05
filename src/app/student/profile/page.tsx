'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Alert } from '@/styles/StyledComponents';
import { ModernButton } from '@/components/shared/ModernButton';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { 
  FiUser, 
  FiMail, 
  FiLock, 
  FiCalendar, 
  FiEdit2, 
  FiSave, 
  FiX,
  FiInfo,
  FiKey,
  FiHome
} from 'react-icons/fi';

const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #FAFBFC 0%, #F3F4F6 100%);
  padding: 32px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: 24px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 16px;
  }
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const ProfileCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const ProfileHeader = styled.div`
  background: linear-gradient(135deg, #7C3AED 0%, #6366F1 100%);
  padding: 48px 32px;
  text-align: center;
  color: white;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 32px 24px;
  }
`;

const Avatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin: 0 auto 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
`;

const ProfileName = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  font-family: ${({ theme }) => theme.fonts.heading};
`;

const ProfileEmail = styled.p`
  font-size: 1rem;
  opacity: 0.9;
  margin: 0;
`;

const ProfileContent = styled.div`
  padding: 32px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 24px;
  }
`;

const Section = styled.div`
  margin-bottom: 32px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E5E7EB;
`;

const SectionIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #F3F4F6;
  color: #7C3AED;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.heading};
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InfoLabel = styled.span`
  font-size: 0.875rem;
  color: #6B7280;
  font-weight: 500;
`;

const InfoValue = styled.span`
  font-size: 1rem;
  color: #111827;
  font-weight: 500;
`;

const FormGrid = styled.div`
  display: grid;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;
  font-family: ${({ theme }) => theme.fonts.body};
  
  &:focus {
    outline: none;
    border-color: #7C3AED;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
  }
  
  &:disabled {
    background: #F9FAFB;
    color: #9CA3AF;
    cursor: not-allowed;
  }
  
  &::placeholder {
    color: #9CA3AF;
  }
`;

const HelpText = styled.small`
  font-size: 0.75rem;
  color: #6B7280;
  margin-top: -4px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid #E5E7EB;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column-reverse;
    
    button {
      width: 100%;
    }
  }
`;

const AccountBadge = styled.span<{ $type: 'pin' | 'email' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${({ $type }) => $type === 'pin' ? '#FEF3C7' : '#E0E7FF'};
  color: ${({ $type }) => $type === 'pin' ? '#F59E0B' : '#6366F1'};
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const LoadingText = styled.p`
  margin-top: 16px;
  color: #6B7280;
  font-size: 1rem;
`;

export default function StudentProfile() {
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    surname: '',
    email: '',
    year_group: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      
      // Use the API endpoint which handles both auth modes
      const response = await fetch('/api/student/profile', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/pin-login');
          return;
        }
        
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || 'Failed to load profile');
      }
      
      const profileData = await response.json();
      
      console.log('[Profile Page] Profile loaded successfully:', {
        student_id: profileData.student_id,
        hasSchool: !!profileData.schools
      });
      
      setProfile(profileData);
      setFormData({
        first_name: profileData.first_name || '',
        surname: profileData.surname || '',
        email: profileData.email || '',
        year_group: profileData.year_group || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccess(null);
    // Reset form to original values
    setFormData({
      first_name: profile.first_name || '',
      surname: profile.surname || '',
      email: profile.email || '',
      year_group: profile.year_group || '',
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      // Validate password fields if changing password
      if (formData.new_password) {
        if (formData.new_password !== formData.confirm_password) {
          throw new Error('Passwords do not match');
        }
        if (formData.new_password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        if (!formData.current_password) {
          throw new Error('Current password is required to change password');
        }
      }

      // Check if this is a direct access account
      const directAccessId = localStorage.getItem('student_direct_access_id') || 
                           localStorage.getItem('current_student_id');
      
      if (directAccessId) {
        // Direct access accounts can't change password or email
        if (formData.new_password) {
          throw new Error('Password changes are not available for PIN login accounts. Please contact your teacher.');
        }
        if (formData.email !== profile.email) {
          throw new Error('Email changes are not available for PIN login accounts. Please contact your teacher.');
        }
      }

      // Use the API endpoint to update profile
      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          surname: formData.surname,
          year_group: formData.year_group,
          email: formData.email,
          new_password: formData.new_password,
          current_password: formData.current_password
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      await fetchProfile(); // Refresh profile data
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (firstName: string | null, surname: string | null) => {
    const first = firstName ? firstName[0] : '';
    const last = surname ? surname[0] : '';
    return (first + last).toUpperCase() || 'S';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingContainer>
            <LoadingSpinner size="large" />
            <LoadingText>Loading your profile...</LoadingText>
          </LoadingContainer>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Container>
        <ProfileCard>
          <ProfileHeader>
            <Avatar>{getInitials(profile?.first_name, profile?.surname)}</Avatar>
            <ProfileName>{`${profile?.first_name || ''} ${profile?.surname || ''}`.trim() || 'Student'}</ProfileName>
            <ProfileEmail>{profile?.email || profile?.username || 'No email set'}</ProfileEmail>
          </ProfileHeader>

          <ProfileContent>
            {error && (
              <Alert variant="error" style={{ marginBottom: '24px' }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success" style={{ marginBottom: '24px' }}>
                {success}
              </Alert>
            )}

            {!isEditing ? (
              <>
                <Section>
                  <SectionHeader>
                    <SectionIcon>
                      <FiUser />
                    </SectionIcon>
                    <SectionTitle>Personal Information</SectionTitle>
                  </SectionHeader>
                  <InfoGrid>
                    <InfoItem>
                      <InfoLabel>First Name</InfoLabel>
                      <InfoValue>{profile?.first_name || 'Not set'}</InfoValue>
                    </InfoItem>
                    <InfoItem>
                      <InfoLabel>Surname</InfoLabel>
                      <InfoValue>{profile?.surname || 'Not set'}</InfoValue>
                    </InfoItem>
                    <InfoItem>
                      <InfoLabel>Username</InfoLabel>
                      <InfoValue>{profile?.username || 'Not set'}</InfoValue>
                    </InfoItem>
                    <InfoItem>
                      <InfoLabel>Student ID</InfoLabel>
                      <InfoValue>{profile?.student_id}</InfoValue>
                    </InfoItem>
                    <InfoItem>
                      <InfoLabel>Year Group</InfoLabel>
                      <InfoValue>{profile?.year_group || 'Not set'}</InfoValue>
                    </InfoItem>
                    <InfoItem>
                      <InfoLabel>School</InfoLabel>
                      <InfoValue>{profile?.schools?.school_name || 'Not set'}</InfoValue>
                    </InfoItem>
                    <InfoItem>
                      <InfoLabel>Email</InfoLabel>
                      <InfoValue>{profile?.email || 'Not set'}</InfoValue>
                    </InfoItem>
                    <InfoItem>
                      <InfoLabel>Account Type</InfoLabel>
                      <InfoValue>
                        {profile?.is_anonymous ? (
                          <AccountBadge $type="pin">
                            <FiKey />
                            PIN Login
                          </AccountBadge>
                        ) : (
                          <AccountBadge $type="email">
                            <FiMail />
                            Email Login
                          </AccountBadge>
                        )}
                      </InfoValue>
                    </InfoItem>
                    {profile?.pin_code && (
                      <InfoItem>
                        <InfoLabel>PIN Code</InfoLabel>
                        <InfoValue>{profile.pin_code}</InfoValue>
                      </InfoItem>
                    )}
                  </InfoGrid>
                </Section>

                <Section>
                  <SectionHeader>
                    <SectionIcon>
                      <FiCalendar />
                    </SectionIcon>
                    <SectionTitle>Account Information</SectionTitle>
                  </SectionHeader>
                  <InfoGrid>
                    <InfoItem>
                      <InfoLabel>Member Since</InfoLabel>
                      <InfoValue>{formatDate(profile?.created_at)}</InfoValue>
                    </InfoItem>
                    <InfoItem>
                      <InfoLabel>Last Updated</InfoLabel>
                      <InfoValue>{formatDate(profile?.updated_at)}</InfoValue>
                    </InfoItem>
                    {profile?.country_code && (
                      <InfoItem>
                        <InfoLabel>Country</InfoLabel>
                        <InfoValue>{profile.country_code}</InfoValue>
                      </InfoItem>
                    )}
                  </InfoGrid>
                </Section>

                <ButtonGroup>
                  <ModernButton
                    variant="primary"
                    onClick={handleEdit}
                  >
                    <FiEdit2 />
                    Edit Profile
                  </ModernButton>
                </ButtonGroup>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <Section>
                  <SectionHeader>
                    <SectionIcon>
                      <FiUser />
                    </SectionIcon>
                    <SectionTitle>Personal Information</SectionTitle>
                  </SectionHeader>
                  <FormGrid>
                    <FormGroup>
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        type="text"
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="Enter your first name"
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label htmlFor="surname">Surname</Label>
                      <Input
                        id="surname"
                        name="surname"
                        type="text"
                        value={formData.surname}
                        onChange={handleChange}
                        placeholder="Enter your surname"
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        disabled={profile?.is_anonymous}
                      />
                      {profile?.is_anonymous && (
                        <HelpText>
                          Email changes are not available for PIN login accounts
                        </HelpText>
                      )}
                    </FormGroup>
                    <FormGroup>
                      <Label htmlFor="year_group">Year Group</Label>
                      <Input
                        id="year_group"
                        name="year_group"
                        type="text"
                        value={formData.year_group}
                        onChange={handleChange}
                        placeholder="e.g., Year 10, Grade 9"
                      />
                    </FormGroup>
                  </FormGrid>
                </Section>

                {!profile?.is_anonymous && (
                  <Section>
                    <SectionHeader>
                      <SectionIcon>
                        <FiLock />
                      </SectionIcon>
                      <SectionTitle>Change Password (Optional)</SectionTitle>
                    </SectionHeader>
                    <FormGrid>
                      <FormGroup>
                        <Label htmlFor="current_password">Current Password</Label>
                        <Input
                          id="current_password"
                          name="current_password"
                          type="password"
                          value={formData.current_password}
                          onChange={handleChange}
                          placeholder="Enter current password"
                        />
                      </FormGroup>
                      <FormGroup>
                        <Label htmlFor="new_password">New Password</Label>
                        <Input
                          id="new_password"
                          name="new_password"
                          type="password"
                          value={formData.new_password}
                          onChange={handleChange}
                          placeholder="Enter new password (min 6 characters)"
                        />
                      </FormGroup>
                      <FormGroup>
                        <Label htmlFor="confirm_password">Confirm New Password</Label>
                        <Input
                          id="confirm_password"
                          name="confirm_password"
                          type="password"
                          value={formData.confirm_password}
                          onChange={handleChange}
                          placeholder="Confirm new password"
                        />
                      </FormGroup>
                    </FormGrid>
                  </Section>
                )}

                <ButtonGroup>
                  <ModernButton
                    type="button"
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <FiX />
                    Cancel
                  </ModernButton>
                  <ModernButton
                    type="submit"
                    variant="primary"
                    disabled={isSaving}
                  >
                    <FiSave />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </ModernButton>
                </ButtonGroup>
              </form>
            )}
          </ProfileContent>
        </ProfileCard>
      </Container>
    </PageWrapper>
  );
}