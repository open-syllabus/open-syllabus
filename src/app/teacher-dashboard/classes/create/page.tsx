// src/app/teacher-dashboard/classes/create/page.tsx
'use client';

import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { Card, Alert } from '@/styles/StyledComponents';
import { ModernButton } from '@/components/shared/ModernButton';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import type { CreateClassData } from '@/types/class.types';
import { FiUpload, FiCheck } from 'react-icons/fi';

const PageContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 0.5rem 0;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 1rem;
  margin: 0;
`;

const FormCard = styled(Card)`
  padding: 2rem;
`;

const FormSection = styled.div`
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ theme }) => theme.colors.ui.background};
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.primary}20;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ theme }) => theme.colors.ui.background};
  resize: vertical;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.primary}20;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ theme }) => theme.colors.ui.background};
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.primary}20;
  }
`;

const HelpText = styled.p`
  font-size: 0.813rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-top: 0.25rem;
  margin-bottom: 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
`;

const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Step = styled.div<{ $active: boolean; $completed: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  background: ${({ $active, $completed, theme }) => 
    $active ? theme.colors.brand.primary : 
    $completed ? theme.colors.status.success : 
    theme.colors.ui.backgroundDark};
  color: ${({ $active, $completed }) => 
    ($active || $completed) ? 'white' : 'inherit'};
  font-weight: ${({ $active }) => $active ? 600 : 400};
  transition: all 0.2s ease;
`;

const FileUploadArea = styled.div<{ $isDragging?: boolean }>`
  border: 2px dashed ${({ theme, $isDragging }) => 
    $isDragging ? theme.colors.brand.primary : theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: 3rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${({ theme, $isDragging }) => 
    $isDragging ? `${theme.colors.brand.primary}10` : 'transparent'};

  &:hover {
    border-color: ${({ theme }) => theme.colors.brand.primary};
    background: ${({ theme }) => `${theme.colors.brand.primary}05`};
  }

  svg {
    width: 48px;
    height: 48px;
    color: ${({ theme }) => theme.colors.brand.primary};
    margin-bottom: 1rem;
  }
`;

const UploadText = styled.div`
  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: ${({ theme }) => theme.colors.text.primary};
  }

  p {
    color: ${({ theme }) => theme.colors.text.secondary};
    margin: 0;
  }
`;

const FileInfo = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.ui.backgroundDark};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  text-align: left;

  h4 {
    font-size: 0.875rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  ul {
    margin: 0;
    padding-left: 1.5rem;
    font-size: 0.813rem;
    color: ${({ theme }) => theme.colors.text.secondary};
    
    li {
      margin-bottom: 0.25rem;
    }
  }
`;

const SuccessMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: ${({ theme }) => `${theme.colors.status.success}10`};
  border: 1px solid ${({ theme }) => theme.colors.status.success};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  margin-bottom: 1.5rem;

  svg {
    width: 24px;
    height: 24px;
    color: ${({ theme }) => theme.colors.status.success};
    flex-shrink: 0;
  }

  div {
    flex: 1;
    
    h4 {
      margin: 0 0 0.25rem 0;
      color: ${({ theme }) => theme.colors.status.success};
      font-weight: 600;
    }

    p {
      margin: 0;
      color: ${({ theme }) => theme.colors.text.secondary};
      font-size: 0.875rem;
    }
  }
`;

const ErrorDetails = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: ${({ theme }) => `${theme.colors.status.danger}10`};
  border: 1px solid ${({ theme }) => theme.colors.status.danger};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  max-height: 200px;
  overflow-y: auto;

  h4 {
    margin: 0 0 0.5rem 0;
    color: ${({ theme }) => theme.colors.status.danger};
    font-size: 0.875rem;
    font-weight: 600;
  }

  ul {
    margin: 0;
    padding-left: 1.5rem;
    font-size: 0.813rem;
    color: ${({ theme }) => theme.colors.text.primary};
    
    li {
      margin-bottom: 0.25rem;
    }
  }
`;

export default function CreateClassPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [createdClassId, setCreatedClassId] = useState<string | null>(null);
  const [createdClassName, setCreatedClassName] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<{ created: number; linked: number; errors: number } | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Array<{ row: number; error: string; details?: string }>>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState<CreateClassData>({
    name: '',
    description: '',
    academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    grade_level: '',
    subject: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Class name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/teacher/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          academic_year: formData.academic_year?.trim() || null,
          grade_level: formData.grade_level?.trim() || null,
          subject: formData.subject?.trim() || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create class');
      }

      // Move to step 2 for CSV upload
      setCreatedClassId(data.class.class_id);
      setCreatedClassName(formData.name);
      setStep(2);
      setError(null);
    } catch (err) {
      console.error('Error creating class:', err);
      setError(err instanceof Error ? err.message : 'Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (step === 2 && createdClassId) {
      router.push(`/teacher-dashboard/classes/${createdClassId}`);
    } else {
      router.push('/teacher-dashboard/classes');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!createdClassId) return;

    try {
      setUploading(true);
      setError(null);
      setUploadErrors([]); // Clear previous errors

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/teacher/classes/${createdClassId}/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Store the result
      setUploadResult({
        created: data.summary?.created || data.created || 0,
        linked: data.summary?.linked_existing || data.linked_existing || 0,
        errors: data.errors?.length || data.details?.errors?.length || 0
      });

      // Show any errors
      const errors = data.errors || data.details?.errors || [];
      if (errors.length > 0) {
        setUploadErrors(errors);
        console.error('Upload errors:');
        errors.forEach((err: any) => {
          console.error(`Row ${err.row}: ${err.error}${err.details ? ` - ${err.details}` : ''}`);
        });
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      handleFileUpload(file);
    } else {
      setError('Please upload a CSV file');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleFinish = () => {
    if (createdClassId) {
      router.push(`/teacher-dashboard/classes/${createdClassId}`);
    }
  };

  // Generate academic year options
  const currentYear = new Date().getFullYear();
  const academicYears = Array.from({ length: 5 }, (_, i) => {
    const startYear = currentYear - 2 + i;
    return `${startYear}-${startYear + 1}`;
  });

  return (
    <PageContainer>
      <Header>
        <Title>{step === 1 ? 'Create New Class' : 'Add Students'}</Title>
        <Subtitle>
          {step === 1 
            ? 'Set up a new class to organize your students' 
            : `Add students to ${createdClassName}`}
        </Subtitle>
      </Header>

      <StepIndicator>
        <Step $active={step === 1} $completed={step > 1}>
          <span>1</span>
          <span>Class Details</span>
        </Step>
        <Step $active={step === 2} $completed={false}>
          <span>2</span>
          <span>Add Students</span>
        </Step>
      </StepIndicator>

      {error && (
        <Alert variant="error" style={{ marginBottom: '1rem' }}>
          {error}
        </Alert>
      )}

      {step === 1 ? (
        <FormCard>
        <form onSubmit={handleSubmit}>
          <FormSection>
            <Label htmlFor="name">Class Name *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Mathematics Period 3"
              required
              disabled={loading}
            />
            <HelpText>Choose a unique name for this class</HelpText>
          </FormSection>

          <FormSection>
            <Label htmlFor="description">Description</Label>
            <TextArea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Optional description or notes about this class"
              disabled={loading}
            />
          </FormSection>

          <FormSection>
            <Label htmlFor="academic_year">Academic Year</Label>
            <Select
              id="academic_year"
              name="academic_year"
              value={formData.academic_year}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">Select academic year</option>
              {academicYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </Select>
          </FormSection>

          <FormSection>
            <Label htmlFor="grade_level">Grade Level</Label>
            <Input
              id="grade_level"
              name="grade_level"
              type="text"
              value={formData.grade_level}
              onChange={handleChange}
              placeholder="e.g., Year 9, Grade 10"
              disabled={loading}
            />
          </FormSection>

          <FormSection>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              name="subject"
              type="text"
              value={formData.subject}
              onChange={handleChange}
              placeholder="e.g., Mathematics, English, Science"
              disabled={loading}
            />
          </FormSection>

          <ButtonGroup>
            <ModernButton
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </ModernButton>
            <ModernButton
              type="submit"
              variant="primary"
              disabled={loading || !formData.name.trim()}
            >
              {loading ? 'Creating...' : 'Create Class'}
            </ModernButton>
          </ButtonGroup>
        </form>
      </FormCard>
      ) : (
        <FormCard>
          {uploadResult && (
            <SuccessMessage>
              <FiCheck />
              <div>
                <h4>Upload Complete!</h4>
                <p>
                  ✓ Created: {uploadResult.created} new students<br/>
                  {uploadResult.linked > 0 && `✓ Linked: ${uploadResult.linked} existing students`}
                  {uploadResult.errors > 0 && (
                    <>
                      <br/>
                      <span style={{ color: 'var(--danger)' }}>
                        ✗ Errors: {uploadResult.errors} students (check console for details)
                      </span>
                    </>
                  )}
                </p>
              </div>
            </SuccessMessage>
          )}

          {uploadErrors.length > 0 && (
            <ErrorDetails>
              <h4>Upload Errors ({uploadErrors.length})</h4>
              <ul>
                {uploadErrors.slice(0, 10).map((err, index) => (
                  <li key={index}>
                    Row {err.row}: {err.error}
                    {err.details && ` - ${err.details}`}
                  </li>
                ))}
                {uploadErrors.length > 10 && (
                  <li>... and {uploadErrors.length - 10} more errors</li>
                )}
              </ul>
            </ErrorDetails>
          )}

          <FileUploadArea
            $isDragging={isDragging}
            onDrop={handleDrop}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              disabled={uploading}
            />
            {uploading ? (
              <>
                <LoadingSpinner size="large" />
                <UploadText>
                  <h3>Uploading Students...</h3>
                  <p>Please wait while we process your file</p>
                </UploadText>
              </>
            ) : (
              <>
                <FiUpload />
                <UploadText>
                  <h3>Upload Student List</h3>
                  <p>Drag and drop a CSV file here, or click to browse</p>
                </UploadText>
              </>
            )}
          </FileUploadArea>

          <FileInfo>
            <h4>CSV Format Requirements:</h4>
            <ul>
              <li><strong>First Name</strong> - Required: Student's first name</li>
              <li><strong>Surname</strong> - Required: Student's last name</li>
              <li><strong>Year Group</strong> - Optional: Student's year/grade level (e.g., Year 9)</li>
            </ul>
            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-light)' }}>
              A username and 4-digit PIN will be generated for each student automatically.
            </p>
          </FileInfo>

          <ButtonGroup>
            <ModernButton
              type="button"
              variant="ghost"
              onClick={() => router.push('/teacher-dashboard/classes')}
              disabled={uploading}
            >
              Skip This Step
            </ModernButton>
            <ModernButton
              type="button"
              variant="primary"
              onClick={handleFinish}
              disabled={uploading}
            >
              {uploadResult ? 'View Class' : 'Finish Without Students'}
            </ModernButton>
          </ButtonGroup>
        </FormCard>
      )}
    </PageContainer>
  );
}