// src/components/teacher/DocumentUploader.tsx
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import styled, { css } from 'styled-components';
import { ModernButton } from '@/components/shared/ModernButton';
import type { DocumentType } from '@/types/knowledge-base.types';

const UploaderContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const UploadArea = styled.div<{ $isDragging: boolean }>`
  border: 2px dashed ${({ theme, $isDragging }) => 
    $isDragging ? theme.colors.brand.primary : theme.colors.ui.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: ${({ theme }) => theme.spacing.xxl};
  text-align: center;
  transition: all 0.3s ease;
  background: ${({ theme, $isDragging }) => 
    $isDragging 
      ? `linear-gradient(135deg, ${hexToRgba(theme.colors.ui.pastelPurple, 0.2)} 0%, ${hexToRgba(theme.colors.ui.pastelPink, 0.2)} 100%)` 
      : `linear-gradient(135deg, ${hexToRgba(theme.colors.ui.pastelBlue, 0.1)} 0%, ${hexToRgba(theme.colors.ui.pastelGreen, 0.1)} 100%)`};
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100px;
    height: 100px;
    background: radial-gradient(circle, 
      ${({ theme }) => hexToRgba(theme.colors.ui.pastelYellow, 0.3)} 0%, 
      transparent 70%);
    transform: translate(-50%, -50%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.brand.primary};
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
    
    &::before {
      opacity: 1;
    }
  }
  cursor: pointer;
`;

const UploadIcon = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: 4rem;
  color: ${({ theme }) => theme.colors.brand.primary};
  animation: bounce 2s ease-in-out infinite;
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
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

const SelectedFileContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => hexToRgba(theme.colors.status.success, 0.3)};
  backdrop-filter: blur(10px);
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  border: 1px solid ${({ theme }) => hexToRgba(theme.colors.status.success, 0.3)};
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
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
  background: ${({ theme }) => theme.colors.ui.pastelGray};
  border-radius: 20px;
  margin-top: ${({ theme }) => theme.spacing.md};
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  width: ${props => props.progress}%;
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

import type { Document as KnowledgeDocument } from '@/types/knowledge-base.types';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
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

interface DocumentUploaderProps {
  chatbotId: string;
  onUploadSuccess: (document?: KnowledgeDocument) => void; // Callback after successful upload
}

export default function DocumentUploader({ chatbotId, onUploadSuccess }: DocumentUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    setSuccessMessage(null);

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.file.size > 10 * 1024 * 1024) {
        setError('File too large. Maximum size is 10MB.');
      } else {
        setError('Invalid file type. Please upload PDF, Word (.doc, .docx), or TXT.');
      }
      setSelectedFile(null);
      return;
    }

    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
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

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);
    setUploadProgress(0);
    setUploadStatus('Preparing upload...');

    const formData = new FormData();
    formData.append('file', selectedFile);
    // chatbotId is now in the URL path, not needed in FormData

    try {
      // Simulate progress for file preparation
      setUploadProgress(10);
      setUploadStatus('Uploading file...');
      
      // << MODIFICATION: Change API endpoint >>
      const response = await fetch(`/api/teacher/chatbots/${chatbotId}/documents`, {
        method: 'POST',
        body: formData,
      });

      // Simulate progress during upload
      setUploadProgress(50);
      setUploadStatus('Processing document...');

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload document');
      }
      
      // Complete progress
      setUploadProgress(100);
      setUploadStatus('Upload complete!');
      
      setSuccessMessage(data.message || 'Document uploaded and processing started automatically!');
      setSelectedFile(null);
      // Pass the document data to the parent component for immediate display
      onUploadSuccess(data.document); // Call parent callback with the new document
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during upload.');
    } finally {
      setIsUploading(false);
      // Reset progress after a short delay
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStatus('');
      }, 2000);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <UploaderContainer>
      {error && <ModernAlert $variant="error">{error}</ModernAlert>}
      {successMessage && <ModernAlert $variant="success">{successMessage}</ModernAlert>}
      
      <UploadArea {...getRootProps()} $isDragging={isDragActive}>
        <input {...getInputProps()} />
        <UploadIcon>📄</UploadIcon>
        <UploadText>{isDragActive ? 'Drop your file here' : 'Click or drag file to upload'}</UploadText>
        <FileTypeInfo style={{ marginTop: '8px', marginBottom: '8px' }}>
          Documents will be automatically processed after upload
        </FileTypeInfo>
        <FileTypeInfo>Supported: PDF, DOC, DOCX, TXT (Max 10MB)</FileTypeInfo>
        {!selectedFile && (
            <ModernButton size="small" variant="ghost" type="button" onClick={(e) => { e.stopPropagation(); }}>
                Browse Files
            </ModernButton>
        )}
      </UploadArea>

      {selectedFile && (
        <>
          <SelectedFileContainer>
            <FileName title={selectedFile.name}>{selectedFile.name}</FileName>
            <FileSize>{formatFileSize(selectedFile.size)}</FileSize>
            <ModernButton
              size="small"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setError(null); }}
              type="button"
            >
              Remove
            </ModernButton>
          </SelectedFileContainer>
          
          <ModernButton             onClick={handleUpload}
            disabled={isUploading}
            fullWidth
            style={{ marginTop: '16px' }}
            type="button"
          >
            {isUploading ? 'Uploading...' : `Upload ${selectedFile.name}`}
          </ModernButton>
          
          {isUploading && (
            <>
              <ProgressBar>
                <ProgressFill progress={uploadProgress} />
              </ProgressBar>
              <StatusText>{uploadStatus}</StatusText>
            </>
          )}
        </>
      )}
    </UploaderContainer>
  );
}