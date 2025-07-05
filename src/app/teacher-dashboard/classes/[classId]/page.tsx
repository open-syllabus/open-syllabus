// src/app/teacher-dashboard/classes/[classId]/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { Card, Alert } from '@/styles/StyledComponents';
import { ModernButton } from '@/components/shared/ModernButton';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import type { ClassWithStudents, StudentInfo, UpdateClassData } from '@/types/class.types';

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const TitleSection = styled.div`
  flex: 1;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 0.5rem 0;
`;

const ClassMeta = styled.div`
  display: flex;
  gap: 1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.875rem;
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const SectionCard = styled(Card)`
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const StudentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
`;

const StudentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StudentRow = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.ui.background};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.ui.background};
  }
`;

const SuccessModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  background: white;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  padding: 2rem;
  max-width: 500px;
  width: 90%;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

const SuccessContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;

  svg {
    width: 24px;
    height: 24px;
    color: ${({ theme }) => theme.colors.status.success};
    flex-shrink: 0;
  }

  div {
    flex: 1;
    
    h4 {
      margin: 0 0 0.5rem 0;
      color: ${({ theme }) => theme.colors.text.primary};
      font-size: 1.125rem;
      font-weight: 600;
    }

    p {
      margin: 0 0 0.5rem 0;
      color: ${({ theme }) => theme.colors.text.secondary};
      font-size: 0.875rem;
      line-height: 1.5;
    }

    ul {
      margin: 0.5rem 0 0 0;
      padding-left: 1.5rem;
      color: ${({ theme }) => theme.colors.text.secondary};
      font-size: 0.813rem;
      
      li {
        margin-bottom: 0.25rem;
      }
    }
  }
`;

const SpinnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;

  p {
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 0.875rem;
  }
`;

const StudentCard = styled.div`
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.ui.background};
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.ui.background};
  }
`;

const StudentInfo = styled.div`
  flex: 1;
`;

const StudentName = styled.div`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const StudentEmail = styled.div`
  font-size: 0.813rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const Modal = styled.div<{ $isOpen: boolean }>`
  display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled(Card)`
  background: ${({ theme }) => theme.colors.ui.background};
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: 0.875rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: 0.875rem;
  min-height: 80px;
  resize: vertical;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
`;

const FileUploadArea = styled.div`
  border: 2px dashed ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.brand.primary};
    background: ${({ theme }) => theme.colors.ui.background};
  }

  &.dragging {
    border-color: ${({ theme }) => theme.colors.brand.primary};
    background: ${({ theme }) => theme.colors.brand.primary}10;
  }
`;

interface PageProps {
  params: Promise<{
    classId: string;
  }>;
}

export default function ClassDetailPage({ params }: PageProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [classData, setClassData] = useState<ClassWithStudents | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editData, setEditData] = useState<UpdateClassData>({});
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [classId, setClassId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    created: number;
    linked: number;
    errors: number;
    errorDetails?: Array<{ row: number; error: string }>;
  } | null>(null);

  useEffect(() => {
    params.then(p => {
      setClassId(p.classId);
    });
  }, [params]);

  useEffect(() => {
    if (classId) {
      fetchClassData();
    }
  }, [classId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchClassData = async () => {
    if (!classId) return;
    
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/teacher/classes/${classId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Class not found');
        }
        throw new Error('Failed to fetch class data');
      }

      const data = await response.json();
      setClassData(data.class);
      setEditData({
        name: data.class.name,
        description: data.class.description || '',
        academic_year: data.class.academic_year || '',
        grade_level: data.class.grade_level || '',
        subject: data.class.subject || ''
      });
    } catch (err) {
      console.error('Error fetching class:', err);
      setError(err instanceof Error ? err.message : 'Failed to load class');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!classData) return;

    try {
      setError(null);
      const response = await fetch(`/api/teacher/classes/${classData.class_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData)
      });

      if (!response.ok) {
        throw new Error('Failed to update class');
      }

      const data = await response.json();
      setClassData({ ...classData, ...data.class });
      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating class:', err);
      setError('Failed to update class. Please try again.');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!classData) return;

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/teacher/classes/${classData.class_id}/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Process results
      const totalProcessed = data.summary?.created || data.created || 0;
      const totalErrors = data.summary?.errors || data.errors?.length || 0;
      const totalLinked = data.summary?.linked_existing || data.linked_existing || 0;
      
      console.log('Upload result:', data);
      
      // Show detailed results
      if (totalProcessed > 0 || totalLinked > 0) {
        setUploadResult({
          created: totalProcessed,
          linked: totalLinked,
          errors: totalErrors,
          errorDetails: data.errors
        });
        setShowSuccessModal(true);
        setShowUploadModal(false);
        fetchClassData(); // Refresh the class data
      } else if (totalErrors > 0) {
        // Only errors, no successes
        setError(`Upload failed with ${totalErrors} errors. Please check your CSV file.`);
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
    setDragActive(false);

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
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleArchive = async () => {
    if (!classData || !confirm('Are you sure you want to archive this class?')) return;

    try {
      const response = await fetch(`/api/teacher/classes/${classData.class_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_archived: true })
      });

      if (!response.ok) {
        throw new Error('Failed to archive class');
      }

      router.push('/teacher-dashboard/classes');
    } catch (err) {
      console.error('Error archiving class:', err);
      setError('Failed to archive class');
    }
  };

  const handleDelete = async () => {
    if (!classData || !confirm('Are you sure you want to delete this class? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/teacher/classes/${classData.class_id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete class');
      }

      router.push('/teacher-dashboard/classes');
    } catch (err) {
      console.error('Error deleting class:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete class');
    }
  };

  if (loading || !classId) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  if (!classData) {
    return (
      <PageContainer>
        <Alert variant="error">Class not found</Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <TitleSection>
          <Title>{classData.name}</Title>
          <ClassMeta>
            {classData.grade_level && <MetaItem>Grade: {classData.grade_level}</MetaItem>}
            {classData.subject && <MetaItem>Subject: {classData.subject}</MetaItem>}
            {classData.academic_year && <MetaItem>Year: {classData.academic_year}</MetaItem>}
            <MetaItem>{classData.student_count} students</MetaItem>
          </ClassMeta>
        </TitleSection>
        <ActionButtons>
          <ModernButton variant="ghost" onClick={() => router.back()}>
            Back
          </ModernButton>
          <ModernButton variant="secondary" onClick={() => setShowEditModal(true)}>
            Edit Details
          </ModernButton>
          <ModernButton variant="primary" onClick={() => setShowUploadModal(true)}>
            Upload Students
          </ModernButton>
        </ActionButtons>
      </Header>

      {error && (
        <Alert variant="error" style={{ marginBottom: '1rem' }}>
          {error}
        </Alert>
      )}

      {classData.description && (
        <SectionCard>
          <p>{classData.description}</p>
        </SectionCard>
      )}

      <SectionCard>
        <SectionTitle>Students ({classData.students.length})</SectionTitle>
        {classData.students.length === 0 ? (
          <EmptyState>
            <p>No students in this class yet.</p>
            <ModernButton 
              variant="primary" 
              onClick={() => setShowUploadModal(true)}
              style={{ marginTop: '1rem' }}
            >
              Upload Student List
            </ModernButton>
          </EmptyState>
        ) : (
          <StudentList>
            {classData.students.map(student => (
              <StudentRow key={student.student_id}>
                <StudentInfo>
                  <StudentName>{student.full_name}</StudentName>
                  {student.username && !student.full_name.includes('Unknown') && (
                    <StudentEmail>Username: {student.username}</StudentEmail>
                  )}
                  {student.email && !student.email.includes('@student.classbots.local') && (
                    <StudentEmail>{student.email}</StudentEmail>
                  )}
                </StudentInfo>
              </StudentRow>
            ))}
          </StudentList>
        )}
      </SectionCard>

      <SectionCard>
        <SectionTitle>Danger Zone</SectionTitle>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <ModernButton variant="secondary" onClick={handleArchive}>
            {classData.is_archived ? 'Unarchive' : 'Archive'} Class
          </ModernButton>
          <ModernButton variant="danger" onClick={handleDelete}>
            Delete Class
          </ModernButton>
        </div>
      </SectionCard>

      {/* Edit Modal */}
      <Modal $isOpen={showEditModal} onClick={() => setShowEditModal(false)}>
        <ModalContent onClick={e => e.stopPropagation()}>
          <ModalTitle>Edit Class Details</ModalTitle>
          <FormGroup>
            <Label>Class Name</Label>
            <Input
              value={editData.name || ''}
              onChange={e => setEditData({ ...editData, name: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label>Description</Label>
            <TextArea
              value={editData.description || ''}
              onChange={e => setEditData({ ...editData, description: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label>Grade Level</Label>
            <Input
              value={editData.grade_level || ''}
              onChange={e => setEditData({ ...editData, grade_level: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label>Subject</Label>
            <Input
              value={editData.subject || ''}
              onChange={e => setEditData({ ...editData, subject: e.target.value })}
            />
          </FormGroup>
          <FormGroup>
            <Label>Academic Year</Label>
            <Input
              value={editData.academic_year || ''}
              onChange={e => setEditData({ ...editData, academic_year: e.target.value })}
            />
          </FormGroup>
          <ModalActions>
            <ModernButton variant="ghost" onClick={() => setShowEditModal(false)}>
              Cancel
            </ModernButton>
            <ModernButton variant="primary" onClick={handleEditSubmit}>
              Save Changes
            </ModernButton>
          </ModalActions>
        </ModalContent>
      </Modal>

      {/* Upload Modal */}
      <Modal $isOpen={showUploadModal} onClick={() => setShowUploadModal(false)}>
        <ModalContent onClick={e => e.stopPropagation()}>
          <ModalTitle>Upload Student List</ModalTitle>
          <p style={{ marginBottom: '1rem', color: 'var(--text-light)' }}>
            Upload a CSV file with student information. Required columns: First Name and Surname.
            Optional: Year Group. A username and PIN will be generated for each student.
          </p>
          {!uploading ? (
            <FileUploadArea
              className={dragActive ? 'dragging' : ''}
              onDrop={handleDrop}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onClick={() => fileInputRef.current?.click()}
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
              />
              <p>Drag and drop a CSV file here, or click to browse</p>
            </FileUploadArea>
          ) : (
            <SpinnerContainer>
              <LoadingSpinner />
              <p>Uploading students...</p>
            </SpinnerContainer>
          )}
          {error && (
            <Alert variant="error" style={{ marginTop: '1rem' }}>
              {error}
            </Alert>
          )}
          <ModalActions>
            <ModernButton 
              variant="ghost" 
              onClick={() => {
                setShowUploadModal(false);
                setError(null);
              }}
              disabled={uploading}
            >
              Cancel
            </ModernButton>
          </ModalActions>
        </ModalContent>
      </Modal>

      {/* Success Modal */}
      {showSuccessModal && uploadResult && (
        <>
          <ModalOverlay onClick={() => setShowSuccessModal(false)} />
          <SuccessModal>
            <SuccessContent>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4>Upload Successful!</h4>
                <p>
                  Successfully created {uploadResult.created} new students
                  {uploadResult.linked > 0 && ` and linked ${uploadResult.linked} existing students`}
                  {uploadResult.errors > 0 && ` with ${uploadResult.errors} errors`}.
                </p>
                {uploadResult.errors > 0 && uploadResult.errorDetails && (
                  <>
                    <p style={{ marginTop: '1rem', fontWeight: 500 }}>Error details:</p>
                    <ul>
                      {uploadResult.errorDetails.slice(0, 5).map((err, idx) => (
                        <li key={idx}>Row {err.row}: {err.error}</li>
                      ))}
                      {uploadResult.errorDetails.length > 5 && (
                        <li>... and {uploadResult.errorDetails.length - 5} more errors</li>
                      )}
                    </ul>
                  </>
                )}
                <ModernButton
                  onClick={() => setShowSuccessModal(false)}
                  style={{ marginTop: '1rem', width: '100%' }}
                >
                  Close
                </ModernButton>
              </div>
            </SuccessContent>
          </SuccessModal>
        </>
      )}
    </PageContainer>
  );
}