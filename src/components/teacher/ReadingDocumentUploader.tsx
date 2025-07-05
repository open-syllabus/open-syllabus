// src/components/teacher/ReadingDocumentUploader.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import styled, { css } from 'styled-components';
import { ModernButton } from '@/components/shared/ModernButton';

// Helper function to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`
    : `rgba(0, 0, 0, ${alpha})`;
};
const UploaderContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.ui.background};
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 32px;
  border: 1px solid ${({ theme }) => theme.colors.ui.border};
  box-shadow: 0 8px 32px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.05)};
`;

const UploadArea = styled.div<{ $isDragging: boolean }>`
  border: 2px dashed ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.3)};
  border-radius: 20px;
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  background: ${({ $isDragging, theme }) => 
    $isDragging ? hexToRgba(theme.colors.brand.primary, 0.1) : theme.colors.ui.background};
  backdrop-filter: blur(10px);
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.brand.primary};
    background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.05)};
    transform: translateY(-2px);
    box-shadow: 0 8px 24px ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  }
`;

const UploadIcon = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: 3rem;
  background: linear-gradient(135deg, 
    ${({ theme }) => theme.colors.brand.primary}, 
    ${({ theme }) => theme.colors.brand.magenta}
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
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

const CurrentDocumentContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.1)};
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid ${({ theme }) => hexToRgba(theme.colors.brand.primary, 0.2)};
`;

const DocumentInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const DocumentName = styled.h4`
  margin: 0;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const DocumentMeta = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: 0.875rem;
`;

const PreviewButton = styled(ModernButton)`
  margin-right: ${({ theme }) => theme.spacing.sm};
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

const ModernAlert = styled.div<{ $variant?: 'success' | 'error' | 'info' }>`
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
      case 'info':
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

interface ReadingDocument {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  created_at: string;
  updated_at: string;
}

interface ReadingDocumentUploaderProps {
  chatbotId: string;
  onUploadSuccess?: () => void;
}

export default function ReadingDocumentUploader({ chatbotId, onUploadSuccess }: ReadingDocumentUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentDocument, setCurrentDocument] = useState<ReadingDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    setSuccessMessage(null);

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.file.size > 20 * 1024 * 1024) {
        setError('File too large. Maximum size is 20MB.');
      } else {
        setError('Only PDF files are allowed for reading documents');
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
      'application/pdf': ['.pdf']
    },
    maxSize: 20 * 1024 * 1024, // 20MB
    multiple: false
  });

  // Fetch current reading document on mount
  useEffect(() => {
    fetchCurrentDocument();
  }, [chatbotId]);

  const fetchCurrentDocument = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/teacher/chatbots/${chatbotId}/reading-document`);
      const data = await response.json();
      
      if (response.ok && data.document) {
        setCurrentDocument(data.document);
      }
    } catch (err) {
      console.error('Error fetching reading document:', err);
    } finally {
      setIsLoading(false);
    }
  };


  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);
    setUploadProgress(0);
    setUploadStatus('Preparing upload...');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      // Create a promise to handle the async operation
      const uploadPromise = new Promise<any>((resolve, reject) => {
        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete * 0.9); // 90% for upload
            setUploadStatus(`Uploading... ${percentComplete}%`);
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
        xhr.open('POST', `/api/teacher/chatbots/${chatbotId}/reading-document`);
        xhr.send(formData);
      });
      
      // Wait for upload to complete
      const data = await uploadPromise;
      console.log('Upload response data:', data);
      
      setUploadProgress(95);
      setUploadStatus('Finalizing...');
      
      setUploadProgress(100);
      setUploadStatus('Upload complete!');
      setSuccessMessage('Reading document uploaded successfully!');
      
      // Clear the file after a short delay
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
        setUploadStatus('');
      }, 1500);
      
      // Refresh the current document
      await fetchCurrentDocument();
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during upload.');
      setUploadProgress(0);
      setUploadStatus('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentDocument || !confirm('Are you sure you want to delete the current reading document?')) {
      return;
    }

    setError(null);
    try {
      const response = await fetch(`/api/teacher/chatbots/${chatbotId}/reading-document`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete reading document');
      }

      setSuccessMessage('Reading document deleted successfully');
      setCurrentDocument(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <UploaderContainer>
        <ModernAlert $variant="info">Loading reading document...</ModernAlert>
      </UploaderContainer>
    );
  }

  return (
    <UploaderContainer>
      {error && <ModernAlert $variant="error">{error}</ModernAlert>}
      {successMessage && <ModernAlert $variant="success">{successMessage}</ModernAlert>}
      
      {currentDocument ? (
        <CurrentDocumentContainer>
          <DocumentInfo>
            <div>
              <DocumentName>📖 {currentDocument.file_name}</DocumentName>
              <DocumentMeta>
                {formatFileSize(currentDocument.file_size)} • Uploaded {formatDate(currentDocument.updated_at || currentDocument.created_at)}
              </DocumentMeta>
            </div>
          </DocumentInfo>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <PreviewButton
              variant="ghost"
              size="small"
              onClick={() => window.open(currentDocument.file_url, '_blank')}
            >
              Preview PDF
            </PreviewButton>
            <ModernButton               variant="ghost"
              size="small"
              onClick={handleDelete}
            >
              Delete
            </ModernButton>
          </div>
          
          <ModernAlert $variant="info" style={{ marginTop: '16px' }}>
            To replace this document, upload a new PDF file below.
          </ModernAlert>
        </CurrentDocumentContainer>
      ) : null}
      
      <UploadArea
        {...getRootProps()}
        $isDragging={isDragActive}
        style={{ marginTop: currentDocument ? '16px' : '0' }}
      >
        <input {...getInputProps()} />
        <UploadIcon>📖</UploadIcon>
        <UploadText>
          {currentDocument 
            ? 'Click or drag to upload a new reading document'
            : 'Click or drag to upload your reading document'
          }
        </UploadText>
        <FileTypeInfo>PDF files only (Max 20MB)</FileTypeInfo>
        {!selectedFile && (
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
              onClick={() => {
                setSelectedFile(null);
                setError(null);
              }}
              type="button"
              disabled={isUploading}
            >
              Remove
            </ModernButton>
          </SelectedFileContainer>
          
          <ModernButton             onClick={handleUpload}
            disabled={isUploading}
            style={{ marginTop: '16px', width: '100%' }}
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