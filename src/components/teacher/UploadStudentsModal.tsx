import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUpload, FiFile, FiCheck, FiAlertCircle, FiHome, FiDownload } from 'react-icons/fi';
import { ModernButton } from '@/components/shared/ModernButton';
import { useDropzone } from 'react-dropzone';
import { useOnboarding, OnboardingStep } from '@/contexts/OnboardingContext';
import { Highlight } from '@/components/onboarding/Highlight';
import { Tooltip } from '@/components/onboarding/Tooltip';

interface UploadStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (showRoomAssignment?: boolean) => void;
}

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled(motion.div)`
  width: 100%;
  max-width: 600px;
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: #6B7280;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #F3F4F6;
    color: #111827;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const Instructions = styled.div`
  background: #F3F4F6;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.6;
`;

const DropzoneArea = styled.div<{ $isDragActive: boolean }>`
  border: 2px dashed ${({ $isDragActive }) => $isDragActive ? '#7C3AED' : '#E5E7EB'};
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  background: ${({ $isDragActive }) => $isDragActive ? 'rgba(124, 58, 237, 0.05)' : '#FAFBFC'};
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    border-color: #7C3AED;
    background: rgba(124, 58, 237, 0.05);
  }
`;

const UploadIcon = styled(FiUpload)`
  width: 48px;
  height: 48px;
  color: #7C3AED;
  margin-bottom: 16px;
`;

const UploadText = styled.p`
  font-size: 1rem;
  color: #111827;
  margin: 0 0 8px 0;
  font-weight: 500;
`;

const UploadSubtext = styled.p`
  font-size: 0.875rem;
  color: #6B7280;
  margin: 0;
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #F3F4F6;
  border-radius: 12px;
  margin-top: 16px;
`;

const FileIcon = styled(FiFile)`
  width: 24px;
  height: 24px;
  color: #7C3AED;
`;

const FileName = styled.span`
  flex: 1;
  font-size: 0.875rem;
  color: #111827;
  font-weight: 500;
`;

const Results = styled.div`
  margin-top: 24px;
`;

const ResultsTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StudentList = styled.div`
  background: #F9FAFB;
  border-radius: 12px;
  padding: 16px;
  max-height: 300px;
  overflow-y: auto;
`;

const StudentItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 8px;
  margin-bottom: 8px;
  font-size: 0.875rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const StudentName = styled.span`
  color: #111827;
  font-weight: 500;
`;

const StudentCredentials = styled.div`
  display: flex;
  gap: 16px;
  color: #6B7280;
  font-size: 0.75rem;
`;

const ErrorMessage = styled.div`
  color: #EF4444;
  font-size: 0.875rem;
  margin-top: 16px;
  padding: 12px;
  background: #FEE2E2;
  border-radius: 8px;
  display: flex;
  align-items: start;
  gap: 8px;

  svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const NextStepPrompt = styled.div`
  margin-top: 24px;
  padding: 20px;
  background: #F3E8FF;
  border-radius: 12px;
  text-align: center;
`;

const NextStepTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
`;

const NextStepText = styled.p`
  font-size: 0.875rem;
  color: #6B7280;
  margin: 0;
  line-height: 1.5;
`;

interface UploadResult {
  success: boolean;
  students?: Array<{
    first_name: string;
    surname: string;
    username: string;
    pin: string;
  }>;
  error?: string;
}

export default function UploadStudentsModal({ isOpen, onClose, onSuccess }: UploadStudentsModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [templateDownloaded, setTemplateDownloaded] = useState(false);
  const { currentStep, isOnboarding, completeStep } = useOnboarding();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setError(null);
      setResult(null);
      setTemplateDownloaded(false);
    }
  }, [isOpen]);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/teacher/students/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload students');
      }

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        console.log('[UploadStudentsModal] Upload successful. Onboarding:', isOnboarding, 'Step:', currentStep);
        
        // Don't complete the step here - let the parent handle it
        // This prevents double completion which might cause navigation issues
        
        // Show success for a moment before closing
        setTimeout(() => {
          console.log('[UploadStudentsModal] Calling onSuccess');
          if (onSuccess) {
            onSuccess();
          }
          // Don't close immediately - let the parent handle closing if needed
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload students');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    setResult(null);
    onClose();
  };

  const downloadTemplate = () => {
    const template = 'FirstName,Surname,YearGroup\nJohn,Smith,7\nJane,Doe,8\nBob,Johnson,7';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Mark template as downloaded
    setTemplateDownloaded(true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          data-modal="true"
        >
          <ModalContent
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader>
              <ModalTitle>Import Students from CSV</ModalTitle>
              <CloseButton onClick={handleClose}>
                <FiX />
              </CloseButton>
            </ModalHeader>

            <Instructions>
              <strong>CSV Format:</strong> Your file must have columns for FirstName, Surname, and YearGroup.
              <br />
              <strong>Year/Grade is required</strong> to ensure age-appropriate safety monitoring and responses.
              <br />
              The system will automatically generate unique usernames and PINs for each student.
              <br />
              <ModernButton
                id="download-template-button"
                variant="ghost"
                size="small"
                onClick={downloadTemplate}
                style={{ marginTop: '12px' }}
              >
                <FiDownload />
                Download Template CSV
              </ModernButton>
            </Instructions>

            {!result && (
              <>
                <DropzoneArea {...getRootProps()} $isDragActive={isDragActive} id="upload-dropzone">
                  <input {...getInputProps()} />
                  <UploadIcon />
                  <UploadText>
                    {isDragActive ? 'Drop your file here' : 'Drag & drop your CSV file here'}
                  </UploadText>
                  <UploadSubtext>or click to select a file</UploadSubtext>
                </DropzoneArea>

                {file && (
                  <FileInfo>
                    <FileIcon />
                    <FileName>{file.name}</FileName>
                    <ModernButton
                      variant="ghost"
                      size="small"
                      onClick={() => {
                        setFile(null);
                        setError(null);
                      }}
                    >
                      Remove
                    </ModernButton>
                  </FileInfo>
                )}
              </>
            )}

            {result && result.success && (
              <Results>
                <ResultsTitle>
                  <FiCheck color="#10B981" />
                  Successfully imported {result.students?.length || 0} students
                </ResultsTitle>
                <StudentList>
                  {result.students?.map((student, index) => (
                    <StudentItem key={index}>
                      <StudentName>
                        {student.first_name} {student.surname}
                      </StudentName>
                      <StudentCredentials>
                        <span>Username: {student.username}</span>
                        <span>PIN: {student.pin}</span>
                      </StudentCredentials>
                    </StudentItem>
                  ))}
                </StudentList>
                <NextStepPrompt>
                  <NextStepTitle>What's next?</NextStepTitle>
                  <NextStepText>
                    Now that your students are imported, organize them into rooms to start creating AI teaching assistants.
                  </NextStepText>
                </NextStepPrompt>
              </Results>
            )}

            {error && (
              <ErrorMessage>
                <FiAlertCircle />
                {error}
              </ErrorMessage>
            )}

            <ButtonGroup>
              {result && result.success ? (
                <>
                  <ModernButton
                    variant="ghost"
                    onClick={handleClose}
                  >
                    Done
                  </ModernButton>
                  <ModernButton
                    variant="primary"
                    onClick={() => {
                      console.log('[UploadStudentsModal] Organize into Rooms clicked. Onboarding:', isOnboarding, 'Step:', currentStep);
                      handleClose();
                      // During onboarding, don't immediately show room assignment
                      // Let the user complete the SELECT_ALL_STUDENTS step first
                      if (onSuccess) {
                        if (isOnboarding && (currentStep === OnboardingStep.UPLOAD_STUDENTS || currentStep === OnboardingStep.SELECT_ALL_STUDENTS)) {
                          // Just close and refresh, don't show room assignment yet
                          console.log('[UploadStudentsModal] Onboarding active - not showing room assignment');
                          onSuccess();
                        } else {
                          // Normal flow - show room assignment modal
                          console.log('[UploadStudentsModal] Normal flow - showing room assignment');
                          (onSuccess as any)(true);
                        }
                      }
                    }}
                  >
                    <FiHome />
                    Organize into Rooms
                  </ModernButton>
                </>
              ) : (
                <>
                  <ModernButton
                    variant="ghost"
                    onClick={handleClose}
                    disabled={loading}
                  >
                    Cancel
                  </ModernButton>
                  <ModernButton
                    variant="primary"
                    onClick={handleUpload}
                    disabled={!file || loading}
                  >
                    {loading ? 'Uploading...' : 'Upload Students'}
                  </ModernButton>
                </>
              )}
            </ButtonGroup>
          </ModalContent>
        </ModalOverlay>
      )}
      
      {/* Onboarding Highlights and Tooltips */}
      {isOpen && (
        <>
          {/* Highlight download button if template not downloaded */}
          <Highlight
            selector="#download-template-button"
            show={isOnboarding && currentStep === OnboardingStep.UPLOAD_STUDENTS && !templateDownloaded && !file}
            cutout={true}
          />
          <Tooltip
            selector="#download-template-button"
            title="Download Template"
            text="First, download the template CSV to see the correct format for your student data."
            buttonText="Got it"
            onButtonClick={() => {}}
            show={isOnboarding && currentStep === OnboardingStep.UPLOAD_STUDENTS && !templateDownloaded && !file}
            placement="bottom"
          />
          
          {/* Highlight upload area after template is downloaded */}
          <Highlight
            selector="#upload-dropzone"
            show={isOnboarding && currentStep === OnboardingStep.UPLOAD_STUDENTS && templateDownloaded && !file}
            cutout={true}
          />
          <Tooltip
            selector="#upload-dropzone"
            title="Upload Your Student Data"
            text="Now drag and drop your filled CSV file here, or click to browse. Make sure it follows the template format."
            buttonText="Got it"
            onButtonClick={() => {}}
            show={isOnboarding && currentStep === OnboardingStep.UPLOAD_STUDENTS && templateDownloaded && !file}
            placement="top"
          />
        </>
      )}
    </AnimatePresence>
  );
}