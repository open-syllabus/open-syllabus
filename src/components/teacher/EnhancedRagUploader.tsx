// src/components/teacher/EnhancedRagUploader.tsx
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import styled, { css } from 'styled-components';
import { ModernButton } from '@/components/shared/ModernButton';
import type { Document as KnowledgeDocument } from '@/types/knowledge-base.types';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
// Styled components for the uploader
const UploaderContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.ui.background};
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 32px;
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  box-shadow: 0 8px 32px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.05)};
`;

const UploadArea = styled.div`
  border: 2px dashed ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.3)};
  border-radius: 20px;
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.ui.background};
  backdrop-filter: blur(10px);
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.brand.primary};
    background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.05)};
    transform: translateY(-2px);
    box-shadow: 0 8px 24px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  }
`;

const UploadText = styled.p`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: 600;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1.1rem;
`;

const FileTypeInfo = styled.p`
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: 0.875rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-family: ${({ theme }) => theme.fonts.body};
`;

const SectionTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  font-family: ${({ theme }) => theme.fonts.heading};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.brand.primary}, 
    ${({ theme }) => theme.colors.brand.magenta}
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const SelectedFileContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.2)};
`;

const FileName = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.fonts.body};
`;

const FileSize = styled.span`
  color: ${({ theme }) => theme.colors.brand.primary};
  font-size: 0.875rem;
  font-weight: 600;
  font-family: ${({ theme }) => theme.fonts.body};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 12px;
  background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  border-radius: 20px;
  margin-top: ${({ theme }) => theme.spacing.md};
  overflow: hidden;
  border: 1px solid ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
`;

const Progress = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${props => props.$progress}%;
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.brand.primary}, 
    ${({ theme }) => theme.colors.brand.magenta}
  );
  transition: width 0.3s ease;
  box-shadow: 0 0 10px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.3)};
`;

const StatusText = styled.div`
  font-size: 0.875rem;
  margin-top: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.brand.primary};
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: 600;
`;

const ModernAlert = styled.div<{ $variant?: 'success' | 'error' }>`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: 12px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  backdrop-filter: blur(10px);
  font-family: ${({ theme }) => theme.fonts.body};
  animation: fadeIn 0.3s ease-in-out;
  
  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'success':
        return `
          background: ${hexToRgba(theme.colors.status.success, 0.1)};
          color: ${theme.colors.status.success};
          border: 1px solid ${hexToRgba(theme.colors.status.success, 0.2)};
        `;
      case 'error':
        return `
          background: ${hexToRgba(theme.colors.status.danger, 0.1)};
          color: ${theme.colors.status.danger};
          border: 1px solid ${hexToRgba(theme.colors.status.danger, 0.2)};
        `;
      default:
        return `
          background: ${hexToRgba(theme.colors.brand.primary, 0.1)};
          color: ${theme.colors.brand.primary};
          border: 1px solid ${hexToRgba(theme.colors.brand.primary, 0.2)};
        `;
    }
  }}
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

interface EnhancedRagUploaderProps {
  chatbotId: string;
  onUploadSuccess?: (document?: KnowledgeDocument) => void;
}

export default function EnhancedRagUploader({ chatbotId, onUploadSuccess }: EnhancedRagUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    setSuccessMessage(null);

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.file.size > 10 * 1024 * 1024) {
        setError('File too large. Maximum size is 10MB.');
      } else {
        setError('Invalid file type. Please upload PDF, Word (.doc, .docx), or TXT files.');
      }
      setFile(null);
      return;
    }

    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!file || !chatbotId) {
      setError(`Missing required data: ${!file ? 'No file selected' : 'No Skolr ID provided'}`);
      return;
    }
    
    console.log(`Uploading file for chatbot ID: ${chatbotId}`);
    
    setUploading(true);
    setError(null);
    setSuccessMessage(null);
    setProgress(0);
    setStatus('Preparing upload...');
    
    try {
      // Create form data for the file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chatbotId', chatbotId);
      
      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      // Create a promise to handle the async operation
      const uploadPromise = new Promise<any>((resolve, reject) => {
        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setProgress(percentComplete * 0.8); // 80% for upload
            setStatus(`Uploading... ${percentComplete}%`);
          }
        });
        
        // Handle completion
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error('Invalid response format'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || `Upload failed (Status: ${xhr.status})`));
            } catch (e) {
              reject(new Error(`Upload failed (Status: ${xhr.status})`));
            }
          }
        });
        
        // Handle errors
        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });
        
        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });
        
        // Start the upload
        xhr.open('POST', '/api/teacher/documents');
        xhr.send(formData);
      });
      
      // Wait for upload to complete
      const uploadData = await uploadPromise;
      console.log('Upload response data:', uploadData);
      
      // Update progress for processing phase
      setProgress(85);
      setStatus('Processing document...');
      
      // Get document ID from the response
      const uploadedDocumentId = 
        uploadData.documentId || 
        (uploadData.document && uploadData.document.document_id);
      
      if (!uploadedDocumentId) {
        console.error('Unexpected response format:', uploadData);
        throw new Error('No document ID returned from upload');
      }
      
      setProgress(95);
      setStatus('Finalizing...');
      
      // No need to manually process - auto-processing is enabled
      console.log(`Document ${uploadedDocumentId} uploaded. Auto-processing will handle it.`);
      
      setProgress(100);
      setStatus('Upload complete!');
      setSuccessMessage('Document uploaded! Processing will start automatically.');
      
      // Clear the file after a short delay
      setTimeout(() => {
        setFile(null);
        setProgress(0);
        setStatus('');
      }, 1500);
      
      // Notify parent with the document data
      if (onUploadSuccess) {
        onUploadSuccess(uploadData.document);
      }
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload document');
      setStatus('Error occurred');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <UploaderContainer>
      <SectionTitle>Upload Documents for Knowledge Base</SectionTitle>
      
      {error && <ModernAlert $variant="error">{error}</ModernAlert>}
      {successMessage && <ModernAlert $variant="success">{successMessage}</ModernAlert>}
      
      <UploadArea {...getRootProps()}>
        <input {...getInputProps()} />
        <UploadText>{isDragActive ? 'Drop your file here' : 'Click or drag file to upload'}</UploadText>
        <FileTypeInfo>Supported: PDF, DOC, DOCX, TXT (Max 10MB)</FileTypeInfo>
        <ModernButton 
          size="small" 
          variant="ghost" 
          type="button" 
          onClick={(e) => { 
            e.stopPropagation(); 
          }}
        >
          Browse Files
        </ModernButton>
      </UploadArea>
      
      {file && (
        <>
          <SelectedFileContainer>
            <FileName title={file.name}>{file.name}</FileName>
            <FileSize>{formatFileSize(file.size)}</FileSize>
            <ModernButton               size="small"
              variant="ghost"
              onClick={() => setFile(null)}
              disabled={uploading}
            >
              Remove
            </ModernButton>
          </SelectedFileContainer>
          
          <ModernButton             onClick={handleUpload}
            disabled={uploading}
            fullWidth
            style={{ marginTop: '16px' }}
          >
            {uploading ? 'Uploading...' : `Upload ${file.name}`}
          </ModernButton>
          
          {uploading && (
            <>
              <ProgressBar>
                <Progress $progress={progress} />
              </ProgressBar>
              <StatusText>{status}</StatusText>
            </>
          )}
        </>
      )}
    </UploaderContainer>
  );
}