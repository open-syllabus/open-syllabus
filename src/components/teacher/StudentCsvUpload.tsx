// src/components/teacher/StudentCsvUpload.tsx
'use client';

import { useState, useRef } from 'react';
import styled, { css } from 'styled-components';
import { FiX, FiUpload } from 'react-icons/fi';
import { ModernButton } from '@/components/shared/ModernButton';
import { Label, FormGroup, FormText } from '@/components/ui/Form';
import { Text, Heading } from '@/components/ui/Typography';
import { Alert } from '@/styles/StyledComponents';
import { motion } from 'framer-motion';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
// --- Styled Components ---
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: ${({ theme }) => theme.spacing.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0;
    align-items: flex-start;
  }
`;

const FormCard = styled.div`
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: 0;
  border: 1px solid ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.2)};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  width: 100%;
  max-width: 650px;
  margin: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow-y: hidden;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin: 0;
    width: 100%;
    min-height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    box-shadow: none;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.ui.border};
  flex-shrink: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

// Remove Title styled component as we'll use Heading from UI library

const CloseButton = styled(motion.button)`
  background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  border: none;
  color: ${({ theme }) => theme.colors.brand.primary};
  cursor: pointer;
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.2)};
  }
`;

const FormContent = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  overflow-y: auto;
  flex-grow: 1;
  max-height: calc(90vh - 140px);
  overscroll-behavior: contain;

  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.colors.ui.borderDark};
    border-radius: 3px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => theme.colors.ui.borderDark} transparent;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.md};
    max-height: calc(100vh - 140px);
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.ui.border};
  flex-shrink: 0;
  background-color: ${({ theme }) => theme.colors.ui.background};
  position: sticky;
  bottom: 0;
  z-index: 5;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column-reverse;
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

const FileUploadWrapper = styled(motion.div)`
  border: 2px dashed ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: ${({ theme }) => theme.spacing.xl};
  margin: ${({ theme }) => theme.spacing.lg} 0;
  text-align: center;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  background: ${({ theme }) => theme.colors.ui.pastelPurple};

  &:hover {
    border-color: ${({ theme }) => theme.colors.brand.primary};
    background: ${({ theme }) => hexToRgba(theme.colors.ui.pastelPurple, 0.3)};
  }
  
  svg {
    width: 48px;
    height: 48px;
    color: ${({ theme }) => theme.colors.brand.primary};
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }
`;

const HiddenInput = styled.input`
  display: none;
`;


const ResultsContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md};
  max-height: 300px;
  overflow-y: auto;
  text-align: left;
  background: ${({ theme }) => theme.colors.ui.pastelGray};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.colors.ui.borderDark};
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: ${({ theme }) => theme.colors.ui.borderDark} transparent; /* Firefox */
`;


const StudentItem = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.ui.background};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.brand.primary};
    box-shadow: 0 2px 8px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  }
`;

const InfoMessage = styled.div`
  background: ${({ theme }) => theme.colors.ui.pastelYellow};
  color: ${({ theme }) => theme.colors.text.primary};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: 0.9rem;
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
`;

const StudentName = styled.div`
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const CredentialsGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 16px;
  margin-top: 8px;
  font-size: 0.9rem;
`;

const CredentialLabel = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: 500;
`;

const CredentialValue = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: monospace;
  font-weight: 600;
`;

interface StudentCsvUploadProps {
  roomId: string;
  roomName: string;
  onClose: () => void;
}

interface StudentLinkResult {
  fullName: string;
  email: string | null;
  username: string;
  pin_code: string;
  year_group?: string;
  login_url: string;
}

export default function StudentCsvUpload({ roomId, roomName, onClose }: StudentCsvUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<StudentLinkResult[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    setResults([]);
    
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('roomId', roomId);

    setIsUploading(true);

    try {
      const importURL = `/api/teacher/rooms/${roomId}/students/import`;
      console.log('Sending CSV import request to:', importURL);
      
      // Send the request with form data
      const response = await fetch(importURL, {
        method: 'POST',
        body: formData,
      });

      console.log('CSV import response status:', response.status, response.statusText);
      
      let data;
      try {
        // Try to parse the JSON, but handle potential parsing errors
        const textResponse = await response.text();
        console.log('Raw response text:', textResponse.substring(0, 200) + (textResponse.length > 200 ? '...' : ''));
        data = textResponse ? JSON.parse(textResponse) : {};
      } catch (parseErr) {
        console.error('Error parsing response:', parseErr);
        throw new Error('Invalid response from server. Check the console for details.');
      }
      
      if (!response.ok) {
        console.error('Import error response:', data);
        console.error('Response status:', response.status, response.statusText);
        
        // Extract more specific error message if available
        const errorMessage = data?.error || `Failed to import students (Status: ${response.status})`;
        throw new Error(errorMessage);
      }

      // Check if we're in debug mode
      if (data?.debug) {
        console.log('Debug mode detected. Mock data:', data);
        setSuccess(`Debug mode: ${data.message || 'Route handler is working'}`);
        
        // Use the mock data provided by the debug route
        if (data.students && data.students.length > 0) {
          setResults(data.students);
        } else {
          setResults([{
            fullName: "Debug Student",
            email: null,
            username: "debug.student",
            pin_code: "1234",
            login_url: "/student-login"
          }]);
        }
      }
      // If partial success (some students failed)
      else if (data?.failedImports && data.failedImports.length > 0) {
        const successCount = data.students?.length || 0;
        const failedCount = data.failedImports.length;
        
        setSuccess(`Partially successful: Added ${successCount} out of ${successCount + failedCount} students to room "${roomName}".`);
        
        // Show the first error in the UI
        const firstError = data.failedImports[0];
        const studentDisplay = firstError.student?.fullName || 'Unknown Student';
        setError(`Failed to add ${failedCount} students. First error: ${firstError.error} (Student: ${studentDisplay})`);
        
        // Log all errors with details
        console.error('Failed student imports with details:');
        data.failedImports.forEach((failed: any, index: number) => {
          const studentName = failed.student?.fullName || 'Unknown Student';
          console.error(`${index + 1}. Student: ${studentName}`, {
            error: failed.error,
            details: failed.details,
            index: failed.index,
            rawStudent: failed.student
          });
        });
        setResults(data?.students || []);
      } else {
        setSuccess(`Successfully added ${data.students?.length || 0} students to room "${roomName}".`);
        setResults(data?.students || []);
      }
    } catch (err) {
      console.error('Error importing students:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during import.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      // Use a safer approach than alert
      setSuccess('Link copied to clipboard!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      setError('Failed to copy link.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleCopyAllLinks = async () => {
    try {
      const allCredentials = results.map(result => {
        let text = `${result.fullName}\nUsername: ${result.username}\nPIN: ${result.pin_code}`;
        if (result.year_group) {
          text += `\nYear Group: ${result.year_group}`;
        }
        return text;
      }).join('\n\n');
      await navigator.clipboard.writeText(allCredentials);
      // Use a safer approach than alert
      setSuccess('All credentials copied to clipboard!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to copy credentials:', err);
      setError('Failed to copy credentials.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const downloadTemplateCSV = () => {
    // Using separate lines for each student to make it clearer in the CSV file
    // Add more rows to demonstrate multiple students can be imported
    const csvContent = 'First Name,Surname,Year Group\nJohn,Doe,Year 7\nJane,Smith,Year 8\nBob,Johnson,Year 7';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };



  return (
    <Overlay onClick={onClose}>
      <FormCard 
        as={motion.div}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Header>
          <Heading level="h2" gradient>Import Students</Heading>
          <CloseButton 
            onClick={onClose}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiX />
          </CloseButton>
        </Header>
        
        <FormContent>
          <div style={{ marginBottom: '16px' }}>
            <Text>
              Upload a CSV file with student information to bulk add them to {roomName}. 
              Each student will receive a unique username and PIN for secure access.
            </Text>
          </div>
          
          <FormGroup>
            <Label>Required CSV format</Label>
            <FormText>
              Your CSV must have columns: <strong>First Name</strong>, <strong>Surname</strong>, and optionally <strong>Year Group</strong>
            </FormText>
            <ModernButton 
              variant="ghost" 
              size="small"
              onClick={downloadTemplateCSV}
              style={{ marginTop: '8px' }}
            >
              Download Template CSV
            </ModernButton>
          </FormGroup>

          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <FileUploadWrapper 
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <FiUpload />
            <Text size="large" weight="medium">
              {isUploading ? 'Uploading...' : 'Click to select CSV file'}
            </Text>
            <Text color="light" size="small">
              or drag and drop
            </Text>
            <HiddenInput 
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
          </FileUploadWrapper>

          {results.length > 0 && (
            <>
              <Label style={{ marginTop: '24px', marginBottom: '12px' }}>Student Login Credentials</Label>
              <InfoMessage>
                <strong>Important:</strong> Students can log in at <strong>/student-login</strong> using their username and PIN. 
                Please share these credentials securely with students.
              </InfoMessage>
              <ResultsContainer>
                {results.map((student, index) => (
                  <StudentItem key={index}>
                    <StudentName>{student.fullName}</StudentName>
                    <CredentialsGrid>
                      <CredentialLabel>Username:</CredentialLabel>
                      <CredentialValue>{student.username}</CredentialValue>
                      
                      <CredentialLabel>PIN:</CredentialLabel>
                      <CredentialValue>{student.pin_code}</CredentialValue>
                      
                      {student.year_group && (
                        <>
                          <CredentialLabel>Year Group:</CredentialLabel>
                          <CredentialValue>{student.year_group}</CredentialValue>
                        </>
                      )}
                    </CredentialsGrid>
                    <ModernButton 
                      size="small"
                      variant="ghost"
                      onClick={() => handleCopyLink(`${student.fullName}\nUsername: ${student.username}\nPIN: ${student.pin_code}${student.year_group ? `\nYear Group: ${student.year_group}` : ''}`)}
                      style={{ marginTop: '12px' }}
                    >
                      Copy Details
                    </ModernButton>
                  </StudentItem>
                ))}
              </ResultsContainer>
              <ModernButton 
                onClick={handleCopyAllLinks}
                style={{ width: '100%', marginTop: '16px' }}
              >
                Copy All Credentials
              </ModernButton>
            </>
          )}
        </FormContent>

        <Footer>
          <ModernButton 
            variant="ghost" 
            onClick={onClose} 
            disabled={isUploading}
            size="medium"
          >
            Close
          </ModernButton>
        </Footer>
      </FormCard>
    </Overlay>
  );
}
