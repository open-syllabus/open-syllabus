'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { createClient } from '@/lib/supabase/client';
import { FiArrowLeft, FiSend, FiHome, FiMail, FiShield } from 'react-icons/fi';
import Link from 'next/link';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
`;

const Content = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  text-decoration: none;
  margin-bottom: 2rem;
  opacity: 0.9;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: 2rem;
`;

const InfoBox = styled.div`
  background: ${({ theme }) => theme.colors.ui.pastelBlue};
  border: 1px solid ${({ theme }) => theme.colors.status.info};
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 2px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
  }
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  border: 2px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.2s;
  background: white;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
  }
`;

const PermissionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 0.5rem;
`;

const PermissionItem = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
`;

const Checkbox = styled.input`
  width: 1.25rem;
  height: 1.25rem;
  accent-color: ${({ theme }) => theme.colors.brand.primary};
`;

const Button = styled.button`
  background: ${({ theme }) => theme.colors.brand.primary};
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const Alert = styled.div<{ type: 'success' | 'error' }>`
  padding: 1rem;
  border-radius: 10px;
  margin-bottom: 1rem;
  background: ${({ type, theme }) => 
    type === 'success' ? theme.colors.ui.pastelGreen : theme.colors.ui.pastelPink};
  color: ${({ type, theme }) => 
    type === 'success' ? theme.colors.status.success : theme.colors.status.danger};
`;

export default function CreateAdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    schoolId: '',
    schoolName: '',
    permissions: {
      manage_students: true,
      manage_teachers: true,
      manage_billing: false,
      view_analytics: true
    }
  });

  useEffect(() => {
    // Load existing schools
    async function loadSchools() {
      const { data } = await supabase
        .from('schools')
        .select('school_id, name')
        .order('name');
      
      if (data) {
        setSchools(data);
      }
    }
    loadSchools();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // If no school ID, create a new school
      let schoolId = formData.schoolId;
      if (!schoolId && formData.schoolName) {
        const schoolRes = await fetch('/api/super-admin/schools/create', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
          body: JSON.stringify({ name: formData.schoolName })
        });

        if (!schoolRes.ok) {
          const errorData = await schoolRes.json();
          console.error('School creation error:', errorData);
          throw new Error(errorData.error || 'Failed to create school');
        }
        const schoolData = await schoolRes.json();
        schoolId = schoolData.school_id;
      }

      // Create admin invitation
      const res = await fetch('/api/admin/invitation/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          email: formData.email,
          school_id: schoolId,
          permissions: formData.permissions
        })
      });

      const responseData = await res.json();
      
      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to create invitation');
      }

      // Check if it was an upgrade or invitation
      if (responseData.upgraded) {
        setMessage({ type: 'success', text: 'Teacher upgraded to admin successfully!' });
      } else {
        setMessage({ type: 'success', text: 'Admin invitation sent successfully!' });
      }
      
      setTimeout(() => router.push('/super-admin'), 2000);
    } catch (error) {
      console.error('Error creating admin:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to create admin. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Content>
        <BackButton href="/super-admin">
          <FiArrowLeft size={20} />
          Back to Dashboard
        </BackButton>

        <Card>
          <Title>Create School Admin</Title>
          <Subtitle>Invite a new administrator to manage a school on Skolr</Subtitle>

          <InfoBox>
            <strong>Note:</strong> If the email belongs to an existing teacher on Skolr, they will be automatically upgraded to an admin. Otherwise, an invitation will be sent for them to sign up.
          </InfoBox>

          {message && (
            <Alert type={message.type}>{message.text}</Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>
                <FiMail size={18} />
                Email Address
              </Label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@school.edu"
              />
            </FormGroup>

            <FormGroup>
              <Label>
                <FiHome size={18} />
                School
              </Label>
              <Select
                value={formData.schoolId}
                onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
              >
                <option value="">Create New School</option>
                {schools.map(school => (
                  <option key={school.school_id} value={school.school_id}>
                    {school.name}
                  </option>
                ))}
              </Select>
            </FormGroup>

            {!formData.schoolId && (
              <FormGroup>
                <Label>School Name</Label>
                <Input
                  type="text"
                  required={!formData.schoolId}
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  placeholder="Enter school name"
                />
              </FormGroup>
            )}

            <FormGroup>
              <Label>
                <FiShield size={18} />
                Permissions
              </Label>
              <PermissionsGrid>
                <PermissionItem>
                  <Checkbox
                    type="checkbox"
                    checked={formData.permissions.manage_students}
                    onChange={(e) => setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, manage_students: e.target.checked }
                    })}
                  />
                  Manage Students
                </PermissionItem>
                <PermissionItem>
                  <Checkbox
                    type="checkbox"
                    checked={formData.permissions.manage_teachers}
                    onChange={(e) => setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, manage_teachers: e.target.checked }
                    })}
                  />
                  Manage Teachers
                </PermissionItem>
                <PermissionItem>
                  <Checkbox
                    type="checkbox"
                    checked={formData.permissions.manage_billing}
                    onChange={(e) => setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, manage_billing: e.target.checked }
                    })}
                  />
                  Manage Billing
                </PermissionItem>
                <PermissionItem>
                  <Checkbox
                    type="checkbox"
                    checked={formData.permissions.view_analytics}
                    onChange={(e) => setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, view_analytics: e.target.checked }
                    })}
                  />
                  View Analytics
                </PermissionItem>
              </PermissionsGrid>
            </FormGroup>

            <Button type="submit" disabled={loading}>
              <FiSend size={18} />
              {loading ? 'Sending Invitation...' : 'Send Invitation'}
            </Button>
          </Form>
        </Card>
      </Content>
    </Container>
  );
}